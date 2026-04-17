"""
brain_qa serve — FastAPI HTTP server untuk SIDIX UI.

Endpoint:
  GET  /health
  POST /ask
  GET  /corpus
  POST /corpus/upload
  DELETE /corpus/{doc_id}

Jalankan:
  python -m brain_qa serve              # default port 8765
  python -m brain_qa serve --port 9000  # custom port

Stack: FastAPI + Uvicorn (pure Python, self-hosted).
TIDAK ada dependency ke API vendor (Gemini, OpenAI, dsb.).
Lihat AGENTS.md — "ATURAN KERAS Arsitektur & Inference".
"""

from __future__ import annotations

import hashlib
import json
import mimetypes
import os
import shutil
import time
from pathlib import Path
from typing import Literal

import threading

from .indexer import build_index
from .paths import default_index_dir, load_manifest_paths
from .persona import normalize_persona, route_persona
from .query import answer_query_and_citations

# ── Lazy FastAPI import (agar error install-nya jelas) ───────────────────────
try:
    from fastapi import FastAPI, File, HTTPException, UploadFile
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse, StreamingResponse
    from pydantic import BaseModel, Field
    import uvicorn
except ImportError as exc:
    raise ImportError(
        "Dependensi serve belum ter-install.\n"
        "Jalankan: pip install fastapi uvicorn[standard] python-multipart\n"
        f"Detail: {exc}"
    ) from exc


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="brain_qa serve",
    description="API lokal untuk SIDIX UI — self-hosted, bukan vendor API.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url=None,
)

# CORS: izinkan localhost:3000 (SIDIX dev) dan localhost:4173 (vite preview)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Corpus upload dir ─────────────────────────────────────────────────────────

_UPLOAD_MAX_BYTES = 10 * 1024 * 1024  # 10 MB

_ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".csv"}

_ALLOWED_MIME = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/octet-stream",  # fallback untuk .md di beberapa OS
}


def _uploads_dir() -> Path:
    d = default_index_dir() / "uploads"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _uploads_meta_path() -> Path:
    return _uploads_dir() / "_meta.jsonl"


def _doc_id(filename: str, ts: float) -> str:
    raw = f"{filename}:{ts}"
    return "doc_" + hashlib.sha1(raw.encode()).hexdigest()[:16]


def _read_uploads_meta() -> list[dict]:
    p = _uploads_meta_path()
    if not p.exists():
        return []
    records = []
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return records


def _append_uploads_meta(record: dict) -> None:
    with _uploads_meta_path().open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def _write_uploads_meta(records: list[dict]) -> None:
    _uploads_meta_path().write_text(
        "\n".join(json.dumps(r, ensure_ascii=False) for r in records) + "\n",
        encoding="utf-8",
    )


# ── Pydantic models ───────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=4096)
    persona: Literal["MIGHAN", "TOARD", "FACH", "HAYFAR", "INAN"] | None = None
    k: int = Field(default=5, ge=1, le=20)


class CitationOut(BaseModel):
    filename: str
    snippet: str
    score: float = 0.0


class AskResponse(BaseModel):
    answer: str
    citations: list[CitationOut]
    persona: str


class CorpusDocument(BaseModel):
    id: str
    filename: str
    status: Literal["queued", "indexing", "ready", "failed"]
    uploaded_at: str   # ISO timestamp
    size_bytes: int


class CorpusListResponse(BaseModel):
    documents: list[CorpusDocument]
    total_docs: int
    index_size_bytes: int
    index_capacity_bytes: int


class HealthResponse(BaseModel):
    ok: bool
    version: str
    corpus_doc_count: int


class UploadResponse(BaseModel):
    id: str
    filename: str
    status: Literal["queued"]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _index_chunk_count() -> int:
    chunks_path = default_index_dir() / "chunks.jsonl"
    if not chunks_path.exists():
        return 0
    try:
        return sum(1 for ln in chunks_path.read_text(encoding="utf-8").splitlines() if ln.strip())
    except Exception:
        return 0


def _index_size_bytes() -> int:
    data_dir = default_index_dir()
    total = 0
    for f in data_dir.iterdir():
        if f.is_file():
            try:
                total += f.stat().st_size
            except Exception:
                pass
    return total


_INDEX_CAPACITY = 5 * 1024 ** 3  # 5 GB reportable capacity (configureable later)

# ── Background reindex ─────────────────────────────────────────────────────────

_reindex_lock = threading.Lock()
_reindex_status: dict = {"running": False, "last_at": None, "chunk_count": 0}


def _trigger_reindex_background() -> None:
    """Jalankan build_index di background thread. Skip jika sudah running."""
    def _run():
        with _reindex_lock:
            _reindex_status["running"] = True
        try:
            manifest = load_manifest_paths()
            build_index(
                root_override=str(manifest.public_markdown_root),
                out_dir_override=None,
                chunk_chars=1200,
                chunk_overlap=150,
            )
            _reindex_status["chunk_count"] = _index_chunk_count()
            _reindex_status["last_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        except Exception:
            pass
        finally:
            _reindex_status["running"] = False

    if not _reindex_status["running"]:
        t = threading.Thread(target=_run, daemon=True)
        t.start()


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health() -> HealthResponse:
    """Status cepat — dipakai SIDIX untuk status dot."""
    return HealthResponse(
        ok=True,
        version="0.1.0",
        corpus_doc_count=_index_chunk_count(),
    )


@app.post("/ask", response_model=AskResponse, tags=["Query"])
async def ask(req: AskRequest) -> AskResponse:
    """
    Tanya ke brain_qa dengan BM25 RAG + persona router.
    Inference lokal — tidak ada panggilan ke API vendor.
    """
    # Resolve persona
    if req.persona:
        try:
            forced = normalize_persona(req.persona)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
        persona_name = forced or "MIGHAN"
        persona_reason = "forced by API client"
    else:
        decision = route_persona(req.question)
        persona_name = decision.persona
        persona_reason = decision.reason

    # Check index exists
    index_dir = default_index_dir()
    chunks_path = index_dir / "chunks.jsonl"
    if not chunks_path.exists():
        raise HTTPException(
            status_code=503,
            detail=(
                "Index belum dibuat. Jalankan dulu: "
                "pip install rank-bm25 && python -m brain_qa index"
            ),
        )

    try:
        answer_text, citation_meta = answer_query_and_citations(
            question=req.question,
            index_dir_override=None,
            k=req.k,
            max_snippet_chars=300,
            persona=persona_name,
            persona_reason=persona_reason,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query error: {e}")

    # citation_meta is list[dict] with keys: n, source_path, source_title, chunk_id
    # We need to re-read snippets for the API response (citation_meta doesn't carry snippet)
    # Simple approach: return source_title as filename, chunk_id as snippet proxy
    citations_out = [
        CitationOut(
            filename=Path(c.get("source_path", "")).name or c.get("source_title", ""),
            snippet=c.get("chunk_id", ""),
            score=0.0,
        )
        for c in citation_meta
    ]

    return AskResponse(
        answer=answer_text,
        citations=citations_out,
        persona=persona_name,
    )


@app.post("/ask/stream", tags=["Query"])
async def ask_stream(req: AskRequest):
    """
    POST /ask/stream — SSE streaming jawaban brain_qa token per token.
    Response: text/event-stream
    Format per event:
      data: {"type":"token","text":"..."}
      data: {"type":"citation","filename":"...","snippet":"..."}
      data: {"type":"done","persona":"..."}
    """
    # Resolve persona
    if req.persona:
        try:
            forced = normalize_persona(req.persona)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
        persona_name = forced or "MIGHAN"
        persona_reason = "forced by API client"
    else:
        decision = route_persona(req.question)
        persona_name = decision.persona
        persona_reason = decision.reason

    index_dir = default_index_dir()
    if not (index_dir / "chunks.jsonl").exists():
        raise HTTPException(status_code=503, detail="Index belum ada. Jalankan python -m brain_qa index")

    def generate():
        import json as _json

        try:
            answer_text, citation_meta = answer_query_and_citations(
                question=req.question,
                index_dir_override=None,
                k=req.k,
                max_snippet_chars=300,
                persona=persona_name,
                persona_reason=persona_reason,
            )
        except Exception as e:
            yield f"data: {_json.dumps({'type':'error','message':str(e)}, ensure_ascii=False)}\n\n"
            return

        # Stream answer word-by-word (simulate token streaming dari BM25 offline)
        words = answer_text.split(" ")
        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            yield f"data: {_json.dumps({'type':'token','text':chunk}, ensure_ascii=False)}\n\n"

        # Emit citations
        for c in citation_meta:
            yield f"data: {_json.dumps({'type':'citation','filename': c.get('source_title',''),'snippet':c.get('chunk_id','')}, ensure_ascii=False)}\n\n"

        # Done
        yield f"data: {_json.dumps({'type':'done','persona':persona_name}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/corpus", response_model=CorpusListResponse, tags=["Corpus"])
async def list_corpus() -> CorpusListResponse:
    """Daftar dokumen yang sudah diupload + status indexing."""
    records = _read_uploads_meta()
    # Also reflect public markdown files from index as "ready" if index exists
    docs: list[CorpusDocument] = []
    for r in records:
        docs.append(CorpusDocument(
            id=r["id"],
            filename=r["filename"],
            status=r.get("status", "queued"),
            uploaded_at=r.get("uploaded_at", ""),
            size_bytes=r.get("size_bytes", 0),
        ))

    # Also surface indexed markdown files from brain/public as "ready" docs
    try:
        manifest = load_manifest_paths()
        md_root = manifest.public_markdown_root
        if (default_index_dir() / "READY").exists():
            upload_filenames = {d.filename for d in docs}
            for md_path in sorted(md_root.rglob("*.md")):
                rel = md_path.relative_to(md_root).as_posix()
                if rel not in upload_filenames and md_path.name not in upload_filenames:
                    stat = md_path.stat()
                    docs.append(CorpusDocument(
                        id="idx_" + hashlib.sha1(rel.encode()).hexdigest()[:16],
                        filename=rel,
                        status="ready",
                        uploaded_at=time.strftime(
                            "%Y-%m-%dT%H:%M:%SZ",
                            time.gmtime(stat.st_mtime),
                        ),
                        size_bytes=stat.st_size,
                    ))
    except Exception:
        pass

    return CorpusListResponse(
        documents=docs,
        total_docs=len(docs),
        index_size_bytes=_index_size_bytes(),
        index_capacity_bytes=_INDEX_CAPACITY,
    )


@app.post("/corpus/upload", response_model=UploadResponse, tags=["Corpus"])
async def upload_document(file: UploadFile = File(...)) -> UploadResponse:
    """
    Upload dokumen baru ke knowledge base.
    File masuk status 'queued'; re-index manual diperlukan setelah upload.
    """
    filename = file.filename or "unknown"
    ext = Path(filename).suffix.lower()

    if ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Tipe file tidak didukung: {ext}. Gunakan: {', '.join(_ALLOWED_EXTENSIONS)}",
        )

    content = await file.read()
    if len(content) > _UPLOAD_MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File melebihi batas 10 MB ({len(content) // 1024} KB diterima).",
        )

    ts = time.time()
    doc_id = _doc_id(filename, ts)

    # Save to uploads dir
    dest = _uploads_dir() / f"{doc_id}{ext}"
    dest.write_bytes(content)

    # If it's a .md or .txt, also copy to brain/public/uploads/ for indexing
    try:
        manifest = load_manifest_paths()
        public_uploads = manifest.public_markdown_root / "uploads"
        public_uploads.mkdir(parents=True, exist_ok=True)
        if ext in {".md", ".txt"}:
            (public_uploads / filename).write_bytes(content)
    except Exception:
        pass  # Non-fatal: user can move manually

    # Record metadata
    record = {
        "id": doc_id,
        "filename": filename,
        "status": "queued",
        "uploaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(ts)),
        "size_bytes": len(content),
        "local_path": str(dest),
    }
    _append_uploads_meta(record)

    # Trigger background reindex setelah upload .md / .txt
    if ext in {".md", ".txt"}:
        _trigger_reindex_background()

    return UploadResponse(id=doc_id, filename=filename, status="queued")


@app.post("/corpus/reindex", tags=["Corpus"])
async def trigger_reindex() -> JSONResponse:
    """Trigger reindex corpus secara manual (background). Berguna setelah bulk upload."""
    if _reindex_status["running"]:
        return JSONResponse(content={"ok": True, "status": "already_running"})
    _trigger_reindex_background()
    return JSONResponse(content={"ok": True, "status": "started"})


@app.get("/corpus/reindex/status", tags=["Corpus"])
async def reindex_status() -> JSONResponse:
    """Cek status reindex background."""
    return JSONResponse(content={
        "running": _reindex_status["running"],
        "last_at": _reindex_status["last_at"],
        "chunk_count": _reindex_status["chunk_count"] or _index_chunk_count(),
    })


@app.delete("/corpus/{doc_id}", tags=["Corpus"])
async def delete_document(doc_id: str) -> JSONResponse:
    """Hapus dokumen dari upload registry (dan file jika ada)."""
    records = _read_uploads_meta()
    original_len = len(records)
    remaining = [r for r in records if r.get("id") != doc_id]

    if len(remaining) == original_len:
        raise HTTPException(status_code=404, detail=f"Dokumen tidak ditemukan: {doc_id}")

    # Delete physical file
    deleted = [r for r in records if r.get("id") == doc_id]
    for r in deleted:
        local_path = r.get("local_path")
        if local_path:
            try:
                Path(local_path).unlink(missing_ok=True)
            except Exception:
                pass

    _write_uploads_meta(remaining)
    return JSONResponse(content={"ok": True, "deleted_id": doc_id})


# ── Entry point (called from __main__.py) ────────────────────────────────────

def run_server(host: str = "0.0.0.0", port: int = 8765, reload: bool = False) -> None:
    """Start Uvicorn server. Called by `python -m brain_qa serve`."""
    print(f"[brain_qa serve] Starting on http://{host}:{port}")
    print(f"[brain_qa serve] API docs: http://localhost:{port}/docs")
    print("[brain_qa serve] CTRL+C to stop\n")
    uvicorn.run(
        "brain_qa.serve:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info",
    )
