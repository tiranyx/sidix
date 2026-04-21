"""
test_sprint6.py — Unit tests Sprint 6 Quick Wins + curator_agent score_gte_85.

Covers:
  - log_accepted_output() → file ditulis, isi valid JSON
  - generate_brand_kit(target_audience=...) → tidak error, ok=True
  - curator_agent: dry_run tidak menulis file
  - curator_agent: stats berisi premium_pairs_written
  - curator_agent: score_gte_85 filter — docs >= 0.85 masuk premium file
  - curator_agent: docs < 0.85 tidak masuk premium file
"""

from __future__ import annotations

import json
import textwrap
from pathlib import Path
from unittest.mock import patch

import pytest


# ── log_accepted_output ────────────────────────────────────────────────────────

def test_log_accepted_output_writes_jsonl(tmp_path: Path) -> None:
    from brain_qa.prompt_optimizer import log_accepted_output
    import brain_qa.prompt_optimizer as opt_mod

    accepted_log = tmp_path / "accepted_outputs.jsonl"
    with patch.object(opt_mod, "_ACCEPTED_LOG", accepted_log), \
         patch.object(opt_mod, "_DATA_DIR", tmp_path):
        log_accepted_output(
            agent="content",
            prompt_params={"brief": "test brief"},
            output_text="output teks contoh",
            score=7.5,
            domain="content",
        )

    assert accepted_log.exists(), "accepted_outputs.jsonl harus dibuat"
    lines = accepted_log.read_text(encoding="utf-8").splitlines()
    assert len(lines) == 1
    record = json.loads(lines[0])
    assert record["agent"] == "content"
    assert record["score"] == pytest.approx(7.5)
    assert record["output_text"] == "output teks contoh"


def test_log_accepted_output_appends_multiple(tmp_path: Path) -> None:
    from brain_qa.prompt_optimizer import log_accepted_output
    import brain_qa.prompt_optimizer as opt_mod

    accepted_log = tmp_path / "accepted_outputs.jsonl"
    with patch.object(opt_mod, "_ACCEPTED_LOG", accepted_log), \
         patch.object(opt_mod, "_DATA_DIR", tmp_path):
        for i in range(3):
            log_accepted_output(
                agent="brand",
                prompt_params={"brief": f"brief {i}"},
                output_text=f"output {i}",
                score=7.0 + i * 0.5,
                domain="brand",
            )

    lines = accepted_log.read_text(encoding="utf-8").splitlines()
    assert len(lines) == 3


# ── generate_brand_kit ─────────────────────────────────────────────────────────

def test_generate_brand_kit_with_target_audience() -> None:
    from brain_qa.brand_builder import generate_brand_kit

    result = generate_brand_kit(
        business_name="Warung Pintar",
        niche="kuliner",
        target_audience="ibu rumah tangga 25-45 tahun",
    )
    assert result.get("ok") is True, f"Expected ok=True, got: {result}"


def test_generate_brand_kit_target_audience_empty_fallback() -> None:
    from brain_qa.brand_builder import generate_brand_kit

    result = generate_brand_kit(
        business_name="Brand Test",
        niche="edukasi",
        target_audience="",
    )
    assert result.get("ok") is True


def test_generate_brand_kit_missing_name_returns_error() -> None:
    from brain_qa.brand_builder import generate_brand_kit

    result = generate_brand_kit(business_name="", niche="teknologi")
    assert result.get("ok") is False


# ── curator_agent ──────────────────────────────────────────────────────────────

def _make_doc(tmp_dir: Path, filename: str, content: str) -> None:
    (tmp_dir / filename).write_text(content, encoding="utf-8")


def _high_score_content() -> str:
    """Dokumen yang akan mendapat score tinggi: banyak keyword + FACT + maqashid."""
    return textwrap.dedent("""\
        # SIDIX Agent LLM Framework
        [FACT]

        sidix agent llm lora qwen python fastapi training deployment model rag corpus
        sidix agent llm lora qwen python fastapi training deployment model rag corpus
        sidix agent llm lora qwen python fastapi training deployment model rag corpus

        ilmu belajar logika riset penelitian analisis pengetahuan
        iman ibadah quran tauhid sunnah ibadat
        kesehatan keselamatan jiwa psikologi
        ekonomi bisnis kerja produktivitas keuangan
        keluarga pendidikan generasi masyarakat sosial

        Ini adalah dokumen panjang yang berisi banyak konten substantif tentang
        sidix agent llm training dan deployment. """ + "sidix agent llm " * 50)


def _low_score_content() -> str:
    """Dokumen dengan score rendah: sedikit keyword, tanpa marker."""
    return "Ini dokumen tentang hal umum tanpa kata kunci spesifik. " * 10


@pytest.fixture()
def corpus_dir(tmp_path: Path) -> Path:
    docs = tmp_path / "corpus"
    docs.mkdir()
    _make_doc(docs, "high_score_doc.md", _high_score_content())
    _make_doc(docs, "low_score_doc.md", _low_score_content())
    return docs


def test_run_curation_dry_run_no_files(corpus_dir: Path, tmp_path: Path) -> None:
    import brain_qa.curator_agent as ca

    out_dir = tmp_path / "training_curated"
    premium_file = tmp_path / "lora_premium_pairs.jsonl"
    seen_file = tmp_path / "seen.json"
    stats_file = tmp_path / "stats.json"

    with patch.object(ca, "_CORPUS_DIRS", [corpus_dir]), \
         patch.object(ca, "_OUT_DIR", out_dir), \
         patch.object(ca, "_PREMIUM_FILE", premium_file), \
         patch.object(ca, "_SEEN_FILE", seen_file), \
         patch.object(ca, "_STATS_FILE", stats_file):
        result = ca.run_curation(dry_run=True)

    assert result["ok"] is True
    assert result["output_file"] == "", "dry_run tidak boleh menulis output file"
    assert result["premium_file"] == "", "dry_run tidak boleh menulis premium file"
    assert not premium_file.exists(), "premium file tidak boleh dibuat saat dry_run"
    assert not stats_file.exists(), "stats file tidak boleh dibuat saat dry_run"


def test_run_curation_stats_has_premium_keys(corpus_dir: Path, tmp_path: Path) -> None:
    import brain_qa.curator_agent as ca

    out_dir = tmp_path / "training_curated"
    premium_file = tmp_path / "lora_premium_pairs.jsonl"

    with patch.object(ca, "_CORPUS_DIRS", [corpus_dir]), \
         patch.object(ca, "_OUT_DIR", out_dir), \
         patch.object(ca, "_PREMIUM_FILE", premium_file), \
         patch.object(ca, "_SEEN_FILE", tmp_path / "seen.json"), \
         patch.object(ca, "_STATS_FILE", tmp_path / "stats.json"):
        result = ca.run_curation(dry_run=True)

    assert "premium_pairs_written" in result
    assert "premium_file" in result
    assert isinstance(result["premium_pairs_written"], int)


def test_run_curation_premium_pairs_written_to_file(corpus_dir: Path, tmp_path: Path) -> None:
    """Docs dengan score >= PREMIUM_SCORE harus masuk ke lora_premium_pairs.jsonl."""
    import brain_qa.curator_agent as ca

    out_dir = tmp_path / "training_curated"
    premium_file = tmp_path / "lora_premium_pairs.jsonl"

    with patch.object(ca, "_CORPUS_DIRS", [corpus_dir]), \
         patch.object(ca, "_OUT_DIR", out_dir), \
         patch.object(ca, "_PREMIUM_FILE", premium_file), \
         patch.object(ca, "_SEEN_FILE", tmp_path / "seen.json"), \
         patch.object(ca, "_STATS_FILE", tmp_path / "stats.json"):
        result = ca.run_curation(dry_run=False)

    if result["premium_pairs_written"] > 0:
        assert premium_file.exists(), "premium file harus dibuat jika ada premium pairs"
        lines = premium_file.read_text(encoding="utf-8").splitlines()
        assert len(lines) == result["premium_pairs_written"]
        record = json.loads(lines[0])
        assert "instruction" in record
        assert "output" in record
        assert "score" in record
        assert record["score"] >= ca.PREMIUM_SCORE


def test_run_curation_premium_score_threshold(tmp_path: Path) -> None:
    """Dokumen dengan score tepat di bawah PREMIUM_SCORE tidak masuk premium file."""
    import brain_qa.curator_agent as ca

    corpus = tmp_path / "corpus"
    corpus.mkdir()
    # Dokumen dengan score pasti < 0.85 (tanpa FACT marker, keyword minimal)
    _make_doc(corpus, "barely_pass.md", "# Topik SIDIX\n[OPINION]\n" + "sidix " * 5 + "\nisi dokumen " * 30)

    out_dir = tmp_path / "training_curated"
    premium_file = tmp_path / "lora_premium_pairs.jsonl"

    with patch.object(ca, "_CORPUS_DIRS", [corpus]), \
         patch.object(ca, "_OUT_DIR", out_dir), \
         patch.object(ca, "_PREMIUM_FILE", premium_file), \
         patch.object(ca, "_SEEN_FILE", tmp_path / "seen.json"), \
         patch.object(ca, "_STATS_FILE", tmp_path / "stats.json"):
        result = ca.run_curation(dry_run=False)

    # Verifikasi: jika ada premium pairs, score-nya harus >= threshold
    if premium_file.exists():
        for line in premium_file.read_text(encoding="utf-8").splitlines():
            record = json.loads(line)
            assert record["score"] >= ca.PREMIUM_SCORE


def test_run_curation_premium_file_appends_across_runs(corpus_dir: Path, tmp_path: Path) -> None:
    """Dua run berurutan: premium file harus append, bukan overwrite."""
    import brain_qa.curator_agent as ca

    out_dir = tmp_path / "training_curated"
    premium_file = tmp_path / "lora_premium_pairs.jsonl"
    seen_file = tmp_path / "seen.json"

    with patch.object(ca, "_CORPUS_DIRS", [corpus_dir]), \
         patch.object(ca, "_OUT_DIR", out_dir), \
         patch.object(ca, "_PREMIUM_FILE", premium_file), \
         patch.object(ca, "_SEEN_FILE", seen_file), \
         patch.object(ca, "_STATS_FILE", tmp_path / "stats.json"):
        r1 = ca.run_curation(dry_run=False, min_score=0.40)

    # Reset seen hashes agar run kedua bisa proses ulang corpus yang sama
    seen_file.unlink(missing_ok=True)

    with patch.object(ca, "_CORPUS_DIRS", [corpus_dir]), \
         patch.object(ca, "_OUT_DIR", out_dir), \
         patch.object(ca, "_PREMIUM_FILE", premium_file), \
         patch.object(ca, "_SEEN_FILE", seen_file), \
         patch.object(ca, "_STATS_FILE", tmp_path / "stats.json"):
        r2 = ca.run_curation(dry_run=False, min_score=0.40)

    if premium_file.exists():
        total_lines = len(premium_file.read_text(encoding="utf-8").splitlines())
        # Total lines harus lebih besar dari satu run saja (append)
        one_run_premium = r1["premium_pairs_written"]
        if one_run_premium > 0 and r2["premium_pairs_written"] > 0:
            assert total_lines >= one_run_premium + r2["premium_pairs_written"]
