# Handoff Claude — Projek Badar (54 tugas)

Dokumen ini berisi (1) ringkasan konteks untuk manusia dan (2) **blok prompt siap tempel** untuk Claude.

---

## Ringkasan (manusia)

| Item | Isi |
|------|-----|
| **Batch Claude** | **54 tugas** = baris `# kerja` **51–104** di `docs/PROJEK_BADAR_BATCH_CLAUDE_54.md` (sudah diurutkan **kasar** menurut dependensi: G1 → G5 → G4 → G2 → G3). |
| **Batch Cursor** | 50 tugas pertama: `docs/PROJEK_BADAR_BATCH_CURSOR_50.md`. |
| **Sisa** | 10 tugas: `docs/PROJEK_BADAR_BATCH_SISA_10.md` (# kerja 105–114) — bisa dikerjakan setelah batch B atau dibagi manual. |
| **Skrip pecah** | `scripts/split_projek_badar_batches.py` — jangan ubah urutan goal tanpa diskusi; regenerasi akan menimpa file batch. |
| **Backbone / nilai** | `docs/PROJEK_BADAR_INTERNAL_BACKBONE.md` — rujukan internal; **bukan** angle pemasaran publik. |
| **Larangan keras** | **Jangan** hapus folder; **jangan** pindahkan atau mengubah struktur folder tanpa izin eksplisit pemilik repo. |
| **Penyelarasan goal** | `docs/PROJEK_BADAR_GOALS_ALIGNMENT.md` — batch B harus **membuktikan kontribusi ke G1–G5**, bukan sekadar menyelesaikan baris tanpa artefak. |

---

## Sumber yang wajib dibaca sebelum mulai

1. `docs/PROJEK_BADAR_GOALS_ALIGNMENT.md` — **wajib**: peta goal ↔ bukti, peran batch A/B/C, definisi selesai.
2. `AGENTS.md` — own-stack, SIDIX, brain_qa, aturan inference.
3. `docs/00_START_HERE.md` / `docs/STATUS_TODAY.md` — orientasi singkat.
4. `docs/PROJEK_BADAR_INTERNAL_BACKBONE.md` — batas narasi publik vs internal.
5. `docs/PROJEK_BADAR_BATCH_CLAUDE_54.md` — daftar 54 tugas (satu baris = satu entri kerja).
6. `docs/PROJEK_BADAR_AL_AMIN_114_LANGKAH.md` — konteks penuh 114 langkah (penafian: bukan tafsir).
7. `apps/brain_qa/` — RAG, ledger, storage; CLI `python -m brain_qa`.
8. `brain/public/research_notes/31_sidix_feeding_log.md` — log feeding & arah SIDIX.
9. `jariyah-hub/` — skaffold OSS lokal (Ollama + Open WebUI; tanpa secret di repo).

Setelah pekerjaan material: **append** `docs/LIVING_LOG.md` dengan tag wajib (`IMPL:`, `FIX:`, `DOC:`, dll.).

---

## --- SALIN DARI SINI UNTUK CLAUDE ---

Kamu adalah agen pengembang pada repositori **Mighan Model** (root contoh: `D:\MIGHAN Model` — sesuaikan path lokalmu). Proyek fokus: **SIDIX** + **`brain_qa`** (RAG, sanad/kutipan, ledger, storage terdistribusi), own-stack inference sesuai `AGENTS.md`.

**Tujuan kerja batchmu bukan “habiskan 54 baris”, melainkan mendekatkan repo ke outcome G1–G5** yang didefinisikan di `docs/PROJEK_BADAR_AL_AMIN_114_LANGKAH.md` dan dijabarkan per batch di `docs/PROJEK_BADAR_GOALS_ALIGNMENT.md`. Setiap tugas yang kamu selesaikan harus punya: **goal (Gx)**, **artefak**, **bukti uji atau log**, selaras own-stack.

### Fundamental & batas narasi

- Tim menyandarkan **etika dan kerangka berpikir** pada Al-Qur’an; rujukan ringkas internal ada di `docs/PROJEK_BADAR_INTERNAL_BACKBONE.md` (termasuk konteks Al-Baqarah 1–5 sebagai **referensi**, bukan tafsir produk).
- **Ke publik / pemasaran:** jangan gunakan angle “keislaman” berlebihan. Sampaikan dengan **metafora ilmiah** dan **terminologi sistem** (validasi sumber, provenans, korpus, evaluasi).
- Istilah **smart contract** di dokumen internal dipakai **metafora** untuk manifest rilis / aturan CI-immutable / bukti hash — jangan campur dengan klaim hukum blockchain kecuali ada dokumen hukum terpisah.

### Aturan keras operasional

1. **Jangan menghapus folder** atau isi besar secara destruktif.
2. **Jangan memindahkan atau mengubah struktur folder** tanpa izin eksplisit pemilik repo.
3. **Inference inti:** default **own-stack**; API Claude/OpenAI/Gemini hanya jika user memerintahkan eksplisit untuk POC (lihat `AGENTS.md`).
4. Setelah perubahan bermakna: tambahkan entri di **`docs/LIVING_LOG.md`** (append-only, tag wajib). Perbarui **`docs/CHANGELOG.md`** bila perlu ringkasan rilis.

### Tugasmu: 54 item (urut dependensi)

Kerjakan **tepat 54 tugas** yang tercantum dalam file:

**`docs/PROJEK_BADAR_BATCH_CLAUDE_54.md`**

Kolom **# kerja** 51–104 adalah urutan eksekusi yang disepakati (dependensi kasar: G1 → G5 → G4 → G2 → G3). Kolom **Asal #** adalah nomor surah asal di master 114 baris — gunakan untuk lacak konteks di `docs/PROJEK_BADAR_AL_AMIN_114_LANGKAH.md` bila perlu.

Untuk **setiap** baris:

1. Terjemahkan “Tugas teknis” menjadi **hasil konkret** (kode, skrip, tes, atau dokumen operasional) yang cocok dengan repo ini.
2. Jika tugas sudah terpenuhi sebagian, **perketat / rapikan / uji** — jangan duplikasi besar tanpa manfaat.
3. Prioritaskan **`apps/brain_qa/`**, **`SIDIX_USER_UI/`**, **`docs/`**, **`scripts/`** — sesuai isi baris.
4. **Jangan** mengubah narasi publik menjadi kampanye agama; tetap pada manfaat teknis dan metodologi.

### Setelah 54 selesai (opsional koordinasi)

File **`docs/PROJEK_BADAR_BATCH_SISA_10.md`** berisi 10 tugas sisa (# kerja 105–114). Lakukan hanya jika pemilik repo memintamu melanjutkan atau serahkan ke Cursor.

### Verifikasi

Sebelum mengklaim selesai: jalankan smoke yang relevan (mis. `python -m brain_qa --help` atau tes yang sudah ada di repo) untuk area yang kamu sentuh; catat hasil di `docs/LIVING_LOG.md`.

### --- AKHIR PROMPT ---
