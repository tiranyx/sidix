# Panduan Kontribusi SIDIX

Terima kasih sudah mau berkontribusi! Dokumen ini menjelaskan cara setup dev environment, standar kode, dan proses PR.

---

## Daftar Isi

1. [Setup Dev Environment](#1-setup-dev-environment)
2. [Cara Berkontribusi](#2-cara-berkontribusi)
3. [Standar Kode](#3-standar-kode)
4. [Testing](#4-testing)
5. [Commit & PR](#5-commit--pr)
6. [Etika Kontribusi](#6-etika-kontribusi)

---

## 1. Setup Dev Environment

### Prerequisites

```bash
Python 3.11+
Node.js 18+
Git
```

### Fork & clone

```bash
# Fork dulu di GitHub, lalu:
git clone https://github.com/YOUR_USERNAME/sidix.git
cd sidix
git remote add upstream https://github.com/fahmiwol/sidix.git
```

### Install backend

```bash
cd apps/brain_qa
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate

pip install -r requirements.txt
pip install -r requirements-dev.txt   # pytest, ruff, etc.
```

### Build index & jalankan

```bash
python -m brain_qa index    # build BM25 dari brain/public/
python -m brain_qa serve    # start API port 8765
```

### Install frontend

```bash
cd ../../SIDIX_USER_UI
npm install
npm run dev    # start UI port 3000
```

### Verifikasi setup

```bash
# Quick smoke test
cd apps/brain_qa
python -m brain_qa ask "apa itu SIDIX?"
# Harus muncul jawaban, bukan error
```

---

## 2. Cara Berkontribusi

### A. Tambah Research Note (paling mudah untuk pemula!)

Research notes adalah file Markdown di `brain/public/research_notes/`. Format:

```markdown
# Research Note [N] — [Judul Topik]

**Tanggal**: YYYY-MM-DD
**Sumber**: [nama sumber / pengetahuan teknis]
**Relevance SIDIX**: [satu paragraf mengapa relevan untuk SIDIX]
**Tags**: `tag1`, `tag2`, `tag3`

---

## 1. [Section Utama]
...

## N. Implikasi untuk SIDIX
...

## Ringkasan untuk Corpus SIDIX
```KEYWORD CLUSTERS:
- keyword1: term1, term2, term3
- keyword2: ...
```
```

**Aturan:**
- Bahasa: Indonesia + English (Indonesia untuk penjelasan, English untuk nama teknis)
- Minimum 150 baris
- Sertakan contoh kode nyata di mana relevan
- Tidak boleh berisi data personal atau informasi sensitif
- Sumber harus bisa diverifikasi (Wikipedia, dokumentasi resmi, paper akademik, dll.)

Setelah tambah note, reindex:
```bash
cd apps/brain_qa && python -m brain_qa index
```

### B. Tambah Tool Baru ke Agent

Tools ada di `apps/brain_qa/brain_qa/agent_tools.py`. Setiap tool:

```python
@register_tool(
    name="nama_tool",
    description="Deskripsi singkat",
    required_params=["param1"],
    restricted=False,  # True = butuh allow_restricted=True dari client
)
def _tool_nama(args: dict, session_id: str, step: int) -> ToolResult:
    """
    Implementasi tool.
    Returns ToolResult(success=bool, output=str, error=str, citations=list)
    """
    try:
        result = ...  # logika tool
        return ToolResult(success=True, output=str(result))
    except Exception as e:
        return ToolResult(success=False, error=str(e))
```

Wajib:
- Tidak boleh akses internet kecuali ke allowlist host yang sudah disetujui
- Harus ada test di `apps/brain_qa/tests/`
- Dokumentasikan di docstring

### C. Perbaiki Bug

1. Buka issue dulu (jelaskan bug + steps to reproduce)
2. Tunggu konfirmasi dari maintainer
3. Fork, fix, buat PR

### D. Improve UI

Frontend ada di `SIDIX_USER_UI/`. Stack: TypeScript + Vite + vanilla TS (tidak pakai framework besar).

```bash
cd SIDIX_USER_UI
npm run dev     # development
npx tsc --noEmit  # type check
```

### E. Tambah Test

```bash
# Jalankan test suite
cd apps/brain_qa
python -m pytest tests/ -v

# Test epistemologi (comprehensive)
python _qa_suite.py
```

Test baru:
- Taruh di `apps/brain_qa/tests/test_*.py`
- Gunakan `SIDIX_USE_MOCK_LLM=1` environment variable untuk skip model loading
- Target: setiap fungsi publik punya minimal 1 test

---

## 3. Standar Kode

### Python

- Formatter: `ruff format` (dikonfigurasi di `.pre-commit-config.yaml`)
- Linter: `ruff check`
- Type hints: wajib untuk fungsi publik
- Docstring: Google style
- Line length: 100 karakter

```bash
# Jalankan sebelum commit
ruff check apps/brain_qa/brain_qa/
ruff format apps/brain_qa/brain_qa/
```

### TypeScript

```bash
cd SIDIX_USER_UI
npx tsc --noEmit    # harus 0 error
```

### Markdown (research notes)

- Maksimum 1 baris kosong antar paragraf
- Tabel pakai format Markdown standar
- Heading: H2 untuk section utama, H3 untuk subsection

### Prinsip umum

- **Own-stack first**: jangan tambah dependency ke vendor API (OpenAI, Anthropic, Google AI) tanpa diskusi dulu
- **Non-fatal**: setiap modul baru harus punya try/except yang mencegah crash pipeline utama
- **Offline capable**: fitur core harus bisa jalan tanpa internet

---

## 4. Testing

### Sebelum submit PR, pastikan:

```bash
# 1. Epistemology QA suite (111 tests)
cd apps/brain_qa
python _qa_suite.py
# → harus: 111/111 PASS

# 2. Unit tests
python -m pytest tests/ -q
# → harus: semua PASS

# 3. User intelligence self-test
python brain_qa/user_intelligence.py
# → harus: ALL PASS

# 4. TypeScript check (kalau ada perubahan UI)
cd ../../SIDIX_USER_UI && npx tsc --noEmit
```

### Environment variables untuk testing

```bash
# Skip model loading (pakai mock LLM)
SIDIX_USE_MOCK_LLM=1 python -m pytest tests/ -v
```

---

## 5. Commit & PR

### Format commit message

```
type(scope): deskripsi singkat (maks 72 karakter)

Body opsional — jelaskan WHY, bukan what.
```

**Types**: `feat`, `fix`, `doc`, `test`, `refactor`, `perf`, `chore`

**Contoh:**
```
feat(agent): tambah tool translate_text untuk terjemahan ID/AR/EN
fix(epistemology): perbaiki false positive maqashid pada pertanyaan medis
doc(notes): tambah research note 51 tentang WebAssembly
```

### Proses PR

1. **Buat branch** dari `main`:
   ```bash
   git checkout -b feat/nama-fitur
   ```

2. **Commit** dengan pesan yang jelas

3. **Push** ke fork kamu:
   ```bash
   git push origin feat/nama-fitur
   ```

4. **Buat PR** ke `main` dengan:
   - Judul: sama dengan format commit
   - Body: jelaskan apa yang berubah dan kenapa
   - Checklist: ✅ test lulus, ✅ tidak ada data personal, ✅ tidak ada API key

5. **Review**: maintainer akan review dalam 2-7 hari

### PR yang langsung ditolak

- Mengandung API key atau secret
- Mengandung data personal
- Menambah dependency vendor AI tanpa diskusi
- Tidak ada test untuk fitur baru
- Corpus note tanpa sumber yang bisa diverifikasi

---

## 6. Etika Kontribusi

SIDIX dibangun di atas nilai-nilai:

- **Kejujuran (Sidq)**: jangan klaim sesuatu yang tidak bisa diverifikasi
- **Amanah**: jaga kepercayaan pengguna, tidak eksploitasi data
- **Tabligh**: dokumentasikan dengan jelas dan jujur keterbatasan sistem
- **Fathanah**: pertimbangkan dampak jangka panjang sebelum merge

Kontribusi yang bertentangan dengan Maqashid Syariah (membahayakan jiwa, akal, kehormatan, dll.) tidak akan diterima.

---

## Pertanyaan?

- Buka [GitHub Issue](../../issues) untuk diskusi teknis
- Research notes dan roadmap: lihat `docs/`
- LIVING_LOG untuk history keputusan arsitektur: `docs/LIVING_LOG.md`

*Jazakallah khayran / Terima kasih / Thank you*
