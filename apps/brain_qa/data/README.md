# brain_qa / data

Direktori ini berisi dataset SFT (Supervised Fine-Tuning) untuk SIDIX.

## File

| File | Deskripsi | Sampel |
|---|---|---|
| `finetune_sft.jsonl` | Dataset SFT utama (diunggah ke Kaggle: `mighan/sidix-sft-dataset`) | 713 |
| `finetune_coding_sft.jsonl` | Dataset coding tambahan — Python, Backend, DSA, JS, ML | ~150 |

## Format

Setiap baris adalah satu JSON object:
```json
{
  "messages": [
    {"role": "system", "content": "Kamu adalah SIDIX..."},
    {"role": "user",   "content": "Pertanyaan..."},
    {"role": "assistant", "content": "Jawaban SIDIX..."}
  ],
  "source_id": "qa-001",
  "tags": ["python", "backend"]
}
```

## Langkah menggabungkan dataset untuk training

```bash
# Gabungkan ke satu file untuk Kaggle
cat finetune_sft.jsonl finetune_coding_sft.jsonl > finetune_combined.jsonl
wc -l finetune_combined.jsonl  # cek jumlah sampel

# Upload ke Kaggle dataset
kaggle datasets version -m "v2 — tambah 150+ coding QA"
```

## Catatan

File-file ini TIDAK di-commit ke git (`.gitignore`) karena bisa berisi data sensitif.
Upload langsung ke Kaggle Datasets sebagai private dataset.
