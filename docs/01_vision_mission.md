# Visi, Misi, Nilai

## Ringkasan
Proyek ini bertujuan membuat aplikasi AI open-source yang bisa dipakai pribadi maupun publik: chat + gambar + suara + agent workflow + (opsional) coding agent, dengan desain modular agar mudah dikembangkan komunitas.

## Visi
Membuat **AI workspace open-source** yang setara “produk AI modern” (multimodal + agentic), tetapi:
- bisa dijalankan lokal/VPS murah,
- transparan,
- bisa dikembangkan bersama komunitas.

## Misi
- Menyediakan UI yang sederhana untuk pengguna non-teknis: chat, image, voice, dan automasi agent.
- Menyediakan “agent platform” yang aman: tool access, audit log, permission gate, sandbox eksekusi.
- Menyediakan memori & knowledge base (RAG) agar AI bisa “belajar” dari dokumen pengguna tanpa training besar.
- Menyediakan integrasi model yang fleksibel: API (Claude/OpenAI/etc) dan model lokal (Ollama/llama.cpp) + image model (SDXL/FLUX) bila ada GPU.

## Nilai / Prinsip
- **Modular**: tiap kemampuan adalah “plugin” (model, tool, memory, UI).
- **Security-by-default**: akses file/terminal/browser selalu gated + tercatat.
- **Cost-aware**: pengguna bisa memilih mode hemat (lokal) atau mode kualitas tinggi (API).
- **Open collaboration**: kontribusi mudah, issue/PR template jelas, roadmap publik.

## Batasan realistis (biar komunitas tidak “overpromise”)
- “Latih LLM dari nol” bukan target utama; target: **orchestrator + RAG + fine-tune ringan** bila perlu.
- Self-improving secara otomatis dibatasi (no auto-deploy tanpa review).

