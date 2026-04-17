#!/usr/bin/env node
/**
 * SIDIX MCP Server
 *
 * Menghubungkan Claude (Code / Desktop / claude.ai) ke SIDIX brain_qa.
 * Install sekali → SIDIX hadir di semua sesi.
 *
 * Tools:
 *   sidix_query         — tanya ke SIDIX
 *   sidix_capture       — rekam pengetahuan baru ke corpus
 *   sidix_learn_session — rekam ringkasan sesi saat ini
 *   sidix_status        — cek health + jumlah dokumen
 */

import { Server }       from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs   from 'fs';
import path from 'path';

// ── Config ───────────────────────────────────────────────────────────────────
const BRAIN_QA_URL  = process.env.SIDIX_URL  || 'http://localhost:8765';
const CORPUS_PATH   = process.env.SIDIX_CORPUS
  || path.join(process.env.HOME || process.env.USERPROFILE, 'MIGHAN Model', 'brain', 'public');

// ── Server ───────────────────────────────────────────────────────────────────
const server = new Server(
  { name: 'sidix', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ── Tool definitions ─────────────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'sidix_query',
      description: 'Tanya ke SIDIX — AI agent berbasis corpus pengetahuan Mighan/SIDIX. Gunakan untuk pertanyaan tentang proyek, framework, arsitektur, atau topik yang sudah didokumentasikan.',
      inputSchema: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'Pertanyaan yang ingin ditanyakan ke SIDIX' },
          persona: {
            type: 'string',
            description: 'Persona SIDIX (opsional): MIGHAN, TOARD, FACH, HAYFAR, INAN',
            default: 'MIGHAN'
          }
        },
        required: ['question']
      }
    },
    {
      name: 'sidix_capture',
      description: 'Rekam pengetahuan baru ke corpus SIDIX. Gunakan ini setiap kali ada konsep, keputusan, error+fix, atau framework yang perlu SIDIX pelajari.',
      inputSchema: {
        type: 'object',
        properties: {
          topic:   { type: 'string', description: 'Judul/topik singkat (akan jadi nama file)' },
          content: { type: 'string', description: 'Isi pengetahuan dalam format Markdown' },
          category: {
            type: 'string',
            description: 'Kategori: research_notes | feedback_learning | praxis',
            default: 'research_notes'
          }
        },
        required: ['topic', 'content']
      }
    },
    {
      name: 'sidix_learn_session',
      description: 'Rekam ringkasan sesi kerja saat ini ke corpus SIDIX. Panggil di akhir sesi atau saat pindah proyek.',
      inputSchema: {
        type: 'object',
        properties: {
          project:  { type: 'string', description: 'Nama proyek yang dikerjakan' },
          summary:  { type: 'string', description: 'Ringkasan apa yang dikerjakan dan dipelajari' },
          decisions:{ type: 'string', description: 'Keputusan penting yang diambil (opsional)' },
          errors:   { type: 'string', description: 'Error yang ditemukan dan cara fixnya (opsional)' }
        },
        required: ['project', 'summary']
      }
    },
    {
      name: 'sidix_status',
      description: 'Cek status SIDIX — apakah online, berapa dokumen di corpus, mode model.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  ]
}));

// ── Tool handlers ─────────────────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  try {
    switch (name) {

      // ── sidix_query ──────────────────────────────────────────────────────
      case 'sidix_query': {
        const res = await fetch(`${BRAIN_QA_URL}/agent/chat`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: args.question,
            persona: args.persona || 'MIGHAN',
            corpus_only: false,
          })
        });

        if (!res.ok) throw new Error(`SIDIX HTTP ${res.status}`);
        const data = await res.json();

        return {
          content: [{
            type: 'text',
            text: `**SIDIX (${args.persona || 'MIGHAN'}) menjawab:**\n\n${data.reply || data.answer || JSON.stringify(data)}\n\n*Confidence: ${data.confidence || '–'} | Sources: ${data.citations?.length || 0}*`
          }]
        };
      }

      // ── sidix_capture ────────────────────────────────────────────────────
      case 'sidix_capture': {
        const category = args.category || 'research_notes';
        const notesDir = path.join(CORPUS_PATH, category);

        // Buat direktori kalau belum ada
        fs.mkdirSync(notesDir, { recursive: true });

        // Cari nomor berikutnya
        let nextNum = 1;
        if (category === 'research_notes') {
          const files = fs.readdirSync(notesDir)
            .filter(f => /^\d+_/.test(f))
            .sort();
          if (files.length > 0) {
            const last = files[files.length - 1];
            const match = last.match(/^(\d+)/);
            if (match) nextNum = parseInt(match[1]) + 1;
          }
        }

        // Buat slug dari topik
        const slug = args.topic.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .slice(0, 50);

        const today = new Date().toISOString().slice(0, 10);
        const filename = category === 'research_notes'
          ? `${nextNum}_${slug}.md`
          : `${today}_${slug}.md`;

        const filepath = path.join(notesDir, filename);

        // Tulis file
        const fullContent = `# ${args.topic}\n\n> Dicapture via SIDIX MCP — ${today}\n\n${args.content}\n`;
        fs.writeFileSync(filepath, fullContent, 'utf8');

        // Trigger re-index via API (fire-and-forget)
        fetch(`${BRAIN_QA_URL}/corpus/reindex`, { method: 'POST' })
          .catch(() => {}); // tidak blokir kalau SIDIX offline

        return {
          content: [{
            type: 'text',
            text: `✅ **Tersimpan ke corpus SIDIX**\n\nFile: \`${category}/${filename}\`\nSIDIX sedang re-index... pengetahuan ini akan tersedia dalam beberapa detik.`
          }]
        };
      }

      // ── sidix_learn_session ──────────────────────────────────────────────
      case 'sidix_learn_session': {
        const today = new Date().toISOString().slice(0, 10);
        const slug  = args.project.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
        const notesDir = path.join(CORPUS_PATH, 'research_notes');

        fs.mkdirSync(notesDir, { recursive: true });

        // Cari nomor berikutnya
        const files = fs.readdirSync(notesDir)
          .filter(f => /^\d+_/.test(f)).sort();
        let nextNum = 1;
        if (files.length > 0) {
          const match = files[files.length - 1].match(/^(\d+)/);
          if (match) nextNum = parseInt(match[1]) + 1;
        }

        const filename = `${nextNum}_sesi_${slug}_${today}.md`;
        const filepath = path.join(notesDir, filename);

        const content = `# Sesi Kerja: ${args.project} — ${today}

> Direkam via SIDIX MCP dari sesi Claude

## Ringkasan
${args.summary}

${args.decisions ? `## Keputusan Penting\n${args.decisions}\n` : ''}
${args.errors ? `## Error & Fix\n${args.errors}\n` : ''}
`;

        fs.writeFileSync(filepath, content, 'utf8');
        fetch(`${BRAIN_QA_URL}/corpus/reindex`, { method: 'POST' }).catch(() => {});

        return {
          content: [{
            type: 'text',
            text: `✅ **Sesi direkam ke corpus SIDIX**\n\nFile: \`research_notes/${filename}\`\nSIDIX belajar dari sesi kerja di proyek: ${args.project}`
          }]
        };
      }

      // ── sidix_status ─────────────────────────────────────────────────────
      case 'sidix_status': {
        try {
          const res  = await fetch(`${BRAIN_QA_URL}/health`);
          const data = await res.json();
          return {
            content: [{
              type: 'text',
              text: [
                `**SIDIX Status**`,
                `🟢 Online: ${data.status === 'ok' ? 'Ya' : 'Tidak'}`,
                `📚 Corpus: ${data.corpus_doc_count} dokumen`,
                `🤖 Model: ${data.model_mode} (ready: ${data.model_ready})`,
                `🛠️ Tools: ${data.tools_available} tersedia`,
                `🔗 URL: ${BRAIN_QA_URL}`,
              ].join('\n')
            }]
          };
        } catch {
          return {
            content: [{
              type: 'text',
              text: `⚠️ **SIDIX Offline**\n\nTidak bisa terhubung ke ${BRAIN_QA_URL}\nPastikan backend brain_qa berjalan.`
            }]
          };
        }
      }

      default:
        throw new Error(`Tool tidak dikenal: ${name}`);
    }
  } catch (err) {
    return {
      content: [{ type: 'text', text: `❌ Error: ${err.message}` }],
      isError: true
    };
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('SIDIX MCP Server running. Tools: sidix_query, sidix_capture, sidix_learn_session, sidix_status');
