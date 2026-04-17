# PRD — Mighan-brain-1 (Brain Pack + AI Workspace)

## 1) Problem statement
Pengguna ingin:
- Satu aplikasi untuk chat, generate gambar, voice, dan agent automation.
- Bisa jalan di laptop / VPS murah.
- Tidak bergantung pada banyak langganan berbeda.
- Bisa open-source dan dikembangkan komunitas, dengan “brain pack” (`Mighan-brain-1`) sebagai sumber pengetahuan pribadi.

## 2) Goals
- **G1**: UI “satu pintu” untuk Text, Image, Voice.
- **G2**: Agent runner yang bisa pakai tools (browser, file, terminal) dengan izin.
- **G3**: Knowledge base (RAG) untuk “belajar” dari dokumen.
- **G3b**: Brain pack terstruktur (memory cards + datasets) untuk konsistensi “cara berpikir”.
- **G4**: Observability dasar: log, cost estimation, tracing tindakan agent.
- **G5**: Open-source ready: kontribusi mudah, modular, dokumentasi jelas.

## 3) Non-goals (fase awal)
- Training LLM dari nol.
- “Auto self-improve” yang bisa mengubah codebase tanpa review.
- Marketplace plugin yang kompleks (mulai dari plugin lokal dulu).

## 4) Personas
- **P1 Non-coder Creator**: ingin prompt, gambar, voice, dan workflow sederhana.
- **P2 Developer**: ingin agent untuk coding/research, integrasi Git, tool gating.
- **P3 Ops/Admin**: ingin kontrol biaya, audit log, rate limit, user management.
- **P4 Community Maintainer**: ingin struktur repo yang rapi, issue triage, roadmap.

## 5) User journeys (ringkas)
- **J1 Chat**: user buka app → pilih model → chat → export/share.
- **J2 Image**: user pilih model image → prompt + style preset → generate → gallery.
- **J3 Voice**: user bicara → STT → AI jawab → TTS.
- **J4 RAG**: user upload dokumen → indexing → tanya berbasis dokumen.
- **J5 Agent**: user pilih “agent template” → set tools allowed → jalankan → lihat log.

## 6) Functional requirements (P0–P3)

### P0 — MVP
- **Auth & workspace**
  - Login sederhana (local-only) atau “single-user mode” dulu.
  - Workspace/project: kumpulan chat, files, knowledge base, agent runs.
- **Chat (Text)**
  - Model selection: provider API dan local model.
  - Streaming response.
  - Conversation history + search.
- **Image generation**
  - Minimal 1 backend image: “external API” atau “local backend (jika tersedia)”.
  - Prompt builder: negative prompt, aspect ratio, seed.
  - Gallery: simpan metadata prompt.
- **Voice**
  - STT: upload audio/record → transcribe.
  - TTS: hasil jawaban → audio output.
- **Agent runner (basic)**
  - ReAct-style tool calling.
  - Tool permission gate per-run.
  - Run log: langkah-langkah, tool input/output ringkas.
- **Knowledge base (basic RAG)**
  - Upload file (pdf/txt/md) → chunk → embed → retrieve.
  - “Cite sources” dari dokumen internal.

### P1 — Usability & safety
- **Role-based permissions** (multi-user)
- **Rate limiting** per user/workspace
- **Secrets management** (API keys) terenkripsi
- **Redaction** untuk data sensitif di log
- **Agent templates**: Research, Support, Coding-lite, Content

### P2 — Dev features
- **Coding agent**: repo sandbox + patch proposal + test command suggestions
- **Browser automation**: Playwright runner (sandbox)
- **Integrasi Git**: open PR / commit helper (opsional)
- **Model router**: fallback model (hemat vs kualitas)

### P3 — Ecosystem
- Plugin registry (manifest) untuk tools/agents
- Cloud deploy presets (Docker compose)

## 7) Success metrics
- Time-to-first-value < 15 menit (install → chat jalan).
- 80% agent runs selesai tanpa error tooling.
- RAG: jawaban dengan sitasi dokumen untuk query yang relevan.
- Cost visibility: estimasi biaya per chat/run untuk provider API.

## 8) Risks & mitigations
- **Biaya API meledak** → budget cap, token limit, warning, caching.
- **Tooling berbahaya (rm -rf, exfiltration)** → allowlist + sandbox + approval step.
- **Kompleksitas terlalu luas** → strict MVP scope, fase bertahap.

## 9) Open-source strategy (ringkas)
- License: MIT.
- Contribution: issue templates, PR checklist, CODEOWNERS (opsional).
- Governance: maintainer + RFC process untuk fitur besar.

