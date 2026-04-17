<div align="center">
  <img src="SIDIX_LANDING/sidix-logo.svg" alt="SIDIX Logo" width="120" height="120" />

  <h1>SIDIX</h1>
  <p><strong>Self-Hosted AI Agent with Epistemic Integrity</strong></p>
  <p><em>AI Agent Lokal dengan Integritas Epistemik</em></p>

  <p>
    <a href="https://github.com/fahmiwol/sidix/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-gold.svg" alt="MIT License" /></a>
    <a href="https://sidixlab.com"><img src="https://img.shields.io/badge/Live-sidixlab.com-brightgreen" alt="Live" /></a>
    <a href="https://github.com/fahmiwol/sidix/stargazers"><img src="https://img.shields.io/github/stars/fahmiwol/sidix?color=gold" alt="Stars" /></a>
    <a href="https://github.com/fahmiwol/sidix/issues"><img src="https://img.shields.io/github/issues/fahmiwol/sidix" alt="Issues" /></a>
    <a href="https://t.me/sidixlab_bot"><img src="https://img.shields.io/badge/Telegram-Train%20SIDIX-2AABEE?logo=telegram" alt="Telegram Bot" /></a>
  </p>

  <p>
    <a href="https://sidixlab.com">🌐 Website</a> ·
    <a href="https://app.sidixlab.com">🚀 Try SIDIX</a> ·
    <a href="#-quick-start">⚡ Quick Start</a> ·
    <a href="#-train-sidix--teach-the-ai">🧠 Train SIDIX</a> ·
    <a href="#-contribute">🤝 Contribute</a> ·
    <a href="#-donate">❤️ Donate</a>
  </p>
</div>

---

> **Honest. Cited. Verifiable.**
> Run your own AI agent — no vendor lock-in, no cloud dependency, no hallucination left unlabeled.

> **Jujur. Terkutip. Terverifikasi.**
> Jalankan AI agent milikmu sendiri — bebas vendor, bebas cloud, tanpa halusinasi tak berlabel.

---

## ✨ What is SIDIX?

SIDIX is an open-source, self-hosted AI agent platform built around **epistemic integrity** — every answer carries a label (`[FACT]`, `[OPINION]`, `[UNKNOWN]`), every claim has a traceable source, and all inference runs locally.

No OpenAI. No Anthropic. No Gemini. **Your data stays yours.**

Key capabilities:
- 🧠 **RAG + BM25 Retriever** — local corpus search, fully offline
- 🔄 **ReAct Agent Loop** — multi-step reasoning with tool use
- 🎯 **5 Personas** — MIGHAN · TOARD · FACH · HAYFAR · INAN
- 🌍 **Multilingual** — Indonesian · Arabic · English + Javanese, Sundanese
- 🛡️ **Safety Policy G1** — anti-injection, anti-toxic, anti-PII
- 🔧 **Fine-Tuned Model** — Qwen2.5-7B + QLoRA (713 Q&A trilingual dataset)
- 📚 **50+ Research Notes** — growing community corpus
- 🔒 **Zero Cloud Dependency** — by design, not by accident

---

## ⚡ Quick Start

> **Requirements:** Python 3.11+ · Node 18+ · 4GB RAM minimum

```bash
# 1. Clone & install
git clone https://github.com/fahmiwol/sidix.git
cd sidix
pip install -r apps/brain_qa/requirements.txt

# 2. Build index
cd apps/brain_qa
python -m brain_qa index

# 3. Run backend (port 8765)
python -m brain_qa serve

# 4. Run UI (new terminal)
cd ../../SIDIX_USER_UI
npm install && npm run dev

# 5. Ask!
python -m brain_qa ask "What is RAG?"
# Or open: http://localhost:3000
```

📖 [Full documentation →](docs/LAUNCH_V1.md)

---

## 🧠 Train SIDIX — Teach the AI

SIDIX learns from **real people**. You can contribute knowledge directly — no coding required.

### Method 1: Telegram Bot (Easiest — no code needed)

Open our Telegram bot and just send a message:

<div align="center">
  <a href="https://t.me/sidixlab_bot">
    <img src="https://img.shields.io/badge/Open%20Bot-%40SidixBot-2AABEE?style=for-the-badge&logo=telegram&logoColor=white" alt="Open Telegram Bot" />
  </a>
</div>

**How it works:**
- Send any text → SIDIX learns it automatically
- `/tanya <question>` → SIDIX answers using its knowledge corpus
- `/simpan <note>` → manually save a structured note
- Every message you send becomes part of SIDIX's knowledge base

**No account needed. No setup. No code.** Just open the bot and chat.

---

### Method 2: Research Notes (GitHub PR)

Add a Markdown file to `brain/public/research_notes/`:

```bash
# 1. Fork this repo on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/sidix.git
cd sidix

# 3. Create your note file
# Check the last number: ls brain/public/research_notes/ | sort | tail -5
# Then create the next one:
brain/public/research_notes/[next_number]_[your_topic].md
```

**Research note format** (bilingual recommended, any language accepted):

```markdown
# [Topic Name]

## Apa ini / What is it
Short description.

## Mengapa penting / Why it matters
...

## Bagaimana cara kerja / How it works
...

## Contoh nyata / Real examples
...

## Keterbatasan / Limitations
...

## Referensi / References
- Source 1
- Source 2
```

Any domain is welcome: AI/ML, Coding, Islam, Biology, Law, Economics, Arts, Nutrition, Business — anything.

```bash
# 4. Commit and push
git add brain/public/research_notes/
git commit -m "corpus: add [topic] research note"
git push

# 5. Open a Pull Request on GitHub
```

---

### Method 3: Direct API Capture

```bash
curl -X POST https://app.sidixlab.com/corpus/capture \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "your-topic",
    "content": "Your knowledge here — any text, any language.",
    "source": "direct",
    "project": "SIDIX"
  }'
```

---

## 🤝 Contribute

All contributions welcome! Here's how to get involved:

| Type | Where | GitHub Label |
|------|--------|-------|
| 🐛 Bug fix | `apps/brain_qa/` or `SIDIX_USER_UI/` | `bug` |
| 📚 Research note / corpus | `brain/public/research_notes/` | `corpus` |
| 🧪 Test case | `tests/` or `apps/brain_qa/tests/` | `test` |
| 🌐 Translation | Any corpus file | `translation` |
| 🔧 New agent tool | `agent_tools.py` | `tools` |
| 🎨 UI/UX | `SIDIX_USER_UI/` | `ui` |
| 📖 Docs | `docs/` | `docs` |

### Steps

```bash
# 1. Fork + clone
git clone https://github.com/YOUR_USERNAME/sidix.git

# 2. Create a branch
git checkout -b feat/your-contribution

# 3. Make changes
# If adding knowledge → also add a research note in brain/public/research_notes/

# 4. Commit with context (explain the WHY)
git commit -m "feat: add [topic] — why this matters"

# 5. Open a Pull Request
```

- 🟢 **Good first issues:** [See all →](https://github.com/fahmiwol/sidix/issues?q=label%3A%22good+first+issue%22)
- 📖 **Full guide:** [CONTRIBUTING.md →](CONTRIBUTING.md)
- 💬 **Questions:** [GitHub Discussions →](https://github.com/fahmiwol/sidix/discussions)

---

## 🗺️ Roadmap

**Completed ✅**
- RAG + BM25 Retriever (local, offline)
- ReAct Agent Loop (multi-step reasoning)
- Islamic Epistemology Engine (Maqasid + Sanad + Constitutional)
- Fine-tune v1 — Qwen2.5-7B QLoRA on Kaggle T4
- 50+ Research Notes Corpus
- Hafidz Ledger (Merkle tamper-evident log)
- Security Gateway (rate limit + injection protection)
- Telegram Bot (public training + Q&A)

**In Progress 🔄**
- GPU Inference Integration (Qwen2.5-7B + PeftModel local)
- Docker Deployment (VPS-ready container)

**Planned 📋**
- Streaming SSE fully wired to epistemology engine
- Fine-tune v2 (expanded corpus)
- Vision AI (LLaVA / Qwen-VL caption pipeline)
- Distributed Hafidz sync (P2P corpus nodes)
- Mobile app

[💡 Request a feature →](https://github.com/fahmiwol/sidix/issues/new?labels=feature-request)

---

## 📁 Project Structure

```
sidix/
├── apps/
│   ├── brain_qa/           # Python FastAPI backend — RAG, ReAct, API
│   ├── sidix_gateway/      # Security gateway (rate limit, sanitize, port 8766)
│   └── telegram_sidix/     # Telegram bot (public training + Q&A)
├── brain/
│   ├── public/
│   │   └── research_notes/ # ← Add your knowledge here!
│   └── manifest.json
├── SIDIX_USER_UI/          # Frontend — Vite + TypeScript + Tailwind
├── SIDIX_LANDING/          # Landing page — sidixlab.com
└── docs/
    ├── LIVING_LOG.md       # Development log
    └── EPISTEMIC_FRAMEWORK.md
```

---

## ❤️ Donate

SIDIX is **free, MIT licensed, and solo-built** by [@fahmiwol](https://github.com/fahmiwol). If it's useful to you, consider supporting:

<div align="center">

| Platform | Link |
|----------|------|
| GitHub Sponsors | [❤️ Sponsor @fahmiwol](https://github.com/sponsors/fahmiwol) |
| Saweria (Indonesia) | [☕ saweria.co/sidixlab](https://saweria.co/sidixlab) |

</div>

Your support helps cover:
- VPS server costs (`sidixlab.com` + `app.sidixlab.com`)
- GPU time for fine-tuning new models
- Development time for new features

---

## 🌐 Community & Links

| Platform | Link |
|----------|------|
| 🌐 Website | [sidixlab.com](https://sidixlab.com) |
| 🚀 Live App | [app.sidixlab.com](https://app.sidixlab.com) |
| ✈️ Telegram Bot | [@sidixlab_bot](https://t.me/sidixlab_bot) — train & ask SIDIX |
| 📸 Instagram | [@sidixlab](https://www.instagram.com/sidixlab) |
| 🧵 Threads | [@sidixlab](https://www.threads.com/@sidixlab) |
| 💬 Discussions | [GitHub Discussions](https://github.com/fahmiwol/sidix/discussions) |

---

## 📄 License

[MIT License](LICENSE) — free for personal and commercial use.

---

<div align="center">
  <sub>Built with ☕ · <code>sidq</code> · <code>sanad</code> · <code>tabayyun</code> · <code>ikhlas</code></sub><br/>
  <sub>Solo-built by <a href="https://github.com/fahmiwol">@fahmiwol</a> · Open source · Self-hosted</sub>
</div>
