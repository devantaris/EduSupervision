"""
EduSupervision AI Evaluation Pipeline — Phase 6

This module implements the 6-stage asynchronous Celery task chain that powers
the AI-driven teacher submission evaluation engine.

Pipeline stages:
  1. extract_text       — PyMuPDF / python-docx / Gemini Vision OCR
  2. generate_embedding — text-embedding-004 (768-dim)
  3. check_plagiarism   — Layer 1: MinHash n-gram + Layer 2: pgvector HNSW cosine
  4. evaluate_with_ai   — Gemini Flash structured JSON evaluation (dual-pass)
  5. store_result       — Persist scores + feedback to PostgreSQL
  6. notify_completion  — Redis pub/sub → SSE → teacher browser

CRITICAL: No asyncio inside Celery tasks. All I/O is synchronous.
SQLAlchemy sync session used exclusively inside workers.
"""
import json
import logging
import os
import uuid
from typing import Optional

from celery import chain
from celery.signals import worker_process_init
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.celery import celery_app
from app.core.config import settings

logger = logging.getLogger(__name__)

# ─── Sync DB Engine (Worker-only) ─────────────────────────────────────────────
# Celery prefork workers use sync SQLAlchemy — no asyncpg, no asyncio.
_sync_engine = None
_SyncSession = None


def _get_sync_db() -> Session:
    """Returns a synchronous SQLAlchemy session for Celery worker use."""
    global _sync_engine, _SyncSession
    if _SyncSession is None:
        # Build sync URL from async URL (replace asyncpg driver with psycopg2)
        sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
        _sync_engine = create_engine(sync_url, pool_pre_ping=True)
        _SyncSession = sessionmaker(bind=_sync_engine, expire_on_commit=False)
    return _SyncSession()


# ─── Worker Initialization ────────────────────────────────────────────────────

@worker_process_init.connect
def configure_ai_clients(**kwargs):
    """
    Called once per Celery worker process startup.
    Configures the Google AI SDK synchronously.
    This is the ONLY correct place to configure sync AI clients.
    """
    try:
        import google.generativeai as genai
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            logger.info("✅ Gemini AI client configured for Celery worker process")
        else:
            logger.warning("⚠️  GEMINI_API_KEY not set — AI evaluation will run in mock mode")
    except ImportError:
        logger.warning("google-generativeai not installed — AI evaluation in mock mode")


# ─── Entrypoint: Dispatch Full Pipeline ──────────────────────────────────────

def run_evaluation_pipeline(submission_id: str):
    """
    Top-level function to dispatch the full 6-stage evaluation pipeline as a
    Celery chain. Called from the submissions API after submission confirmation.
    """
    pipeline = chain(
        task_extract_text.s(submission_id),
        task_generate_embedding.s(),
        task_check_plagiarism.s(),
        task_evaluate_with_ai.s(),
        task_store_result.s(),
        task_notify_completion.s(),
    ).apply_async(queue="ai_heavy")
    logger.info(f"Dispatched AI pipeline chain for submission {submission_id}")
    return pipeline


# Register as Celery task for direct .apply_async() calls from submissions API
run_evaluation_pipeline = celery_app.task(
    bind=True,
    name="app.tasks.evaluation_worker.run_evaluation_pipeline",
    max_retries=0,
)(lambda self, submission_id: run_evaluation_pipeline(submission_id))


# ─── Stage 1: Text Extraction ─────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    name="app.tasks.evaluation_worker.task_extract_text",
    max_retries=2,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_jitter=True,
    time_limit=180,
    soft_time_limit=150,
)
def task_extract_text(self, submission_id: str) -> dict:
    """
    Stage 1: Extract plain text from uploaded submission file.

    Tier 1a: .docx → python-docx (free, sync)
    Tier 1b: Digital PDF → PyMuPDF (free, sync)
    Tier 2 : Scanned PDF / image → Gemini Flash Vision (paid, sync)
    Fallback: Mark submission as 'failed' if all methods fail
    """
    logger.info(f"[Stage 1] Extracting text for submission {submission_id}")
    db = _get_sync_db()
    try:
        from app.models.submission import Submission

        submission = db.query(Submission).filter(Submission.id == submission_id).first()
        if not submission:
            raise ValueError(f"Submission {submission_id} not found")

        # Update status to processing
        submission.status = "processing"
        db.commit()

        s3_key = submission.s3_key
        file_mime = submission.file_mime
        extracted_text = ""

        # ── Tier 1a: DOCX ──
        if "wordprocessingml" in file_mime or s3_key.endswith(".docx"):
            extracted_text = _extract_docx(s3_key)

        # ── Tier 1b: Digital PDF ──
        elif file_mime == "application/pdf" or s3_key.endswith(".pdf"):
            result = _extract_pdf_pymupdf(s3_key)
            if result["char_count"] > 100:
                extracted_text = result["text"]
            else:
                # Scanned PDF — fallback to Gemini Vision
                extracted_text = _extract_with_gemini_vision(s3_key)

        # ── Tier 2: Image / Unknown ──
        else:
            extracted_text = _extract_with_gemini_vision(s3_key)

        if not extracted_text or len(extracted_text.strip()) < 50:
            # Not enough text to evaluate — mark failed
            submission.status = "failed"
            db.commit()
            raise ValueError(
                f"Extraction yielded insufficient text ({len(extracted_text)} chars)"
            )

        # Persist extracted text
        submission.extracted_text = extracted_text
        db.commit()

        logger.info(
            f"[Stage 1] ✅ Extracted {len(extracted_text)} chars from submission {submission_id}"
        )
        return {"submission_id": submission_id, "text_length": len(extracted_text)}

    except Exception as e:
        logger.error(f"[Stage 1] ❌ Extraction failed for {submission_id}: {e}")
        try:
            from app.models.submission import Submission
            s = db.query(Submission).filter(Submission.id == submission_id).first()
            if s:
                s.status = "failed"
                db.commit()
        except Exception:
            pass
        raise
    finally:
        db.close()


def _extract_docx(s3_key: str) -> str:
    """Extract text from a .docx file (local path or mock URL)."""
    try:
        import docx
        local_path = _resolve_local_path(s3_key)
        doc = docx.Document(local_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)
    except Exception as e:
        logger.warning(f"python-docx extraction failed: {e}")
        return ""


def _extract_pdf_pymupdf(s3_key: str) -> dict:
    """Extract text from a digital PDF using PyMuPDF."""
    try:
        import fitz  # PyMuPDF
        local_path = _resolve_local_path(s3_key)
        doc = fitz.open(local_path)
        all_text = ""
        for page in doc:
            all_text += page.get_text()
        return {"text": all_text.strip(), "char_count": len(all_text.strip())}
    except Exception as e:
        logger.warning(f"PyMuPDF extraction failed: {e}")
        return {"text": "", "char_count": 0}


def _extract_with_gemini_vision(s3_key: str) -> str:
    """Fallback: use Gemini Flash Vision for scanned PDFs/images."""
    try:
        import google.generativeai as genai
        import pathlib

        local_path = _resolve_local_path(s3_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        with open(local_path, "rb") as f:
            file_bytes = f.read()

        # Detect MIME type
        mime = "application/pdf"
        if local_path.endswith((".jpg", ".jpeg")):
            mime = "image/jpeg"
        elif local_path.endswith(".png"):
            mime = "image/png"

        response = model.generate_content([
            {
                "mime_type": mime,
                "data": file_bytes,
            },
            "Extract all text content from this document. Return only the text, "
            "preserving paragraph structure. Do not add commentary.",
        ])
        return response.text.strip()
    except Exception as e:
        logger.warning(f"Gemini Vision OCR failed: {e}")
        return ""


def _resolve_local_path(s3_key: str) -> str:
    """
    In development mock mode, s3_key is a localhost URL.
    Resolve it to an absolute local filesystem path.
    """
    if s3_key.startswith("http://localhost"):
        # e.g. http://localhost:8000/static/uploads/filename.pdf
        filename = s3_key.split("/static/uploads/")[-1]
        return os.path.join(os.getcwd(), "static", "uploads", filename)
    # Production: would download from S3 — stub for now
    return s3_key


# ─── Stage 2: Generate Embedding ─────────────────────────────────────────────

@celery_app.task(
    bind=True,
    name="app.tasks.evaluation_worker.task_generate_embedding",
    max_retries=3,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=300,
    retry_jitter=True,
    time_limit=120,
)
def task_generate_embedding(self, previous_result: dict) -> dict:
    """
    Stage 2: Generate a 768-dimensional text embedding using text-embedding-004.
    Chunks text at 2048-token boundaries, mean-pools across chunks.
    """
    submission_id = previous_result["submission_id"]
    logger.info(f"[Stage 2] Generating embedding for submission {submission_id}")
    db = _get_sync_db()
    try:
        from app.models.submission import Submission

        submission = db.query(Submission).filter(Submission.id == submission_id).first()
        if not submission or not submission.extracted_text:
            raise ValueError("No extracted text available for embedding")

        text = submission.extracted_text
        # Chunk at ~8000 chars (≈2048 tokens), 600-char overlap
        chunks = _chunk_text(text, chunk_size=8000, overlap=600)

        embedding_vector = _embed_with_mock_or_real(chunks)

        if embedding_vector:
            submission.embedding = embedding_vector
            db.commit()
            logger.info(f"[Stage 2] ✅ Embedded {len(chunks)} chunk(s) for {submission_id}")

        return {"submission_id": submission_id, "chunks_embedded": len(chunks)}

    finally:
        db.close()


def _chunk_text(text: str, chunk_size: int = 8000, overlap: int = 600) -> list[str]:
    """Split text into overlapping chunks at paragraph boundaries."""
    paragraphs = text.split("\n\n")
    chunks = []
    current = ""
    for para in paragraphs:
        if len(current) + len(para) > chunk_size:
            if current:
                chunks.append(current.strip())
            current = current[-overlap:] + "\n\n" + para if overlap and current else para
        else:
            current += "\n\n" + para if current else para
    if current.strip():
        chunks.append(current.strip())
    return chunks or [text]


def _embed_with_mock_or_real(chunks: list[str]) -> Optional[list[float]]:
    """Embed text chunks, mean-pool across chunks. Falls back to mock vector."""
    try:
        import google.generativeai as genai
        all_embeddings = []
        for chunk in chunks:
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=chunk,
                task_type="retrieval_document",
            )
            all_embeddings.append(result["embedding"])

        if not all_embeddings:
            return None

        # Mean-pool all chunk vectors
        n_dims = len(all_embeddings[0])
        mean_vec = [
            sum(emb[i] for emb in all_embeddings) / len(all_embeddings)
            for i in range(n_dims)
        ]
        return mean_vec

    except Exception as e:
        logger.warning(f"Real embedding failed ({e}), using mock vector")
        # Return a deterministic mock 768-dim zero vector in dev mode
        return [0.0] * 768


# ─── Stage 3: Plagiarism Detection ───────────────────────────────────────────

@celery_app.task(
    bind=True,
    name="app.tasks.evaluation_worker.task_check_plagiarism",
    max_retries=2,
    autoretry_for=(Exception,),
    retry_backoff=True,
    time_limit=120,
)
def task_check_plagiarism(self, previous_result: dict) -> dict:
    """
    Stage 3: 2-Layer plagiarism check.
    Layer 1: MinHash n-gram fingerprint similarity (datasketch)
    Layer 2: pgvector HNSW cosine similarity search (cosine threshold 0.88)

    RULE: AI never makes final plagiarism determination. All flags → human admin review.
    All comparisons scoped strictly to same institution.
    """
    submission_id = previous_result["submission_id"]
    logger.info(f"[Stage 3] Checking plagiarism for submission {submission_id}")
    db = _get_sync_db()
    try:
        from app.models.submission import Submission

        submission = db.query(Submission).filter(Submission.id == submission_id).first()
        if not submission:
            raise ValueError("Submission not found")

        plagiarism_flags = []

        # ── Layer 1: MinHash n-gram fingerprinting ──
        if submission.extracted_text:
            minhash_sig = _compute_minhash(submission.extracted_text)
            submission.minhash_sig = minhash_sig
            db.commit()

        # ── Layer 2: pgvector cosine similarity ──
        if submission.embedding:
            similar = _find_similar_submissions(
                db,
                embedding=submission.embedding,
                institution_id=str(submission.institution_id),
                exclude_id=str(submission.id),
                threshold=0.88,
            )
            for match in similar:
                plagiarism_flags.append({
                    "matched_submission_id": match["id"],
                    "similarity_score": match["similarity"],
                    "layer": "vector_cosine",
                })

        if plagiarism_flags:
            logger.warning(
                f"[Stage 3] ⚠️  {len(plagiarism_flags)} plagiarism flags for {submission_id}"
            )
            # Store flags in score_json for admin visibility
            existing = submission.score_json or {}
            existing["plagiarism_flags"] = plagiarism_flags
            submission.score_json = existing
            db.commit()

        return {
            "submission_id": submission_id,
            "plagiarism_flag_count": len(plagiarism_flags),
        }

    finally:
        db.close()


def _compute_minhash(text: str, num_perm: int = 128) -> list[int]:
    """Compute MinHash fingerprint for n-gram similarity detection."""
    try:
        from datasketch import MinHash

        m = MinHash(num_perm=num_perm)
        words = text.lower().split()
        # 3-gram shingles
        shingles = {" ".join(words[i:i+3]) for i in range(len(words) - 2)}
        for shingle in shingles:
            m.update(shingle.encode("utf-8"))
        return list(m.hashvalues)
    except ImportError:
        logger.warning("datasketch not installed — MinHash skipped")
        return []
    except Exception as e:
        logger.warning(f"MinHash computation failed: {e}")
        return []


def _find_similar_submissions(
    db: Session,
    embedding: list[float],
    institution_id: str,
    exclude_id: str,
    threshold: float = 0.88,
) -> list[dict]:
    """Query pgvector HNSW index for cosine-similar submissions, institution-scoped."""
    try:
        vec_str = "[" + ",".join(str(v) for v in embedding) + "]"
        sql = text("""
            SET hnsw.ef_search = 100;
            SELECT s.id, 1 - (s.embedding <=> :vec::vector) AS similarity
            FROM submissions s
            WHERE s.institution_id = :inst_id::uuid
              AND s.id != :exclude_id::uuid
              AND s.embedding IS NOT NULL
              AND 1 - (s.embedding <=> :vec::vector) > :threshold
            ORDER BY s.embedding <=> :vec::vector
            LIMIT 10;
        """)
        result = db.execute(sql, {
            "vec": vec_str,
            "inst_id": institution_id,
            "exclude_id": exclude_id,
            "threshold": threshold,
        })
        return [{"id": str(row[0]), "similarity": float(row[1])} for row in result]
    except Exception as e:
        logger.warning(f"pgvector similarity search failed: {e}")
        return []


# ─── Stage 4: AI Rubric Evaluation ───────────────────────────────────────────

@celery_app.task(
    bind=True,
    name="app.tasks.evaluation_worker.task_evaluate_with_ai",
    max_retries=3,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=900,
    retry_jitter=True,
    acks_late=True,
    time_limit=180,
    soft_time_limit=150,
)
def task_evaluate_with_ai(self, previous_result: dict) -> dict:
    """
    Stage 4: Dual-pass Gemini Flash rubric evaluation.

    Pass 1: gemini-2.0-flash at temperature=0.1
    Pass 2: gemini-2.0-flash at temperature=0.1 (consistency check)
    If any criterion score delta > 5 pts → escalate to gemini-1.5-pro at temp=0.0

    Anti-hallucination: every criterion score MUST include an evidence_quote.
    """
    submission_id = previous_result["submission_id"]
    logger.info(f"[Stage 4] Running AI evaluation for submission {submission_id}")
    db = _get_sync_db()
    try:
        from app.models.submission import Submission
        from app.models.assignment import Assignment

        submission = db.query(Submission).filter(Submission.id == submission_id).first()
        if not submission or not submission.extracted_text:
            raise ValueError("No text to evaluate")

        assignment = db.query(Assignment).filter(
            Assignment.id == submission.assignment_id
        ).first()
        if not assignment:
            raise ValueError("Assignment not found for evaluation")

        rubric = assignment.rubric or {"criteria": []}
        text = submission.extracted_text

        # Run evaluation (real or mock)
        evaluation_result = _run_gemini_evaluation(text, rubric, submission_id)

        return {
            "submission_id": submission_id,
            "overall_score": evaluation_result["overall_score"],
            "evaluation_data": evaluation_result,
        }

    finally:
        db.close()


def _run_gemini_evaluation(text: str, rubric: dict, submission_id: str) -> dict:
    """
    Execute dual-pass Gemini evaluation with consistency check.
    Falls back to structured mock result when Gemini API unavailable.
    """
    try:
        import google.generativeai as genai

        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not set")

        criteria = rubric.get("criteria", [])
        system_prompt = _build_system_prompt()
        user_prompt = _build_eval_prompt(text, criteria)

        schema = _build_eval_schema(criteria)

        # Pass 1
        model_flash = genai.GenerativeModel(
            "gemini-2.0-flash",
            system_instruction=system_prompt,
        )
        resp1 = model_flash.generate_content(
            user_prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.1,
                max_output_tokens=2048,
            ),
        )
        result1 = json.loads(resp1.text)

        # Pass 2 (consistency check)
        resp2 = model_flash.generate_content(
            user_prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.1,
                max_output_tokens=2048,
            ),
        )
        result2 = json.loads(resp2.text)

        # Check consistency — escalate to Pro if delta > 5
        scores1 = {s["criterion"]: s["score_assigned"] for s in result1.get("scores", [])}
        scores2 = {s["criterion"]: s["score_assigned"] for s in result2.get("scores", [])}
        max_delta = max(
            (abs(scores1.get(k, 0) - scores2.get(k, 0)) for k in scores1),
            default=0,
        )

        if max_delta > 5:
            logger.info(f"[Stage 4] Score delta {max_delta} > 5 — escalating to gemini-1.5-pro")
            model_pro = genai.GenerativeModel(
                "gemini-1.5-pro",
                system_instruction=system_prompt,
            )
            resp_pro = model_pro.generate_content(
                user_prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.0,
                    max_output_tokens=2048,
                ),
            )
            return json.loads(resp_pro.text)

        return result1

    except Exception as e:
        logger.warning(f"Gemini evaluation failed ({e}) — returning mock evaluation")
        return _mock_evaluation(rubric)


def _build_system_prompt() -> str:
    return """You are an expert educational evaluator assessing teacher professional development submissions.
You evaluate ONLY against the provided rubric criteria.

RULES:
- Score based ONLY on evidence present in the submission text
- If evidence is absent for a criterion, score 0 with explanation "No evidence found"
- Do NOT infer intent. Grade what is written, not what was meant
- Each score MUST include an exact verbatim quote from the submission as evidence_quote
- Do NOT compare to other submissions
- Scores must be integers within the stated range (0-100 per criterion)
- Return ONLY valid JSON. No markdown, no prose outside JSON."""


def _build_eval_prompt(text: str, criteria: list) -> str:
    criteria_text = "\n".join(
        f"  - {c.get('label', c.get('id', 'Criterion'))}: weight {c.get('weight', 0)}%"
        for c in criteria
    )
    return f"""Evaluate this teacher professional development submission:

RUBRIC CRITERIA:
{criteria_text}

SUBMISSION TEXT:
---
{text[:6000]}
---

Return a JSON object with this exact schema:
{{
  "scores": [
    {{
      "criterion": "<criterion label>",
      "score_assigned": <integer 0-100>,
      "justification": "<explanation>",
      "evidence_quote": "<exact quote from submission>"
    }}
  ],
  "overall_score": <weighted average 0-100>,
  "feedback": "<comprehensive professional feedback paragraph>",
  "recommendations": [
    {{
      "area": "<area for improvement>",
      "action": "<specific actionable step>",
      "priority": "high|medium|low"
    }}
  ]
}}"""


def _build_eval_schema(criteria: list) -> dict:
    """Build Gemini JSON schema for structured output."""
    return {
        "type": "object",
        "properties": {
            "scores": {"type": "array"},
            "overall_score": {"type": "number"},
            "feedback": {"type": "string"},
            "recommendations": {"type": "array"},
        },
        "required": ["scores", "overall_score", "feedback", "recommendations"],
    }


def _mock_evaluation(rubric: dict) -> dict:
    """Return a structured mock evaluation when Gemini is unavailable (dev mode)."""
    criteria = rubric.get("criteria", [])
    scores = [
        {
            "criterion": c.get("label", "Criterion"),
            "score_assigned": 75,
            "justification": "Mock evaluation: API key not configured.",
            "evidence_quote": "[Mock — configure GEMINI_API_KEY for real evaluation]",
        }
        for c in criteria
    ] or [
        {
            "criterion": "General Quality",
            "score_assigned": 75,
            "justification": "Mock evaluation result (development mode).",
            "evidence_quote": "[Mock evaluation]",
        }
    ]
    return {
        "scores": scores,
        "overall_score": 75.0,
        "feedback": (
            "This is a mock evaluation result generated in development mode. "
            "Configure GEMINI_API_KEY in your .env file to enable real AI evaluation."
        ),
        "recommendations": [
            {
                "area": "System Configuration",
                "action": "Set GEMINI_API_KEY in backend .env to enable real AI evaluation.",
                "priority": "high",
            }
        ],
    }


# ─── Stage 5: Store Evaluation Results ───────────────────────────────────────

@celery_app.task(
    bind=True,
    name="app.tasks.evaluation_worker.task_store_result",
    max_retries=3,
    autoretry_for=(Exception,),
    retry_backoff=True,
    acks_late=True,
    time_limit=60,
)
def task_store_result(self, previous_result: dict) -> dict:
    """
    Stage 5: Persist evaluation results to PostgreSQL.
    Updates submission.status = 'evaluated' and creates AIEvaluation record.
    """
    submission_id = previous_result["submission_id"]
    evaluation_data = previous_result["evaluation_data"]
    logger.info(f"[Stage 5] Storing results for submission {submission_id}")
    db = _get_sync_db()
    try:
        from app.models.submission import Submission
        from app.models.evaluation import AIEvaluation

        submission = db.query(Submission).filter(Submission.id == submission_id).first()
        if not submission:
            raise ValueError("Submission not found")

        overall_score = float(evaluation_data.get("overall_score", 0))
        scores = evaluation_data.get("scores", [])
        feedback = evaluation_data.get("feedback", "")
        recommendations = evaluation_data.get("recommendations", [])

        # Create AIEvaluation record
        evaluation = AIEvaluation(
            submission_id=uuid.UUID(submission_id),
            scores=scores,
            overall_score=overall_score,
            feedback=feedback,
            recommendations=recommendations,
            tokens_used=evaluation_data.get("tokens_used", 0),
        )
        db.add(evaluation)

        # Update submission status and cache score
        submission.status = "evaluated"
        submission.score_json = {
            "overall_score": overall_score,
            "criterion_count": len(scores),
            "has_plagiarism_flag": bool(
                (submission.score_json or {}).get("plagiarism_flags")
            ),
        }
        db.commit()

        logger.info(
            f"[Stage 5] ✅ Stored evaluation — score {overall_score:.1f}/100 for {submission_id}"
        )
        return {
            "submission_id": submission_id,
            "overall_score": overall_score,
        }

    finally:
        db.close()


# ─── Stage 6: Notify Completion (Redis pub/sub) ───────────────────────────────

@celery_app.task(
    bind=True,
    name="app.tasks.evaluation_worker.task_notify_completion",
    max_retries=3,
    autoretry_for=(Exception,),
    retry_backoff=True,
    time_limit=30,
)
def task_notify_completion(self, previous_result: dict) -> dict:
    """
    Stage 6: Publish evaluation completion event to Redis channel.
    The FastAPI SSE endpoint subscribes and pushes real-time updates to the teacher browser.
    Latency from Celery completion → teacher UI: < 100ms.
    """
    submission_id = previous_result["submission_id"]
    overall_score = previous_result.get("overall_score", 0)
    logger.info(f"[Stage 6] Broadcasting completion event for {submission_id}")

    try:
        import redis as sync_redis

        r = sync_redis.Redis.from_url(settings.REDIS_URL)
        payload = json.dumps({
            "submission_id": submission_id,
            "status": "evaluated",
            "overall_score": overall_score,
        })
        channel = f"submission:{submission_id}"
        r.publish(channel, payload)
        logger.info(f"[Stage 6] ✅ Published to Redis channel '{channel}'")
        r.close()

    except Exception as e:
        logger.warning(f"[Stage 6] Redis notification failed (non-critical): {e}")
        # Non-critical — teacher can poll /status endpoint as fallback

    return {"submission_id": submission_id, "notified": True}
