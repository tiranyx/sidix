# SIDIX Checkpoint — 2026-04-19 (Mid-Session Snapshot)

> **Tujuan file ini**: snapshot lengkap progress + plan agar siapapun bisa
> langsung lanjut tanpa scroll history panjang. Update file ini setiap chapter
> besar selesai — JANGAN biarkan stale.

---

## 🎯 Ringkasan Status (1-paragraf)

SIDIX sudah punya **Fase 1-6 jalan di production** (`ctrl.sidixlab.com` +
`app.sidixlab.com`): LLM + Generative AI + Agent AI + continual learning
otomatis (cron 03:00) + multi-modal + skill modes + decision engine + sanad/
hafidz integrity + curriculum 13 domain × 10 topik + skill registry 39 modul
auto-discovered + opsec masking. Frontend sudah bersih dari identitas owner.
Sedang dalam **alignment audit** — bandingkan visi awal (PRD/IHOS/hafidz)
vs kondisi sekarang, untuk tulis SIDIX_BIBLE konstitusi hidup.

---

## ✅ Yang SUDAH Selesai (sesi ini, 2026-04-18 → 2026-04-19)

### Fase 3 — Autonomous Research (commit 070b29a)
- `autonomous_researcher.py` — pipeline gap → angles → 5 POV → web → narator → memory
- `note_drafter.py` — bundle → draft → approve → publish + auto-resolve gap
- `web_research.py` — DDG + Wikipedia + domain quality scoring + dedupe
- 5 lensa multi-perspective: kritis, kreatif, sistematis, visioner, realistis
- Memori persisten `.data/sidix_memory/<domain>.jsonl`
- Notes 132-134

### Fase 4 — Daily Continual Learning (commit c08fcb7)
- `daily_growth.py` — siklus 7 tahap: SCAN→RISET→APPROVE→TRAIN→SHARE→REMEMBER→LOG
- Quality gate auto-approve (≥6 findings, narrative ≥250 char)
- Pipe ke training pairs (ChatML jsonl) + Threads queue
- Cron `0 3 * * * curl -X POST /sidix/grow?top_n_gaps=3` di server
- Note 139

### Fase 4.5 — Sanad + Hafidz (commit 5ba0876)
- `sanad_builder.py` — SanadEntry + SanadMetadata (matn, isnad, tabayyun, hafidz_proof)
- Setiap approved note → auto register ke `hafidz_mvp` (CAS hash + Merkle root + 5 erasure shares)
- Sanad section embedded ke akhir markdown note
- 4 endpoint `/hafidz/{stats,verify,sanad/{stem},retrieve/{cas_hash}}`
- Notes 141, 138, 140 (138/140 = sample auto-generated)

### Fase 5 — Multi-Modal + Skill Modes (commit a394f8c)
- `multi_modal_router.py` — vision/OCR/image-gen/TTS/ASR (Gemini/Groq/Anthropic/Pollinations/gTTS)
- `skill_modes.py` — 5 mode (fullstack_dev, game_dev, problem_solver, decision_maker, data_scientist)
- `decide_with_consensus()` multi-voter
- Note 142 (manifesto mandiri)

### Fase 5.5 — Opsec + LoRA + Threads Consumer (commit e9999d2)
- `identity_mask.py` — mask provider name (groq → mentor_alpha, gemini → mentor_beta, dst.)
- `auto_lora.py` — threshold 500 pairs → batch siap upload Kaggle
- `threads_consumer.py` — pick up `growth_queue.jsonl` → post via threads_oauth
- Ollama Vision support (llava/moondream/bakllava) di multi_modal_router
- /health endpoint masked: `llm_providers` + `ollama` HILANG, ganti `internal_mentor_pool` + `sidix_local_engine`
- CHANGELOG.md publik + landing roadmap update
- Note 143

### Fase 6 — Curriculum + Skill Builder (commit be80422)
- `curriculum_engine.py` — 13 domain × 10 topik = 130 topik berurutan
  - Domain: coding_python/js, fullstack, frontend_design, backend_devops, game_dev,
    data_science, image_ai, video_ai, audio_ai, research_methodology,
    general_knowledge, islamic_epistemology
  - LessonPlan idempotent per hari, rotation 13-hari/cycle, deepening setelah cycle
  - State persistent `.data/curriculum/progress.json`
- `skill_builder.py` — discover_skills auto-scan + run_skill + harvest_dataset_jsonl + extract_lessons_from_note
- 11 endpoint baru `/sidix/curriculum/*` + `/sidix/skills/*`
- 4 skill manifest contoh + auto-discover 35 dari `apps/{vision,image_gen}/*.py` = **39 skill total**
- `harvest_drive_d_datasets.py` — adopt 4 dataset Drive D
- `daily_growth.use_curriculum=True` default — kalau gap kosong, pakai curriculum lesson
- Note 144

### Fix Anonymity Frontend (commit 400fa98 + d2af44b)
- Placeholder "Fahmi Wolhuter" → "Nama kamu"
- Schema author / twitter:creator → Mighan Lab / @sidixlab
- Privacy.html: Mighan Lab, IP `72.62.125.6` HILANG, contact@sidixlab.com, @sidixlab
- `FREE_CHAT_LIMIT` 1 → 5 (chat-first ramah, login modal hanya saat limit)
- Onboarding pesan: "Hubungi Fahmi" → "Hubungi tim SIDIX"
- Sync `/opt/sidix/SIDIX_LANDING/*` → `/www/wwwroot/sidixlab.com/*` (aaPanel)
- Verify live OK: privacy clean, meta clean

### Total kumulatif sesi
- **12 commit** push ke origin/main (070b29a → d2af44b)
- **13 modul Python baru** (autonomous_researcher, note_drafter, web_research, daily_growth, sanad_builder, identity_mask, auto_lora, threads_consumer, multi_modal_router, skill_modes, curriculum_engine, skill_builder, daily_growth)
- **13 research notes baru** (132 → 144)
- **~46 endpoint baru** terdaftar di /openapi.json
- **39 skill** auto-registered
- **130 topik curriculum** terjadwal

---

## 📋 Yang SEDANG Dikerjakan (in-flight)

### Alignment Audit (sesi current)
**Status**: hasil eksplorasi 15 dokumen foundational sudah didapat dari Explore agent.

**Hasil ringkas alignment audit (dari agent + framework_living.md)**:

#### A. Visi Asli SIDIX
"Agen jawaban epistemik" (bukan chatbot) yang menjawab dengan jejak sumber
(RAG + citations), bekerja bertahap (ReAct), tools whitelisted, status jujur
(/health). Modular, cost-aware, jalan lokal. Bukan menggantikan training
besar — orchestrator + RAG + light fine-tune.

#### B. Prinsip Epistemik Islami yang Diadopsi
- **IHOS**: Ruh→Qalb→Akal→Nafs→Jasad sebagai pipeline keputusan
- **Sanad/Isnad**: chain of custody + citation + provenance
- **Tabayyun**: imperatif verifikasi sebelum jawab
- **Maqashid 5-pokok**: hifdz al-din/nafs/'aql/nasl/mal sebagai filter alignment
- **Hafidz Method**: dual oral (vector) + written (storage), redundancy 1400 thn
- **Qada/Qadar**: bounded agency, ikhtiar maksimal + tawakkal hasil
- **Prophetic Pedagogy**: 7 metode Nabi → arsitektur belajar
- **DIKW + Hikmah axis**: Data→Info→Knowledge→Wisdom dengan hikmah memotong semua

#### C. Cognitive Modes (Quranic) di IHOS
1. Nazhar — observasi tanpa prasangka
2. Tafakkur — refleksi logis sebab-akibat
3. Tadabbur — pendalaman makna dan implikasi
4. Ta'aqqul — keputusan rasional dengan akuntabilitas

#### D. Mapping Lengkap Islamic ↔ SIDIX
| Islamic | SIDIX |
|---------|-------|
| Sanad | Citation chain + CID + provenance |
| Matn | Cross-corpus consistency check |
| Jarh wa Ta'dil | Reputation engine (adalah + dhabt) |
| Mutawatir/Ahad | Confidence scoring (qath'i vs zanni) |
| Tabayyun | Pre-filter epistemology engine |
| Ijma' | Byzantine-robust aggregation |
| Ijtihad | ReAct loop + source grounding |
| Qiyas | 4-component inference (ashl/far'/hukm/'illah) |
| Maqashid | 5-axis multi-value evaluation |
| Hikmah | Audience-adaptive output |
| Hifdz | P2P k-of-n redundancy |

#### E. SIDIX Identity (4 label epistemik)
- `[FACT]` — ada sumber, bisa diverifikasi
- `[OPINION]` — reasoning dari fakta, diklaim sebagai pendapat
- `[SPECULATION]` — dugaan, label jelas
- `[UNKNOWN]` — jujur akui tidak tahu

**= Shiddiq (الصديق, sumber kebenaran) + Al-Amin (الأمين, dapat dipercaya)**

#### F. Gap yang Dilihat Antara Visi Awal vs Sekarang
1. **Skala MVP vs P2P ambisi**: PRD MVP "orchestrator + RAG + agent" tapi epistemology doc ambisi "P2P Byzantine-robust + Proof-of-Hifdz consensus" — milestone break belum jelas. **Kondisi sekarang**: MVP jalan, Hafidz local-only, P2P belum.
2. **"Bukan training besar" vs "Self-improving SPIN loop"**: vision bilang bukan latih model, tapi growth manifesto SPIN loop. **Kondisi sekarang**: kompromi via LoRA-centric (sidix-lora di Ollama, training pairs harvest harian).
3. **Epistemic labeling vs RAG confidence float**: docs minta `[FACT]/[OPINION]/[SPECULATION]/[UNKNOWN]`, tapi confidence float 0-1. **Kondisi sekarang**: confidence float di sanad, label epistemic belum konsisten di output runtime.
4. **IHOS layer (Ruh→Qalb→Akal→Nafs→Jasad)**: belum tergambar eksplisit di pipeline reasoning. Sekarang reasoning langsung Akal-only.
5. **Prophetic Pedagogy 7 metode**: hanya `tadarruj` (curriculum) yang ter-implement. 6 lainnya belum.

---

## 🚀 Yang AKAN Dikerjakan (queue prioritas)

### High Impact (segera)
1. **Tulis `docs/SIDIX_BIBLE.md`** — konstitusi hidup yang mengikat semua keputusan
   - Section: Mandate, IHOS-as-architecture, 4-label epistemic, Maqashid filter,
     Sanad-required, Identity Shield, Mandiri trajectory, Growth-hack rules
2. **Tulis `docs/RULES.md`** — aturan operasional turunan
   - Per fitur baru: harus lulus IHOS check + Maqashid filter + epistemic label test
3. **Tulis `research_note 145`** — alignment audit + adaptasi (publik di corpus)
4. **Update `CLAUDE.md`** — point ke SIDIX_BIBLE sebagai SSOT
5. **5-7 keputusan growth-hack** untuk akselerasi SIDIX:
   - Misalnya: implement `[FACT]/[OPINION]` label di output otomatis
   - Misalnya: tambah Maqashid filter sebelum approve_draft
   - Misalnya: IHOS layer di reasoning pipeline (ruh-purpose, qalb-values, akal-logic, nafs-bias-check, jasad-execute)

### Medium Impact (next week)
- Auto-sync `/opt/sidix/SIDIX_LANDING/*` → `/www/wwwroot/sidixlab.com/*` (post-merge git hook)
- Email contact@sidixlab.com setup (DNS MX Cloudflare)
- Claim handle @sidixlab di Threads
- Pertimbangan: rename GitHub repo atau bikin org "Mighan Lab"
- Threads queue consumer scheduler (sekarang manual via /sidix/threads-queue/consume)

### Long-Term (forward)
- LoRA fine-tune cycle (auto-trigger saat training_generated > 500 pairs)
- P2P Hafidz: sync Merkle ledger antar node
- Implementasi 6 metode Prophetic Pedagogy lainnya (selain tadarruj)
- Multi-language: Arabic + English support sesuai PRD

---

## 🗺️ State File Penting

- **CLAUDE.md** — instruksi permanen, tetap valid
- **docs/LIVING_LOG.md** — log harian (perlu update setelah setiap chapter)
- **C:\Users\ASUS\.claude\projects\D--MIGHAN-Model\memory\framework_living.md** — framework hidup (already exists)
- **docs/SIDIX_CHECKPOINT_2026-04-19.md** — file ini (snapshot lengkap)
- **brain/public/research_notes/132-144** — corpus epistemic
- **CHANGELOG.md** — publik untuk kontributor (v0.1-v0.5)

## 🔑 Commit Pointer

```
d2af44b doc: closure log deploy verifikasi live anonymity
400fa98 fix(opsec): anonymize frontend placeholders + raise chat limit to 5
be80422 feat: Fase 6 curriculum_engine + skill_builder + Drive D adoption
e9999d2 feat: opsec masking + ollama vision + auto-lora + threads consumer + landing/changelog
b2153df doc: note 143 + log sprint 20m opsec+lora+threads consumer
1936c92 doc: log sprint multi-modal + test script + planning mandiri
a394f8c feat: Fase 5 multi-modal + skill modes + decision engine
4c5372b doc: note 141 integrasi sanad+hafidz + log sprint lanjutan
5ba0876 feat: integrasi Sanad + Hafidz untuk setiap note approved
6bee103 doc: note 139 daily_growth + log sprint 15 menit Fase 4
c08fcb7 feat: Fase 4 daily_growth — SIDIX tumbuh tiap hari otomatis
070b29a feat: Fase 3 self-learning pipeline + research notes 132-137
```

## 📌 Cara Lanjut dari File Ini

Setiap sesi baru / continue, baca file ini DULU sebelum mulai. Lalu:
1. Baca section "SEDANG Dikerjakan" untuk tahu what's in-flight
2. Pick salah satu item dari "AKAN Dikerjakan" (high impact dulu)
3. Update file ini saat selesai (move from queue → done)
4. Update LIVING_LOG dengan detail teknis

**Aturan**: jangan mulai task baru kalau ada item "in-flight" yang belum
selesai — finish dulu, update checkpoint, baru ambil yang baru.

---

## 📜 Metodologi Validasi Catatan SIDIX (Adopsi `hadith_validate.py`)

> User mandate: "kalau ga mencatat, SIDIX selalu kehilangan memori, selalu
> mengulang. Ada riset bagaimana cara sunnah, hadits dan quran divalidasi —
> harusnya dokumennya ada. Pernah dibuat Cursor. Biar selalu ada catatan
> yang valid, tidak ambigu."

### Sumber Metodologi
File `apps/brain_qa/brain_qa/hadith_validate.py` — sudah dibuat sebelumnya
(kemungkinan oleh sesi Cursor). Modul ini memvalidasi teks (hadits/qur'an)
terhadap corpus dengan:
- BM25 retrieval top-k candidates
- Overlap ratio (Jaccard antar tokens)
- Substring hit (eksak match)
- Norm mode (Arabic-aware atau plain)

### Label Validasi (5 kategori, NO AMBIGUITY)
| Label | Makna | Implikasi |
|-------|-------|-----------|
| `matched` | Substring hit ATAU overlap ≥0.55 | Catatan terverifikasi |
| `partial` | Overlap ≥ min_threshold tapi < 0.55 | Perlu cek manual |
| `not_found` | Tidak ada di corpus | Klaim baru, perlu diuji ulang |
| `conflict_suspected` | ≥3 sumber dengan content beda | Ada kontradiksi sumber |
| `popular_snippet_suspected` | Fragment pendek + match banyak tempat | Mungkin clip taken-out-of-context |

### ATURAN CATATAN SIDIX (turunan dari metodologi ini)

**1. Setiap catatan/note WAJIB punya:**
- Tanggal eksplisit (ISO YYYY-MM-DD)
- Domain/kategori
- Sumber (kalau dari riset) — file/URL/commit hash
- Status validasi (default `unverified` kalau belum dicek)
- Penulis (default `SIDIX-system` untuk auto-generated, `mentor` untuk human-curated)

**2. Setiap CLAIM dalam catatan WAJIB diberi label epistemik:**
- `[FACT]` — ada sumber primer terverifikasi
- `[OPINION]` — reasoning dari fakta, diklaim sebagai pendapat
- `[SPECULATION]` — dugaan eksplisit
- `[UNKNOWN]` — jujur akui tidak tahu

(Sesuai 4-label dari `framework_living.md` MEMORY.md)

**3. JANGAN ambigu — kalau ragu, label `[SPECULATION]` atau `[UNKNOWN]`.**
Lebih baik akui ketidaktahuan daripada mengarang kepastian palsu.

**4. Catatan yang bertentangan = audit trail, bukan dihapus.**
Mengikuti prinsip Hafidz: append-only ledger. Versi lama tetap dengan flag
`superseded_by: <new_note_id>`.

**5. Setiap catatan punya `topic_hash` (CAS-style):**
`sha256(content)` — kalau konten diubah, hash berubah, audit trail jelas.

**6. Recurring/Update catatan harian WAJIB dipanggil dari LIVING_LOG**:
- Bukan tulis ulang pemahaman — lookup catatan lama dulu, baru append
- Format LIVING_LOG: tanggal → action tag → ringkas + pointer ke detail file
- Tag yang sah: `IMPL`, `FIX`, `DOC`, `TEST`, `DECISION`, `ERROR`, `NOTE`, `DEPLOY`

**7. Anti-Repeat: setiap sesi cek 3 file ini SEBELUM mulai:**
1. `docs/SIDIX_CHECKPOINT_<latest>.md` — snapshot state
2. `docs/LIVING_LOG.md` (tail 50 lines) — apa yang baru dikerjakan
3. `brain/public/research_notes/` — list 5 note terbaru (cek nomor max)

Kalau topic baru "mirip" dengan note existing (overlap_ratio ≥ 0.55) →
**JANGAN bikin note baru** — update yang lama dengan section "Iterasi N".

### Implementasi Aturan Ini
- Lookup function: `apps/brain_qa/brain_qa/hadith_validate.py::validate_hadith()`
  bisa dipakai juga untuk validasi note SIDIX (gunakan generic profile)
- Endpoint API potensial: `POST /sidix/notes/validate?text=...&profile=note`
  → return label + candidates → mentor decision

### Filosofi
> Sanad menjaga ilmu 1400 tahun. Hash + ledger menjaga ilmu SIDIX selama
> server hidup. Tradisi yang sama, hanya media berbeda.

---

## 📍 Status Catatan Sesi Ini (verifikasi sendiri pakai metodologi)

| Note/Doc | Status validasi | Catatan |
|----------|-----------------|---------|
| 132-144 (research notes) | `matched` (auto-generated dari pipeline) | Sanad ada via sanad_builder |
| LIVING_LOG entries | `unverified` (belum dicek terhadap corpus) | Manual log, append-only OK |
| CHECKPOINT (file ini) | `matched` (referensi dokumen yang ada) | Lookup commit + file paths verified |
| SIDIX_BIBLE (queue) | belum ditulis | Akan disusun next turn dengan label epistemik per claim |
