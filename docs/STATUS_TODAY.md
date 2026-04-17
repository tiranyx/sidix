# Status hari ini

> **Cara pakai**: setiap kali fokus proyek berganti (atau minimal seminggu sekali), perbarui blok di bawah — terutama **Terakhir diperbarui**, **Fase**, **Fokus**, **Blocker**, **Next**. Ini bukan auto-generated; isi manual agar tetap jujur untuk orang baru.

## Ringkasan

| Field | Isi |
|--------|-----|
| **Terakhir diperbarui** | 2026-04-15 |
| **Fase** | **P2 → gate v1:** runtime agent + UI produksi-build hijau; inferensi LoRA **siap di kode**, bobot fisik opsional untuk “v1 demo” (mock+RAG tetap sah sebagai rilis perdana bila di dokumentasikan). |
| **Fokus sekarang** | **24 jam ke perdana v1:** urutkan gate di bawah § “Pre-rilis v1”; jangan melebarkan scope ke parity Cursor. |
| **Blocker** | (1) **`adapter_model.safetensors`** belum di `apps/brain_qa/models/sidix-lora-adapter/` → `/agent/generate` tetap mock. (2) Skrip `cleanup-personal-corpus.bat` / `setup-startup-fetch.bat` belum di mesin operator. (3) `kaggle.json` hanya di mesin lokal — pull kernel/dataset dari CI agen tanpa secret tidak bisa. |
| **Next (3)** | (1) Salin zip adapter Kaggle ke folder adapter + pasang deps inference (lihat `SPRINT_SIDIX_2H.md` A1–A2). (2) Satu smoke manual: `serve` + UI `npm run dev` + satu thread ask. (3) Tulis satu kalimat “apa yang v1” di README atau `00_START_HERE` bila rilis = mock+RAG. **QA otomatis terakhir:** golden smoke OK, `pytest` 53/53, `npm run build` OK — `LIVING_LOG` § 2026-04-15 (pre-launch). |

## Yang sudah jalan (cek cepat)

- **Agent Runtime**: `agent_tools.py` (Tool Registry), `agent_react.py` (ReAct Loop), `agent_serve.py` (FastAPI port 8765)
- **SIDIX UI**: `SIDIX_USER_UI/` — Vite + Tailwind, port 3000, 5 persona selector; **`npm run build`** (produksi) lulus terakhir dicek agen
- **Full stack**: UI (3000) ↔ Backend (8765) — confirmed live
- **Corpus**: 26+ research notes + auto-fetch Wikipedia infrastructure
- **MIGHAN corpus**: `research_notes/26_mighan_creative_ai_tools.md` — knowledge AI creative tools
- **Startup fetch**: `startup-fetch.py` + `startup-fetch.bat` (belum aktif di Task Scheduler)
- **Kaggle fine-tune**: run `sidix-gen` / `notebooka2d896f453` — **selesai di sisi notebook** (713 sampel); yang tersisa = **unduh bobot** ke repo lokal
- CLI `apps/brain_qa`: index, ask, fetch, curate, validate, ledger, storage — lihat `apps/brain_qa/README.md`
- Dokumen produk: `docs/01`–`08`; handoff: `docs/HANDOFF-2026-04-17.md`; living log: `docs/LIVING_LOG.md`

## Pre-rilis v1 (jendela ~24 jam) — definisi jujur

**“Perdana v1” minimal (diterima sebagai rilis):** stack hidup — `brain_qa serve` + `SIDIX_USER_UI` + RAG/ReAct + `/health` jujur (`model_mode` mock vs `local_lora`) + dokumentasi satu paragraf apa yang user dapatkan.

| Gate | Isi | Status |
|------|-----|--------|
| G0 | **QA otomatis:** `run_golden_smoke.py` + `pytest tests/` | Hijau (sesi agen 2026-04-15) |
| G1 | **UI build:** `npm run build` di `SIDIX_USER_UI` | Hijau |
| G2 | **Bobot LoRA** di `sidix-lora-adapter/` + deps torch/peft | Tergantung unduhan Anda |
| G3 | **Smoke manual** A1–A3 (`SPRINT_SIDIX_2H.md`) | Isi di `SPRINT_LOG_SIDIX.md` |
| G4 | **Korpus / privasi:** skrip cleanup + startup fetch bila dipakai | Menunggu operator |
| G5 | **Narasi rilis:** tag v1 di git + satu baris CHANGELOG “SIDIX v1” | Opsional malam luncur |

**Yang sengaja tidak di-scope v1:** multi-tab Composer, plugin Cursor, stream token penuh dari base model (lihat backlog di `SPRINT_SIDIX_2H.md`).

---

## Link cepat

- [Mulai di sini (prolog + peta baca)](00_START_HERE.md)
- [**HANDOFF sesi ini**](HANDOFF-2026-04-17.md) ← baca ini dulu
- [Rencana eksekusi (fase & checklist)](10_execution_plan.md)
- [CHANGELOG](CHANGELOG.md) · [LIVING_LOG](LIVING_LOG.md)
- [PRD](02_prd.md) · [Roadmap](06_roadmap.md)
