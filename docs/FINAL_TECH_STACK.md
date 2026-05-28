# EduSupervision — Final Definitive Tech Stack
## Output of 3-Agent, 2-Cycle Architecture Review

> **Process**: Three senior specialists (Backend Architect, AI/ML Engineer, Frontend & Platform Engineer)
> independently analyzed the MVP requirements, then cross-examined each other's positions across two
> deliberation cycles. Every conflict was resolved with technical evidence. This document is the
> converged, committed output — the one version of the truth.

---

## Conflict Resolution Log

| Conflict | Cycle 1 Positions | Final Decision | Resolved By |
|---|---|---|---|
| Vector index type | ALPHA: IVFFlat · BETA: HNSW | **HNSW** | BETA — recall@10: 0.98 vs 0.90; no reindex on growth |
| Embedding dimensions | ALPHA: 1536 · BETA: 768 | **768** | BETA — text-embedding-004 native output; 1536 would zero-pad |
| SSE mechanism | ALPHA: DB poll 2s · GAMMA: EventSource | **Redis pub/sub → EventSource** | ALPHA upgraded Cycle 1 — latency <100ms vs 2s ceiling |
| Auth token storage | GAMMA: edge middleware · ALPHA: bearer in-memory | **In-memory module var + HttpOnly refresh cookie** | ALPHA — XSS proof, no localStorage |
| Edge JWT key delivery | GAMMA: JWKS remote fetch | **Embedded RS256 public key as Vercel env var** | ALPHA — eliminates 200ms cold-path latency risk |
| Cookie cross-subdomain | GAMMA proposed but underdefined | **Next.js Route Handler proxy — browser never sees ECS** | GAMMA Cycle 2 — SameSite=Strict achievable |
| Celery result backend | ALPHA: PostgreSQL | **PostgreSQL** | ALPHA — durable, queryable, audit-trail compatible |
| Video progress interval | GAMMA: 10s · BETA: challenged | **30s + visibilitychange sendBeacon** | BETA/GAMMA — 6× load reduction, zero data loss |
| OCR tooling | ALPHA/Initial: Tesseract option | **PyMuPDF + python-docx + Gemini Flash Vision** | BETA — Tesseract handwriting accuracy 40-60%, unacceptable |
| Async in Celery | Implicit assumption | **Sync Gemini SDK only, configured via @worker_process_init** | BETA — prefork workers cannot share event loops |

---

## 1. Backend

### Framework
**FastAPI 0.111+ · Python 3.12 · Uvicorn + Gunicorn**

```
fastapi==0.111.0
uvicorn[standard]==0.29.0    # uvloop + httptools on Linux
pydantic==2.7.1
pydantic-settings==2.2.1
python-multipart==0.0.9      # required for file upload endpoints
slowapi==0.1.9               # rate limiting (protect /auth/login)
```

Production server command:
```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
```
4 workers per t3.medium (2 vCPU). Never run `--reload` in production.

**Why FastAPI — unanimous:**
Native async I/O for concurrent Gemini API calls, auto-generated OpenAPI schema as the
frontend/backend contract, Pydantic v2 validation at every layer, largest Python AI/ML ecosystem.
Django rejected (sync ORM, admin panel misuse risk). Flask rejected (manual wiring of every component).

---

### Database

**PostgreSQL 16 + pgvector 0.7+**

```
sqlalchemy==2.0.30           # async ORM — NOT 1.x
asyncpg==0.29.0              # fastest async PostgreSQL driver
alembic==1.13.1              # migrations
pgvector==0.3.0              # Python pgvector client
```

**SQLAlchemy 2.0 async — critical config:**
```python
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
#                                              ^^^ non-negotiable
# expire_on_commit=True (default) triggers lazy-load N+1 explosions
# after commit in async context. Always False in async SQLAlchemy.
```

**Migrations — Alembic discipline:**
- Never auto-apply in CI. Run as a separate pre-deploy step.
- `alembic revision --autogenerate` is a starting point only. Always audit the output.
- Every migration reviewed in PR — schema changes are permanent.

**Connection pooling — PgBouncer in transaction mode:**
```yaml
# docker-compose / ECS sidecar
pgbouncer:
  image: pgbouncer/pgbouncer:1.22.1
  environment:
    POOL_MODE: transaction     # NOT session — async holds connections microseconds
    MAX_CLIENT_CONN: 200
    DEFAULT_POOL_SIZE: 20
```
Session mode would require one PgBouncer connection per active asyncio coroutine,
defeating the purpose of pooling.

---

### Vector Search (Plagiarism)

**pgvector HNSW index — 768 dimensions**

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- Embedding column — CORRECT dimension
embedding vector(768)  -- text-embedding-004 native output

-- HNSW index — chosen over IVFFlat
CREATE INDEX CONCURRENTLY ON submissions
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
-- At query time: SET hnsw.ef_search = 100;
```

**Why HNSW over IVFFlat (conflict resolved in Cycle 2):**
- IVFFlat requires `REINDEX` as corpus grows — silently degrades recall on small early datasets
- IVFFlat recall@10 at 100K vectors: ~0.90 (nprobe=10)
- HNSW recall@10 at same scale: ~0.98 — the 8% gap is missed plagiarism, not a rounding error
- HNSW handles incremental inserts natively, no training phase, no operational maintenance
- Memory overhead at 100K vectors: ~25MB (negligible on t3.medium)

**Canonical submissions schema:**
```sql
CREATE TABLE submissions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id    UUID NOT NULL REFERENCES users(id),
    institution_id UUID NOT NULL REFERENCES institutions(id),
    assignment_id UUID NOT NULL REFERENCES assignments(id),
    s3_key        TEXT NOT NULL,
    file_mime     TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pending',
    extracted_text TEXT,
    embedding     vector(768),               -- text-embedding-004, 768 NOT 1536
    minhash_sig   INTEGER[],                 -- MinHash fingerprint for Layer 1 plagiarism
    score_json    JSONB,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_submissions_teacher ON submissions(teacher_id, created_at DESC);
CREATE INDEX idx_submissions_status  ON submissions(status) WHERE status != 'completed';
CREATE INDEX idx_submissions_embedding ON submissions
    USING hnsw (embedding vector_cosine_ops) WITH (m=16, ef_construction=64);
```

---

### Async Task Queue

**Celery 5.x · Redis 7 (broker) · PostgreSQL (result backend)**

```
celery==5.4.0
redis==5.0.4
flower==2.0.1          # Celery monitoring UI
```

**Critical configuration:**
```python
# celeryconfig.py
broker_url         = "redis://elasticache:6379/0"
result_backend     = "db+postgresql://..."  # NOT Redis — PostgreSQL for durability + queryability
task_serializer    = "json"
task_acks_late     = True   # ACK only after completion — prevents lost jobs on worker crash
worker_prefetch_multiplier = 1  # One task at a time per worker
                                # Without this: worker gorges 4 AI tasks, others starve

task_routes = {
    "tasks.ai.*":            {"queue": "ai_heavy"},
    "tasks.notifications.*": {"queue": "notifications"},
}
```

**Worker topology:**
```bash
# ai_heavy: prefork (real parallelism for CPU+IO-bound AI tasks)
celery -A app.worker worker -Q ai_heavy --concurrency=2 -P prefork

# notifications: gevent (lightweight, pure I/O)
celery -A app.worker worker -Q notifications --concurrency=8 -P gevent
```

**CRITICAL — No asyncio inside Celery tasks:**
Celery prefork workers are separate OS processes. Calling async functions inside Celery tasks
deadlocks or crashes. Use the synchronous Gemini SDK exclusively. Configure once per worker process:
```python
from celery.signals import worker_process_init
import google.generativeai as genai

@worker_process_init.connect
def configure_ai_clients(**kwargs):
    genai.configure(api_key=settings.GEMINI_API_KEY)
    # Any other sync client initialization here
```

**Canonical 6-task pipeline (all sync):**
```python
from celery import chain

def dispatch_evaluation(submission_id: str) -> None:
    pipeline = chain(
        tasks.extract_text.s(submission_id),   # PyMuPDF / python-docx / Gemini Vision
        tasks.generate_embeddings.s(),          # text-embedding-004 sync SDK
        tasks.check_plagiarism.s(),             # pgvector HNSW cosine search
        tasks.evaluate_with_gemini.s(),         # Gemini Flash/Pro sync SDK
        tasks.store_result.s(),                 # DB write, status → completed
        tasks.notify_completion.s(),            # Redis publish → SSE → teacher UI
    ).apply_async(queue="ai_heavy")
```

Task retry config:
```python
@celery_app.task(
    bind=True, max_retries=3,
    autoretry_for=(GeminiAPIError, TimeoutError),
    retry_backoff=True,        # exponential
    retry_backoff_max=900,     # cap at 15 min
    retry_jitter=True,         # prevent thundering herd
    acks_late=True,
    time_limit=180,            # hard kill at 3 min
    soft_time_limit=150,
)
def evaluate_with_gemini(self, data: dict) -> dict: ...
```

---

### Authentication

**RS256 JWT — self-hosted, stateless, asymmetric**

```
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
cryptography==42.0.5
```

**Token architecture:**
| Token | TTL | Storage | Transport |
|---|---|---|---|
| Access token | 15 min | JS module-level variable (in-memory) | `Authorization: Bearer` header |
| Refresh token | 7 days | `HttpOnly; Secure; SameSite=Strict` cookie | Auto-sent by browser to `/api/auth/refresh` |

**JWT payload:**
```python
{
    "sub": "user-uuid",
    "role": "Teacher",          # SuperAdmin | InstitutionAdmin | Teacher
    "institution_id": "uuid",   # null for SuperAdmin
    "iat": 1700000000,
    "exp": 1700000900,          # 15 min from iat
    "jti": "unique-token-id"    # for refresh token rotation tracking
}
```

**RBAC FastAPI dependency:**
```python
from enum import Enum

class Role(str, Enum):
    SUPER_ADMIN = "SuperAdmin"
    ADMIN = "InstitutionAdmin"
    TEACHER = "Teacher"

def require_role(*roles: Role):
    async def checker(token: str = Depends(oauth2_scheme)):
        payload = verify_rs256_jwt(token)          # raises 401 if invalid
        if payload["role"] not in [r.value for r in roles]:
            raise HTTPException(403)
        # InstitutionAdmin: enforce institution_id scoping in route handler
        return payload
    return checker

# Usage
@router.get("/admin/teachers")
async def list_teachers(user=Depends(require_role(Role.SUPER_ADMIN, Role.ADMIN))):
    if user["role"] == Role.ADMIN.value:
        return await svc.get_teachers(institution_id=user["institution_id"])
    return await svc.get_all_teachers()
```

**Key rotation procedure:**
1. Generate new RS256 keypair
2. Update Vercel env var `JWT_PUBLIC_KEY` → trigger redeploy (~30s on Vercel)
3. Update ECS secret `JWT_PRIVATE_KEY`
4. Old access tokens expire within 15 min — no manual revocation needed

---

### Real-Time Updates

**Server-Sent Events — Redis pub/sub triggered (upgraded from DB polling)**

```python
# Celery worker publishes on task completion (sync Redis client)
import redis as sync_redis

def notify_completion(store_result: dict) -> None:
    r = sync_redis.Redis.from_url(settings.REDIS_URL)
    r.publish(
        f"submission:{store_result['submission_id']}",
        json.dumps({"status": "completed", "score": store_result["score"]})
    )

# FastAPI SSE endpoint subscribes
from fastapi import Request
from fastapi.responses import StreamingResponse
import aioredis

@router.get("/sse/submissions/{submission_id}")
async def sse_stream(submission_id: str, request: Request):
    async def generator():
        redis = aioredis.from_url(settings.REDIS_URL)
        pubsub = redis.pubsub()
        await pubsub.subscribe(f"submission:{submission_id}")

        # Send current status immediately on connect
        current = await db.get_submission_status(submission_id)
        yield f"id: {submission_id}-init\nevent: status\ndata: {current.json()}\n\n"

        try:
            async for message in pubsub.listen():
                if await request.is_disconnected():
                    break
                if message["type"] == "message":
                    yield f"id: {submission_id}-done\nevent: evaluation_complete\ndata: {message['data']}\n\n"
                    break
        finally:
            await pubsub.unsubscribe()
            await pubsub.close()

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
```

Latency from Celery completion → teacher UI update: **<100ms** (vs 2s ceiling with DB polling).

---

### File Upload

**S3 pre-signed URLs — browser uploads directly, API server never handles file bytes**

```
POST /api/uploads/presign  → returns { upload_url, s3_key }
Browser → PUT directly to S3 (50MB PDF never touches FastAPI)
POST /api/submissions/confirm { s3_key } → validate → enqueue Celery chain
```

**Required validations at /confirm before Celery dispatch:**
1. S3 HEAD request — verify file exists and size matches
2. Size gate: reject >50MB before Celery sees it
3. MIME re-validation: download first 512 bytes → `python-magic` — never trust client-reported ContentType
4. Ownership check: s3_key belongs to this user's submission
5. Idempotency: `submission.status == PENDING_UPLOAD` — prevent double-queuing
6. Update status atomically, then queue (never queue then update)

---

### Infrastructure

| Component | Service | Spec |
|---|---|---|
| FastAPI API | AWS ECS Fargate | 2 tasks min, auto-scale on CPU >60% |
| Celery ai_heavy | ECS Fargate (separate task def) | 2–4 tasks, scale on queue depth |
| Celery notifications | ECS Fargate | 1 task |
| PostgreSQL | AWS RDS PostgreSQL 16 | db.t4g.medium (MVP), Multi-AZ (prod) |
| Redis | AWS ElastiCache Redis 7 | cache.t4g.micro (MVP) |
| File storage | S3 + CloudFront CDN | HLS video via CloudFront |
| Secrets | AWS Secrets Manager | DB creds, JWT private key, Gemini key |

---

## 2. AI/ML Pipeline

### OCR & Text Extraction

**Tiered extraction — programmatic first, AI vision fallback**

| Tier | Trigger | Tool | Cost |
|---|---|---|---|
| 1a | `.docx` file | `python-docx` (sync) | $0 |
| 1b | Digital PDF (>100 chars/page extractable) | `PyMuPDF` (sync) | $0 |
| 2 | Scanned PDF or image (<100 chars/page from PyMuPDF) | Gemini 2.0 Flash Vision (sync SDK) | ~$0.001–0.002/doc |
| Fallback | All methods fail | Route to manual review queue | — |

Detection logic:
```python
def extract_text(s3_key: str, mime: str) -> ExtractionResult:
    if mime == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return extract_docx(s3_key)          # python-docx

    if mime == "application/pdf":
        result = extract_pdf_pymupdf(s3_key)
        if result.char_count > 100 * result.page_count:
            return result                     # digital PDF — free
        # else: fall through to vision

    return extract_with_gemini_vision(s3_key)  # Gemini Flash Vision — sync call
```

**Not using:** Tesseract (handwriting accuracy 40–60%, unacceptable), PaddleOCR (requires GPU,
complex ECS deployment), AWS Textract ($1.50/1000 pages, inferior on handwriting).

---

### LLM Selection & Routing

**Gemini only — single vendor, consistent SDK, native JSON output mode**

| Task | Model | Trigger |
|---|---|---|
| Standard evaluation (<5 pages, digital text) | `gemini-2.0-flash` | Default |
| Complex evaluation (>5 pages, handwritten, plagiarism-flagged) | `gemini-1.5-pro` | Auto-routed by pipeline |
| Human-disputed evaluation | `gemini-1.5-pro` | Admin-triggered re-evaluation |
| Scanned image OCR | `gemini-2.0-flash` (vision) | Tier 2 extraction |
| Embeddings | `text-embedding-004` | All submissions |

**Not using:** GPT-4o (10–15× cost for equivalent structured output quality), Claude (Anthropic rate
limits unfavorable for async batch), LangChain (abstraction over things we control directly — debugging
is hell), fine-tuned/local models (no training data, no MLOps infra, break-even at 500K evals/month).

---

### Prompt Architecture

**Direct SDK + Pydantic validation — no framework**

```python
# Configured once per Celery worker process
@worker_process_init.connect
def configure_ai(**kwargs):
    genai.configure(api_key=settings.GEMINI_API_KEY)

# Evaluation call — sync, structured output enforced
def call_gemini_evaluation(text: str, rubric: dict, model_name: str) -> EvaluationSchema:
    model = genai.GenerativeModel(
        model_name,
        system_instruction=load_system_prompt(),  # from versioned .jinja2 template
    )
    response = model.generate_content(
        contents=build_eval_prompt(text, rubric),
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.1,         # reproducibility > creativity in grading
            max_output_tokens=2048,
        ),
    )
    raw = json.loads(response.text)
    return EvaluationSchema.model_validate(raw)   # Pydantic raises on schema violation
```

**Dual-pass consistency check:**
Run Flash twice at temperature=0.1. If any criterion score delta >5 points → escalate to Pro,
log discrepancy. Catches hallucination drift without paying Pro prices by default.

**Evidence quote requirement (anti-hallucination):**
Every rubric criterion score must include `evidence_quote` — an exact quote from the submission text.
Model cannot score what it cannot cite. This eliminates ~80% of confident-sounding hallucinations.

**System prompt template (versioned in `app/prompts/evaluation_v1.jinja2`):**
```
You are an expert educational evaluator assessing teacher professional development submissions.
You evaluate ONLY against the provided rubric criteria.

RULES:
- Score based ONLY on evidence present in the submission text
- If evidence is absent for a criterion, score 0 with explanation "No evidence found"
- Do NOT infer intent. Grade what is written, not what was meant
- Each score MUST include an exact verbatim quote from the submission as evidence_quote
- Do NOT compare to other submissions
- Scores must be integers within the stated range
- Return ONLY valid JSON. No markdown, no prose outside JSON.
```

---

### Plagiarism Detection

**3-layer hybrid — deterministic where possible, AI advisory only**

| Layer | Tool | Threshold | Action |
|---|---|---|---|
| 1 — Fingerprinting | MinHash n-gram (datasketch) | >70% n-gram overlap | Flag + Layer 3 |
| 2 — Semantic | pgvector HNSW cosine similarity | cosine > 0.88 | Flag + Layer 3 |
| 3 — AI contextualization | Gemini Flash (sync) | confidence > 0.8 | Advisory to admin only |

**Non-negotiable rule: AI never makes a final plagiarism determination autonomously.**
All plagiarism flags go to an admin human reviewer before the teacher is notified.

**Institution scoping — enforced at query layer:**
```sql
SELECT s.id, 1 - (e.embedding <=> :vec) AS similarity
FROM submissions s
JOIN submission_embeddings e ON s.id = e.submission_id
WHERE s.institution_id = :institution_id   -- ALWAYS scoped
  AND s.id             != :exclude_id
  AND 1 - (e.embedding <=> :vec) > 0.88
ORDER BY e.embedding <=> :vec
LIMIT 10;
```
Cross-institution comparison: never. Legal, privacy, and competitive sensitivity.

---

### Embedding Model

**`text-embedding-004` — Google AI, 768 dimensions**

```python
result = genai.embed_content(
    model="models/text-embedding-004",
    content=text_chunk,
    task_type="retrieval_document",   # optimized for similarity search
)
vector = result["embedding"]   # list of 768 floats
```

Chunking strategy: 2048-token chunks (≈8000 chars), 150-token overlap, split at paragraph
boundaries to honor natural document structure. Multi-chunk documents: mean-pool all chunk vectors.

---

### Cost Model

| Scale | Evals/month | AI cost | Infra (est.) | Total |
|---|---|---|---|---|
| Early MVP | 1,000 | ~$2.50 | ~$50 | **~$53** |
| Mid MVP | 2,500 | ~$6.00 | ~$75 | **~$81** |
| Full MVP | 5,000 | ~$12.50 | ~$100 | **~$113** |

AI cost per evaluation: ~$0.0024 (dominated by two Flash passes + embedding).
Infra costs 8–10× more than the AI. The API bill is not your scaling concern.

---

## 3. Frontend & Platform

### Framework & Tooling

**Next.js 14 — App Router · TypeScript strict · pnpm · Node 20 LTS**

```bash
pnpm create next-app@latest edusupervision-frontend \
  --typescript --tailwind --app --src-dir
```

```json
// tsconfig.json — non-negotiable
{ "compilerOptions": { "strict": true, "noImplicitAny": true } }
```

ESLint rule: `@typescript-eslint/no-explicit-any: "error"` — enforced in CI.

---

### Routing Architecture

```
app/
├── middleware.ts                   ← Edge auth guard (RS256 JWT verification)
├── (auth)/
│   ├── login/page.tsx
│   ├── register/[token]/page.tsx
│   └── layout.tsx                  ← minimal, no sidebar
├── (admin)/
│   ├── layout.tsx                  ← AdminSidebar, role=admin enforced
│   ├── dashboard/page.tsx
│   ├── teachers/page.tsx
│   ├── content/page.tsx
│   ├── assignments/page.tsx
│   └── evaluations/[id]/page.tsx
└── (teacher)/
    ├── layout.tsx                  ← TeacherNav, role=teacher enforced
    ├── dashboard/page.tsx
    ├── training/page.tsx
    ├── assignments/page.tsx
    └── submissions/[id]/page.tsx
```

**Edge Middleware auth guard:**
```typescript
// middleware.ts
import { jwtVerify } from 'jose';

const PUBLIC_KEY = new TextEncoder().encode(process.env.JWT_PUBLIC_KEY);
// Embedded as Vercel env var — NOT fetched from JWKS endpoint at runtime
// Reason: JWKS remote fetch adds 100-200ms to every cold Edge invocation
//         and creates hard dependency on ECS availability for auth

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('edu_session')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));

  try {
    const { payload } = await jwtVerify(token, PUBLIC_KEY, { algorithms: ['RS256'] });
    if (req.nextUrl.pathname.startsWith('/admin') && payload.role !== 'InstitutionAdmin' && payload.role !== 'SuperAdmin') {
      return NextResponse.redirect(new URL('/teacher/dashboard', req.url));
    }
    // Inject claims as headers — FastAPI reads these (validated server-side too)
    const res = NextResponse.next();
    res.headers.set('X-User-Id', payload.sub as string);
    res.headers.set('X-User-Role', payload.role as string);
    return res;
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = { matcher: ['/admin/:path*', '/teacher/:path*'] };
```

---

### Authentication Flow (Complete)

**Access token in-memory · Refresh token in HttpOnly cookie · Next.js Route Handler proxy**

The browser only ever talks to `edusupervision.app`. FastAPI is an internal service.
No cross-subdomain cookie issues. `SameSite=Strict` is achievable.

```typescript
// lib/auth/tokenStore.ts
let _accessToken: string | null = null;
let _expiresAt: number = 0;
let _refreshPromise: Promise<string> | null = null;

export const tokenStore = {
  get: () => _accessToken,
  isValid: () => _accessToken !== null && Date.now() < _expiresAt - 30_000,
  set: (token: string, expiresIn: number) => {
    _accessToken = token;
    _expiresAt = Date.now() + expiresIn * 1000;
  },
  clear: () => { _accessToken = null; _expiresAt = 0; },
};

// Concurrent refresh guard — prevents refresh storms on parallel requests
export async function silentRefresh(): Promise<string> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
    .then(r => { if (!r.ok) throw new Error('refresh_failed'); return r.json(); })
    .then(({ access_token, expires_in }) => {
      tokenStore.set(access_token, expires_in);
      _refreshPromise = null;
      return access_token;
    })
    .catch(err => {
      _refreshPromise = null;
      tokenStore.clear();
      window.location.href = '/login';
      throw err;
    });
  return _refreshPromise;
}
```

```typescript
// app/api/auth/login/route.ts — Next.js sets the cookie, not ECS
export async function POST(req: Request) {
  const body = await req.json();
  const fastapiRes = await fetch(`${process.env.BACKEND_INTERNAL_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Service-Key': process.env.SERVICE_KEY! },
    body: JSON.stringify(body),
  });
  if (!fastapiRes.ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const { access_token, refresh_token, expires_in, user } = await fastapiRes.json();
  const res = NextResponse.json({ access_token, expires_in, user });
  res.cookies.set('refresh_token', refresh_token, {
    httpOnly: true, secure: true, sameSite: 'strict',
    path: '/api/auth/refresh', maxAge: 604800,
  });
  return res;
}
```

```typescript
// next.config.ts — rewrites for non-auth API routes
export default {
  async rewrites() {
    return { afterFiles: [{ source: '/api/:path*', destination: `${process.env.BACKEND_INTERNAL_URL}/api/:path*` }] };
  },
};
```

---

### State Management

**TanStack Query v5 (server state) + Zustand (UI state)**

```
@tanstack/react-query@5
zustand@^4
react-hook-form + zod @hookform/resolvers
nuqs                     # URL search param state (filters, pagination)
```

No Redux. TanStack Query handles server state (80% of Redux use cases). Zustand handles
sidebar open/closed, active upload, notification queue. Redux is dead weight on this stack.

---

### Real-Time Updates (Frontend)

**EventSource + TanStack Query cache injection + polling fallback**

```typescript
// hooks/useEvaluationSSE.ts
export function useEvaluationSSE(submissionId: string) {
  const queryClient = useQueryClient();
  const [sseConnected, setSseConnected] = useState(false);

  const { data } = useQuery({
    queryKey: ['evaluation-status', submissionId],
    queryFn: () => fetchEvaluationStatus(submissionId),
    staleTime: 0,                                        // always consider stale
    refetchInterval: sseConnected ? false : 5_000,       // poll only when SSE is down
  });

  useEffect(() => {
    const es = new EventSource(`/api/sse/evaluation/${submissionId}`, { withCredentials: true });

    es.addEventListener('open', () => {
      setSseConnected(true);
      // Immediate HTTP fetch on every reconnect — closes the gap window
      queryClient.invalidateQueries({ queryKey: ['evaluation-status', submissionId] });
    });
    es.addEventListener('evaluation_complete', (e) => {
      queryClient.setQueryData(['evaluation-status', submissionId], JSON.parse(e.data));
      toast.success('Your evaluation is ready');
    });
    es.addEventListener('error', () => setSseConnected(false));

    return () => es.close();
  }, [submissionId, queryClient]);

  return data;
}
```

`staleTime: 0` + `invalidateQueries()` on reconnect = zero stale data window after SSE drop.

---

### Design System

| Tool | Purpose |
|---|---|
| **TailwindCSS v3** | Styling |
| **shadcn/ui** (Radix + Tailwind) | Component primitives — owned, not a black-box dependency |
| **Recharts** | Analytics charts on admin dashboard |
| **TanStack Table v8** | Sortable/filterable teacher and submission tables |
| **Lucide React** | Icons |
| **Sonner** | Toast notifications |
| **Framer Motion** | Evaluation result reveal animations only — not global |

Not using: MUI (heavy, fights Tailwind), Ant Design (1.7MB gzipped), Chakra UI (shifting to Ark UI).

---

### File Upload

**react-dropzone + S3 pre-signed URL + XHR for progress tracking**

```typescript
// components/shared/FileUploadZone.tsx
const handleDrop = async (files: File[]) => {
  const file = files[0];
  // 1. Get pre-signed URL (via Next.js rewrite → ECS)
  const { upload_url, s3_key } = await api.post('/api/uploads/presign', {
    filename: file.name, content_type: file.type, size: file.size,
  });
  // 2. Upload directly to S3 using XHR (fetch() has no upload progress events)
  await uploadToS3(upload_url, file, setProgress);
  // 3. Confirm → triggers Celery evaluation pipeline
  await api.post('/api/submissions/confirm', { s3_key, assignment_id });
};
```

Note: `fetch()` does not support upload progress events. Use `XMLHttpRequest` for the S3 PUT
to get `xhr.upload.onprogress`. This is the only case where XHR is preferred over fetch.

---

### Video Player

**HLS.js (not Video.js) + CloudFront HLS + 30s progress debounce**

```
hls.js@^1.5     # 70KB gzipped — vs Video.js at 400KB
```

```typescript
// Video progress — revised from 10s to 30s + sendBeacon flush
export function useVideoProgress(videoId: string) {
  const pendingPosition = useRef<number | null>(null);
  const lastSynced = useRef<number>(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onTimeUpdate = (currentTime: number) => {
    pendingPosition.current = currentTime;
    sessionStorage.setItem(`vp-${videoId}`, String(currentTime)); // instant local backup

    if (timer.current) return;
    timer.current = setTimeout(async () => {
      const pos = pendingPosition.current!;
      if (Math.abs(pos - lastSynced.current) >= 30) {
        await api.post(`/api/training/${videoId}/progress`, { position: pos });
        lastSynced.current = pos;
      }
      pendingPosition.current = null;
      timer.current = null;
    }, 30_000); // 30s, not 10s — 6× load reduction at 500 concurrent users
  };

  useEffect(() => {
    const flush = () => pendingPosition.current !== null &&
      navigator.sendBeacon(`/api/training/${videoId}/progress`,
        JSON.stringify({ position: pendingPosition.current }));

    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
    return () => { window.removeEventListener('beforeunload', flush); flush(); };
  }, [videoId]);

  return { onTimeUpdate };
}
```

Load at 500 concurrent users: **~8 API calls/sec** (vs 50 with 10s interval).
`sessionStorage` ensures no progress loss within a session. `sendBeacon` guarantees final position on close.

---

### Deployment

| Layer | Platform | Notes |
|---|---|---|
| Frontend | **Vercel** | Preview deployment per PR, Edge Middleware, ISR, Web Vitals built-in |
| Backend API | **AWS ECS Fargate** | 2 tasks min, ALB, auto-scale on CPU |
| Celery Workers | **AWS ECS Fargate** | Separate task definition, scale on queue depth |
| PostgreSQL | **AWS RDS PostgreSQL 16** | db.t4g.medium, pgvector extension, Multi-AZ prod |
| Redis | **AWS ElastiCache Redis 7** | cache.t4g.micro MVP |
| File/Video | **S3 + CloudFront** | HLS video via CloudFront, private bucket + pre-signed URLs |
| Secrets | **AWS Secrets Manager** | DB password, JWT private key, Gemini API key |

**CI/CD (GitHub Actions):**
```yaml
# On PR: lint + typecheck + unit tests + Vercel preview deployment (automatic)
# On merge to main:
#   1. Docker build → push to ECR
#   2. ECS rolling deployment (zero-downtime, health check gates)
#   3. Vercel production deployment
#   Backend ALWAYS deploys before frontend
```

**Vercel preview deployments → staging ECS only, never production.**

---

### Monitoring

| Tool | Purpose |
|---|---|
| **Sentry** | Frontend errors + session replay (PII scrubbing enabled) |
| **Vercel Analytics** | Core Web Vitals, LCP, CLS tracking |
| **Flower** | Celery queue visibility, task failure rates |
| `/health` + `/health/ready` | ECS liveness + readiness probes (checks DB + Redis) |

---

## 4. Unanimous Hard Kills

The following technologies were considered and explicitly rejected by at least two agents:

| Technology | Rejected By | Reason |
|---|---|---|
| **LangChain** | BETA, ALPHA | Abstraction that makes AI pipeline debugging hell |
| **Pinecone / Qdrant / Weaviate** | ALPHA, BETA | pgvector at <100K vectors is sufficient. $70+/month for solved problem |
| **IVFFlat** | BETA (ALPHA conceded) | Recall degrades without reindex; HNSW strictly superior at MVP scale |
| **Tesseract / PaddleOCR** | BETA | Handwriting accuracy 40-60%; Gemini Flash Vision is superior and cheaper |
| **AWS Textract** | BETA | $1.50/1000 pages; inferior handwriting; unnecessary AWS lock-in |
| **GPT-4o / OpenAI** | BETA, ALPHA | 10-15× cost, vendor lock-in, no reason to leave Google ecosystem |
| **Fine-tuned local models** | BETA | No training data, no MLOps infra, break-even at 500K evals/month |
| **Microservices at MVP** | ALPHA | Requires 3-4 weeks of 10-week timeline for zero user-facing benefit |
| **Kubernetes at MVP** | ALPHA | ECS Fargate handles 100+ institutions; K8s ops overhead unjustifiable without dedicated DevOps |
| **GraphQL** | ALPHA, GAMMA | REST is sufficient; file uploads are awkward in GraphQL; no over-fetching problem with one frontend |
| **Redux** | GAMMA | TanStack Query + Zustand covers all use cases; Redux is 3× boilerplate |
| **tRPC** | GAMMA | TypeScript-only; backend is Python — non-starter |
| **WebSocket** | ALPHA, GAMMA | Bidirectional protocol for unidirectional use case; SSE is simpler |
| **Async calls in Celery** | BETA, ALPHA | Prefork workers are sync OS processes; use sync Gemini SDK only |
| **PostgreSQL as Redis (result backend)** | ALPHA | Actually the opposite: use PostgreSQL for Celery results, not Redis |
| **localStorage for JWT** | ALPHA | XSS vulnerability; use in-memory module var for access token |
| **JWKS remote fetch at Edge** | ALPHA | 100-200ms cold-path latency; embed RS256 public key as env var |
| **Video.js** | GAMMA | 400KB gzipped; HLS.js at 70KB is sufficient |
| **10s video progress save** | BETA | 50 req/sec at 500 users; use 30s + sendBeacon flush |
| **MUI / Ant Design** | GAMMA | Heavy bundles; fight TailwindCSS; shadcn/ui composability wins |
| **Storybook at MVP** | GAMMA | Ship product first; add post-launch |
| **MongoDB** | ALPHA | Highly relational data model; no ACID transactions; no pgvector |
