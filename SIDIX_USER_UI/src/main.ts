/**
 * SIDIX — main.ts
 *
 * Semua inference memanggil brain_qa backend lokal via BrainQAClient (src/api.ts).
 * TIDAK ada import ke @google/genai, openai, atau vendor AI lain di sini.
 * Lihat AGENTS.md — "ATURAN KERAS Arsitektur & Inference".
 */

import {
  createIcons,
  MessageSquare, Library, Settings, ArrowUp, Plus, FileText,
  UploadCloud, AlertTriangle, Cpu, Info,
  ChevronDown, Sparkles, Paperclip, Copy, Check, Trash2,
  FolderTree, ShieldCheck, Folder, Lock, MoreHorizontal,
  LoaderCircle, Zap, BookOpen, ShieldAlert,
} from 'lucide';

import {
  checkHealth, askStream, listCorpus, uploadDocument, deleteDocument,
  triggerReindex, getReindexStatus, agentGenerate, submitFeedback, forgetAgentSession,
  BrainQAError, BRAIN_QA_BASE,
  type Persona, type CorpusDocument, type Citation, type HealthResponse,
  type AskInferenceOpts,
} from './api';

// ── Bootstrap icons ──────────────────────────────────────────────────────────
function initIcons() {
  createIcons({
    icons: {
      MessageSquare, Library, Settings, ArrowUp, Plus, FileText,
      UploadCloud, AlertTriangle, Cpu, Info,
      ChevronDown, Sparkles, Paperclip, Copy, Check, Trash2,
      FolderTree, ShieldCheck, Folder, Lock, MoreHorizontal,
      LoaderCircle, Zap, BookOpen, ShieldAlert,
    },
  });
}
initIcons();

// ── Elements ─────────────────────────────────────────────────────────────────
const $  = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const screens   = { chat: $('screen-chat'), corpus: $('screen-corpus'), settings: $('screen-settings') };
const navBtns   = { chat: $('nav-chat'),    corpus: $('nav-corpus'),    settings: $('nav-settings')    };
const statusDot = $('status-dot');
const statusTxt = $('status-text');

// Chat
const chatMessages   = $('chat-messages');
const chatInput      = $<HTMLTextAreaElement>('chat-input');
const sendBtn        = $<HTMLButtonElement>('send-btn');
const personaSel     = $<HTMLSelectElement>('persona-selector');
const chatEmpty      = $('chat-empty');
const optCorpusOnly  = document.getElementById('opt-corpus-only') as HTMLInputElement | null;
const optAllowWeb    = document.getElementById('opt-allow-web') as HTMLInputElement | null;
const optSimple      = document.getElementById('opt-simple') as HTMLInputElement | null;

function collectAskOpts(): AskInferenceOpts {
  const corpus_only = optCorpusOnly?.checked ?? false;
  const allow_web_fallback = corpus_only ? false : (optAllowWeb?.checked ?? true);
  return {
    corpus_only,
    allow_web_fallback,
    simple_mode: optSimple?.checked ?? false,
  };
}

optCorpusOnly?.addEventListener('change', () => {
  if (optAllowWeb) optAllowWeb.disabled = optCorpusOnly?.checked ?? false;
});

const forgetSessionBtn = document.getElementById('forget-session-btn') as HTMLButtonElement | null;
/** Session ID terakhir dari stream (server-side trace). */
let lastServerSessionId: string | null = null;

function setLastSessionId(id: string | null) {
  lastServerSessionId = id && id.length > 0 ? id : null;
  if (forgetSessionBtn) {
    if (lastServerSessionId) {
      forgetSessionBtn.classList.remove('hidden');
    } else {
      forgetSessionBtn.classList.add('hidden');
    }
  }
}

forgetSessionBtn?.addEventListener('click', async () => {
  if (!lastServerSessionId) return;
  try {
    await forgetAgentSession(lastServerSessionId);
    setLastSessionId(null);
  } catch {
    /* tetap sembunyikan tombol bila 404 */
    setLastSessionId(null);
  }
});

// Corpus
const corpusGrid     = $('corpus-grid');
const dropZone       = $('drop-zone');
const fileInput      = $<HTMLInputElement>('file-input');
const addDocBtn      = $('add-doc-btn');
const storageLabel   = $('storage-label');
const storageFill    = $('storage-fill');

// Settings
const settingsContent = $('settings-content');

// ── Health check / backend status ────────────────────────────────────────────
let backendOnline = false;
/** Snapshot terakhir GET /health — untuk tab Model tanpa fetch ganda */
let lastHealth: HealthResponse | null = null;

function formatStatusLine(h: HealthResponse): string {
  const docs = h.corpus_doc_count ?? 0;
  const mode = h.model_mode ?? '—';
  const ready =
    h.model_ready === true ? 'LoRA' : h.model_ready === false ? 'mock' : '';
  const bit = ready ? ` · ${mode}/${ready}` : ` · ${mode}`;
  return `Online · ${docs} dok${bit}`;
}

async function pingBackend() {
  try {
    const h = await checkHealth();
    lastHealth = h;
    backendOnline = true;
    statusDot.style.backgroundColor = '#6EAE7C';            // green
    statusTxt.textContent = formatStatusLine(h);
  } catch {
    lastHealth = null;
    backendOnline = false;
    statusDot.style.backgroundColor = '#C46B6B';            // red
    statusTxt.textContent = 'Backend tidak terhubung';
  }
}

pingBackend();
setInterval(pingBackend, 30_000);

// ── Navigation ────────────────────────────────────────────────────────────────
function switchScreen(screenId: keyof typeof screens) {
  Object.entries(screens).forEach(([id, el]) => {
    if (!el) return;
    id === screenId ? el.classList.remove('hidden') : el.classList.add('hidden');
  });
  Object.entries(navBtns).forEach(([id, btn]) => {
    if (!btn) return;
    if (id === screenId) {
      btn.classList.add('nav-item-active');
    } else {
      btn.classList.remove('nav-item-active');
    }
  });

  if (screenId === 'corpus') loadCorpus();
  if (screenId === 'settings') switchSettingsTab('model');
}

navBtns.chat?.addEventListener('click',     () => switchScreen('chat'));
navBtns.corpus?.addEventListener('click',   () => switchScreen('corpus'));
navBtns.settings?.addEventListener('click', () => switchScreen('settings'));

// ── Chat ─────────────────────────────────────────────────────────────────────

// Enable/disable send button based on input content
chatInput?.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 144) + 'px';
  sendBtn.disabled = chatInput.value.trim().length === 0;
});

chatInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
});
sendBtn?.addEventListener('click', handleSend);

// Quick prompts
document.querySelectorAll<HTMLButtonElement>('.quick-prompt').forEach(btn => {
  btn.addEventListener('click', () => {
    const prompt = btn.dataset.prompt ?? '';
    if (prompt && chatInput) {
      chatInput.value = prompt;
      chatInput.dispatchEvent(new Event('input'));
      chatInput.focus();
    }
  });
});

function appendMessage(
  role: 'user' | 'ai',
  content: string,
  citations: Citation[] = [],
) {
  // Hide empty state on first message
  chatEmpty?.classList.add('hidden');

  const wrap = document.createElement('div');
  wrap.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'} animate-fsu`;

  const bubble = document.createElement('div');
  bubble.className = `max-w-[78%] px-5 py-4 relative group
    ${role === 'user' ? 'msg-user text-parchment-100' : 'msg-ai text-parchment-200'}`;

  // Text
  const text = document.createElement('p');
  text.className = 'text-sm leading-relaxed whitespace-pre-wrap';
  text.textContent = content;
  bubble.appendChild(text);

  // Copy button (AI only)
  if (role === 'ai') {
    const copyBtn = document.createElement('button');
    copyBtn.className =
      'absolute -right-9 top-2 p-1.5 glass rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:text-gold-400';
    copyBtn.title = 'Salin';
    copyBtn.innerHTML = '<i data-lucide="copy" class="w-3.5 h-3.5"></i>';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(content).then(() => {
        copyBtn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5 text-status-ready"></i>';
        initIcons();
        setTimeout(() => {
          copyBtn.innerHTML = '<i data-lucide="copy" class="w-3.5 h-3.5"></i>';
          initIcons();
        }, 2000);
      });
    });
    wrap.appendChild(copyBtn);
  }

  // Citations
  if (citations.length > 0) {
    const citeRow = document.createElement('div');
    citeRow.className = 'mt-3 pt-3 border-t border-gold-500/10 flex flex-wrap gap-2';

    citations.forEach(c => {
      const chip = document.createElement('span');
      chip.className = 'citation-chip';
      chip.title = c.snippet;
      chip.innerHTML = `<i data-lucide="book-open" class="w-3 h-3"></i><span>${c.filename}</span>`;
      citeRow.appendChild(chip);
    });

    bubble.appendChild(citeRow);
    initIcons();
  }

  wrap.appendChild(bubble);
  chatMessages.appendChild(wrap);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  initIcons();
}

function appendError(message: string) {
  chatEmpty?.classList.add('hidden');
  const wrap = document.createElement('div');
  wrap.className = 'flex justify-start animate-fsu';
  wrap.innerHTML = `
    <div class="msg-ai px-4 py-3 flex items-center gap-2 text-sm text-status-failed max-w-[78%]">
      <i data-lucide="shield-alert" class="w-4 h-4 flex-shrink-0"></i>
      <span>${message}</span>
    </div>`;
  chatMessages.appendChild(wrap);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  initIcons();
}

async function handleSend() {
  const question = chatInput.value.trim();
  if (!question) return;

  chatInput.value = '';
  chatInput.style.height = 'auto';
  sendBtn.disabled = true;

  appendMessage('user', question);

  // Thinking indicator
  const thinking = document.createElement('div');
  thinking.className = 'flex justify-start';
  thinking.innerHTML = `
    <div class="msg-ai px-5 py-4 flex items-center gap-2">
      <div class="thinking-dot"></div>
      <div class="thinking-dot"></div>
      <div class="thinking-dot"></div>
    </div>`;
  chatMessages.appendChild(thinking);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const persona = (personaSel?.value ?? 'MIGHAN') as Persona;

  // Streaming bubble
  thinking.remove();
  const streamWrap = document.createElement('div');
  streamWrap.className = 'flex justify-start animate-fsu';
  const streamBubble = document.createElement('div');
  streamBubble.className = 'max-w-[78%] px-5 py-4 msg-ai text-parchment-200';
  const streamText = document.createElement('p');
  streamText.className = 'text-sm leading-relaxed whitespace-pre-wrap';
  streamText.textContent = '';
  streamBubble.appendChild(streamText);
  streamWrap.appendChild(streamBubble);
  chatMessages.appendChild(streamWrap);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const citations: Citation[] = [];
  let fullText = '';

  await askStream(question, persona, 5, {
    onMeta: (meta) => {
      if (meta.session_id) setLastSessionId(meta.session_id);
    },
    onToken: (text) => {
      fullText += text;
      streamText.textContent = fullText;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    },
    onCitation: (c) => {
      citations.push(c);
    },
    onDone: (_persona, meta) => {
      if (meta?.session_id) setLastSessionId(meta.session_id);
      // Tambah citation chips jika ada
      if (citations.length > 0) {
        const citeRow = document.createElement('div');
        citeRow.className = 'mt-3 pt-3 border-t border-gold-500/10 flex flex-wrap gap-2';
        citations.forEach(c => {
          const chip = document.createElement('span');
          chip.className = 'citation-chip';
          chip.title = c.snippet;
          chip.innerHTML = `<i data-lucide="book-open" class="w-3 h-3"></i><span>${c.filename}</span>`;
          citeRow.appendChild(chip);
        });
        streamBubble.appendChild(citeRow);
        initIcons();
      }
      if (meta?.confidence) {
        const conf = document.createElement('p');
        conf.className = 'text-[10px] text-parchment-500 mt-2';
        conf.textContent = `Keyakinan: ${meta.confidence}`;
        streamBubble.appendChild(conf);
      }
      if (meta?.session_id) {
        const fb = document.createElement('div');
        fb.className = 'mt-2 flex items-center gap-2 text-[11px] text-parchment-500';
        fb.innerHTML = '<span class="mr-1">Feedback:</span>';
        const up = document.createElement('button');
        up.type = 'button';
        up.className = 'px-2 py-0.5 rounded bg-warm-700 hover:bg-warm-600 text-parchment-200';
        up.textContent = '👍';
        up.title = 'Membantu';
        up.addEventListener('click', () => {
          void submitFeedback(meta.session_id!, 'up').catch(() => {});
          up.disabled = true;
        });
        const down = document.createElement('button');
        down.type = 'button';
        down.className = 'px-2 py-0.5 rounded bg-warm-700 hover:bg-warm-600 text-parchment-200';
        down.textContent = '👎';
        down.title = 'Kurang tepat';
        down.addEventListener('click', () => {
          void submitFeedback(meta.session_id!, 'down').catch(() => {});
          down.disabled = true;
        });
        fb.appendChild(up);
        fb.appendChild(down);
        streamBubble.appendChild(fb);
      }
    },
    onError: (msg) => {
      streamWrap.remove();
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')) {
        appendError('Backend brain_qa tidak terhubung. Jalankan: python -m brain_qa serve');
      } else {
        appendError(`Error: ${msg}`);
      }
    },
  }, collectAskOpts());
}

// ── Corpus ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function statusBadgeHTML(status: CorpusDocument['status']): string {
  const label: Record<CorpusDocument['status'], string> = {
    queued: 'Antrian', indexing: 'Mengindeks', ready: 'Siap', failed: 'Gagal',
  };
  return `<span class="status-badge status-${status}">${label[status]}</span>`;
}

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

function renderDocCard(doc: CorpusDocument): HTMLElement {
  const card = document.createElement('div');
  card.className = 'academic-card flex items-start gap-4 group';
  card.dataset.docId = doc.id;
  card.innerHTML = `
    <div class="w-10 h-10 rounded-xl bg-warm-700 flex items-center justify-center text-gold-400 flex-shrink-0 border border-warm-600">
      <i data-lucide="file-text" class="w-5 h-5"></i>
    </div>
    <div class="flex-1 min-w-0">
      <h3 class="font-medium text-parchment-100 truncate text-sm">${doc.filename}</h3>
      <p class="text-xs text-parchment-500 mt-0.5">${relativeTime(doc.uploaded_at)} · ${formatBytes(doc.size_bytes)}</p>
      <div class="mt-2">${statusBadgeHTML(doc.status)}</div>
    </div>
    <button class="doc-delete-btn opacity-0 group-hover:opacity-100 p-1.5 hover:bg-warm-700 rounded-lg
                   transition-all text-parchment-500 hover:text-status-failed flex-shrink-0"
            data-doc-id="${doc.id}" title="Hapus">
      <i data-lucide="trash-2" class="w-4 h-4"></i>
    </button>`;

  card.querySelector<HTMLButtonElement>('.doc-delete-btn')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!confirm(`Hapus "${doc.filename}" dari knowledge base?`)) return;
    try {
      await deleteDocument(doc.id);
      card.remove();
    } catch {
      alert('Gagal menghapus dokumen. Coba lagi.');
    }
  });

  return card;
}

async function loadCorpus() {
  corpusGrid.innerHTML = `
    <div class="col-span-full flex items-center justify-center py-12 text-parchment-500 text-sm gap-2">
      <i data-lucide="loader-circle" class="w-5 h-5 animate-spin"></i>
      Memuat…
    </div>`;
  initIcons();

  try {
    const data = await listCorpus();

    // Update storage bar
    const pct = data.index_capacity_bytes > 0
      ? (data.index_size_bytes / data.index_capacity_bytes) * 100
      : 0;
    storageFill.style.width = `${Math.min(pct, 100).toFixed(1)}%`;
    storageLabel.textContent =
      `${formatBytes(data.index_size_bytes)} / ${formatBytes(data.index_capacity_bytes)}`;

    // Render cards
    corpusGrid.innerHTML = '';
    if (data.documents.length === 0) {
      corpusGrid.innerHTML = `
        <div class="col-span-full text-center py-10 text-parchment-500 text-sm">
          Belum ada dokumen. Upload file untuk memulai indexing.
        </div>`;
    } else {
      data.documents.forEach(doc => {
        corpusGrid.appendChild(renderDocCard(doc));
      });
    }
    initIcons();
  } catch (e) {
    corpusGrid.innerHTML = `
      <div class="col-span-full flex items-center justify-center gap-2 py-10 text-status-failed text-sm">
        <i data-lucide="shield-alert" class="w-4 h-4"></i>
        ${e instanceof BrainQAError && (e.code === 'network' || e.code === 'timeout')
          ? 'Backend tidak terhubung. Jalankan: <code class="font-mono ml-1">python -m brain_qa serve</code>'
          : 'Gagal memuat corpus.'}
      </div>`;
    initIcons();
  }
}

// File upload handler
async function handleUpload(files: FileList | null) {
  if (!files || files.length === 0) return;

  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  for (const file of Array.from(files)) {
    if (file.size > MAX_SIZE) {
      alert(`File "${file.name}" melebihi batas 10 MB.`);
      continue;
    }

    // Optimistic: add "queued" card while uploading
    const optimisticDoc: CorpusDocument = {
      id: `_tmp_${Date.now()}`,
      filename: file.name,
      status: 'queued',
      uploaded_at: new Date().toISOString(),
      size_bytes: file.size,
    };
    const card = renderDocCard(optimisticDoc);
    corpusGrid.prepend(card);
    initIcons();

    try {
      const result = await uploadDocument(file);
      // Replace optimistic card with real one
      card.remove();
      const realDoc: CorpusDocument = {
        id: result.id,
        filename: result.filename,
        status: result.status,
        uploaded_at: new Date().toISOString(),
        size_bytes: file.size,
      };
      corpusGrid.prepend(renderDocCard(realDoc));
      initIcons();
    } catch {
      card.remove();
      alert(`Gagal mengupload "${file.name}". Pastikan backend berjalan.`);
    }
  }
}

dropZone?.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone?.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  handleUpload(e.dataTransfer?.files ?? null);
});
dropZone?.querySelector('button')?.addEventListener('click', () => fileInput?.click());
fileInput?.addEventListener('change', () => handleUpload(fileInput.files));
addDocBtn?.addEventListener('click', () => {
  switchScreen('corpus');
  setTimeout(() => fileInput?.click(), 100);
});

// ── Settings ─────────────────────────────────────────────────────────────────

const BRAIN_QA_CORPUS_PATH = `${BRAIN_QA_BASE.replace('http://localhost:', 'local:')}/../brain/public`;

const settingsTabs: Record<string, string> = {
  model: `
    <div class="space-y-8 animate-fsu">
      <div>
        <h3 class="font-display text-2xl font-bold glow-gold">Model &amp; Backend</h3>
        <p class="text-parchment-400 text-sm mt-1">Konfigurasi stack inference lokal SIDIX.</p>
      </div>

      <div class="academic-card flex gap-3 items-start border-gold-500/20 bg-gold-500/5">
        <i data-lucide="zap" class="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5"></i>
        <div>
          <p class="font-semibold text-gold-300 text-sm">Self-hosted — bukan vendor API</p>
          <p class="text-xs text-parchment-400 mt-1">SIDIX memanggil <code class="font-mono bg-warm-700 px-1 rounded">brain_qa serve</code> secara lokal.
          Tidak ada data yang dikirim ke cloud tanpa persetujuan kamu.</p>
        </div>
      </div>

      <div class="space-y-3">
        <div class="academic-card flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-warm-700 flex items-center justify-center border border-warm-600">
              <i data-lucide="cpu" class="w-4 h-4 text-gold-400"></i>
            </div>
            <div>
              <p class="text-sm font-medium text-parchment-100">Backend URL</p>
              <p class="text-xs text-parchment-500 font-mono">${BRAIN_QA_BASE}</p>
            </div>
          </div>
          <span id="model-status-badge" class="status-badge status-queued">Mengecek…</span>
        </div>

        <div class="academic-card flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-warm-700 flex items-center justify-center border border-warm-600">
              <i data-lucide="library" class="w-4 h-4 text-gold-400"></i>
            </div>
            <div>
              <p class="text-sm font-medium text-parchment-100">RAG Engine</p>
              <p class="text-xs text-parchment-500">BM25 + Vector · brain_qa index</p>
            </div>
          </div>
        </div>

        <div class="academic-card space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-medium text-parchment-100">Mode inferensi</span>
            <span id="inference-mode-label" class="text-xs font-mono text-gold-300">—</span>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm text-parchment-400">Bobot LoRA siap</span>
            <span id="inference-ready-label" class="text-xs font-medium text-parchment-500">—</span>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <h4 class="text-xs font-bold text-parchment-500 uppercase tracking-widest">Tes generate (tanpa RAG)</h4>
        <div class="academic-card space-y-3">
          <p class="text-xs text-parchment-500 leading-relaxed">
            Memanggil <code class="font-mono bg-warm-700 px-1 rounded text-parchment-300">POST /agent/generate</code>.
            Beberapa menit pertama setelah serve bisa lambat (muat model).
          </p>
          <button type="button" id="test-generate-btn"
            class="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-warm-700 border border-warm-600
                   text-parchment-100 hover:bg-warm-600 hover:border-gold-500/30 transition-all
                   flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <i data-lucide="zap" class="w-4 h-4"></i>
            Tes generate
          </button>
          <div id="test-generate-meta" class="hidden text-[10px] font-mono text-parchment-500"></div>
          <pre id="test-generate-output" class="hidden text-xs font-mono text-parchment-200 whitespace-pre-wrap break-words max-h-56 overflow-y-auto bg-warm-900/60 p-3 rounded-lg border border-warm-600/30"></pre>
        </div>
      </div>

      <div class="space-y-2">
        <h4 class="text-xs font-bold text-parchment-500 uppercase tracking-widest">Agent Tools</h4>
        <div class="academic-card space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 text-sm">
              <i data-lucide="sparkles" class="w-4 h-4"></i>
              <span>Agent Runner (ReAct)</span>
            </div>
            <span class="status-badge status-ready">API</span>
          </div>
          <div class="flex items-center justify-between opacity-50 select-none">
            <div class="flex items-center gap-3 text-sm">
              <i data-lucide="zap" class="w-4 h-4"></i>
              <span>Web Search Tool</span>
            </div>
            <span class="status-badge" style="color:#7A6B58;background:rgba(122,107,88,0.1);border-color:rgba(122,107,88,0.2)">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>`,

  'corpus-cfg': `
    <div class="space-y-8 animate-fsu">
      <div>
        <h3 class="font-display text-2xl font-bold glow-gold">Corpus Path</h3>
        <p class="text-parchment-400 text-sm mt-1">Lokasi basis pengetahuan di disk lokal.</p>
      </div>

      <div class="space-y-3">
        <div class="academic-card flex items-center gap-3">
          <i data-lucide="folder" class="w-5 h-5 text-gold-400 flex-shrink-0"></i>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-parchment-100">brain/public/</p>
            <p class="text-xs text-parchment-500 font-mono truncate">D:\\MIGHAN Model\\brain\\public</p>
          </div>
          <span class="status-badge status-ready">Aktif</span>
        </div>
        <div class="academic-card flex items-center gap-3 opacity-50">
          <i data-lucide="folder-tree" class="w-5 h-5 text-parchment-500 flex-shrink-0"></i>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-parchment-300">brain/private/</p>
            <p class="text-xs text-parchment-500">Tidak di-commit · dikonfigurasi lokal</p>
          </div>
          <span class="status-badge" style="color:#7A6B58;background:rgba(122,107,88,0.1);border-color:rgba(122,107,88,0.2)">Pribadi</span>
        </div>
      </div>

      <div class="academic-card text-xs text-parchment-400 space-y-1 font-mono bg-warm-900/50">
        <p class="text-parchment-500 text-[10px] uppercase tracking-widest mb-2 font-sans">Perintah reindex</p>
        <p>cd "D:\\MIGHAN Model\\apps\\brain_qa"</p>
        <p>pip install rank-bm25  <span class="text-parchment-500"># install dulu bila belum</span></p>
        <p>python -m brain_qa index</p>
        <p>python -m brain_qa serve</p>
      </div>
    </div>`,

  privacy: `
    <div class="space-y-8 animate-fsu">
      <div>
        <h3 class="font-display text-2xl font-bold glow-gold">Privasi &amp; Keamanan</h3>
        <p class="text-parchment-400 text-sm mt-1">Semua data tetap di perangkat kamu.</p>
      </div>

      <div class="academic-card space-y-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-parchment-100">Mode Lokal</p>
            <p class="text-xs text-parchment-400 mt-0.5">Tidak ada akun, tidak ada cloud sync tanpa persetujuan.</p>
          </div>
          <i data-lucide="shield-check" class="w-5 h-5 text-status-ready flex-shrink-0"></i>
        </div>
        <hr class="border-warm-600/30" />
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-parchment-100">brain/private/</p>
            <p class="text-xs text-parchment-400 mt-0.5">Tidak pernah di-commit ke git — hanya tersimpan di disk lokal.</p>
          </div>
          <i data-lucide="lock" class="w-5 h-5 text-gold-400 flex-shrink-0"></i>
        </div>
        <hr class="border-warm-600/30" />
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-parchment-100">API Key / Secret</p>
            <p class="text-xs text-parchment-400 mt-0.5">Simpan di env lokal atau OS keychain — jangan hardcode.</p>
          </div>
          <i data-lucide="shield-alert" class="w-5 h-5 text-status-queued flex-shrink-0"></i>
        </div>
      </div>
    </div>`,

  about: `
    <div class="space-y-8 animate-fsu">
      <div class="flex flex-col items-center text-center space-y-4 py-8">
        <div class="w-20 h-20 btn-gold rounded-3xl flex items-center justify-center shadow-2xl select-none">
          <span class="font-display font-bold text-warm-950 text-4xl leading-none">S</span>
        </div>
        <div>
          <h3 class="font-display text-3xl font-bold glow-gold">SIDIX Workspace</h3>
          <p class="text-gold-400 font-medium tracking-widest text-xs uppercase mt-2 font-sans">Mighan-brain-1 · v0.1.0</p>
        </div>
        <p class="text-parchment-400 text-sm max-w-sm leading-relaxed">
          SIDIX adalah antarmuka untuk <strong class="text-parchment-200">Mighan-brain-1</strong> —
          brain pack berbasis RAG dengan memori terstruktur, sitasi sumber, dan persona router.
          Self-hosted, MIT license.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="academic-card text-center">
          <p class="text-[10px] text-parchment-500 uppercase font-bold mb-1">Lisensi</p>
          <p class="text-sm font-medium text-parchment-100">MIT</p>
        </div>
        <div class="academic-card text-center">
          <p class="text-[10px] text-parchment-500 uppercase font-bold mb-1">Backend</p>
          <p class="text-sm font-medium text-parchment-100">brain_qa (Python)</p>
        </div>
        <div class="academic-card text-center">
          <p class="text-[10px] text-parchment-500 uppercase font-bold mb-1">Identitas Publik</p>
          <p class="text-sm font-medium text-parchment-100">Mighan (anonim)</p>
        </div>
        <div class="academic-card text-center">
          <p class="text-[10px] text-parchment-500 uppercase font-bold mb-1">Repo</p>
          <p class="text-sm font-medium text-parchment-100">D:\\MIGHAN Model</p>
        </div>
      </div>
    </div>`,
};

function switchSettingsTab(tabId: string) {
  if (!settingsContent) return;
  settingsContent.innerHTML = settingsTabs[tabId] ?? '';
  initIcons();

  // Active nav highlight
  document.querySelectorAll<HTMLButtonElement>('.settings-nav-item').forEach(btn => {
    if (btn.dataset.settingsTab === tabId) {
      btn.classList.add('nav-item-active');
      btn.classList.remove('text-parchment-400');
    } else {
      btn.classList.remove('nav-item-active');
      btn.classList.add('text-parchment-400');
    }
  });

  // Live backend status + inference labels + tes generate (tab Model)
  if (tabId === 'model') {
    void refreshModelTabPanel();
  }
}

/** Isi badge + label mode/LoRA; refresh health jika perlu */
async function refreshModelTabPanel() {
  const badge = document.getElementById('model-status-badge');
  const modeEl = document.getElementById('inference-mode-label');
  const readyEl = document.getElementById('inference-ready-label');

  let h = lastHealth;
  if (!h) {
    try {
      h = await checkHealth();
      lastHealth = h;
      backendOnline = true;
    } catch {
      backendOnline = false;
    }
  }

  if (badge) {
    badge.className = `status-badge ${backendOnline ? 'status-ready' : 'status-failed'}`;
    badge.textContent = backendOnline ? 'Online' : 'Offline';
  }
  if (modeEl && h) modeEl.textContent = h.model_mode ?? '—';
  if (readyEl && h) {
    const ok = h.model_ready === true;
    readyEl.textContent = ok ? 'Ya' : 'Tidak';
    readyEl.className = ok ? 'text-xs font-medium text-status-ready' : 'text-xs font-medium text-parchment-500';
  }

  const testBtn = document.getElementById('test-generate-btn') as HTMLButtonElement | null;
  const testOut = document.getElementById('test-generate-output');
  const testMeta = document.getElementById('test-generate-meta');
  if (testBtn) {
    testBtn.onclick = async () => {
      const prompt =
        'Jawab sangat singkat (max 2 kalimat): Apa makna "sidq" dalam epistemologi Islam menurut korpus Mighan?';
      testBtn.disabled = true;
      if (testOut) {
        testOut.classList.remove('hidden');
        testOut.textContent = 'Menunggu respons…';
      }
      if (testMeta) testMeta.classList.add('hidden');
      try {
        const r = await agentGenerate(prompt, { max_tokens: 256 });
        if (testMeta) {
          testMeta.classList.remove('hidden');
          testMeta.textContent = `mode=${r.mode} · model=${r.model} · ${r.duration_ms} ms`;
        }
        if (testOut) testOut.textContent = r.text;
      } catch (e) {
        const msg = e instanceof BrainQAError ? e.message : String(e);
        if (testOut) testOut.textContent = `Error: ${msg}`;
        if (testMeta) testMeta.classList.add('hidden');
      } finally {
        testBtn.disabled = false;
      }
    };
  }
}

document.querySelectorAll<HTMLButtonElement>('.settings-nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.settingsTab;
    if (tab) switchSettingsTab(tab);
  });
});

// Reset workspace (confirmation guard)
$('reset-workspace-btn')?.addEventListener('click', () => {
  if (confirm('Reset workspace? Ini akan menghapus riwayat chat lokal. Corpus di disk tidak tersentuh.')) {
    chatMessages.innerHTML = '';
    chatEmpty?.classList.remove('hidden');
    switchScreen('chat');
  }
});

// ── Initial render ────────────────────────────────────────────────────────────
switchScreen('chat');
