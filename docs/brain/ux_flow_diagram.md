# EduSupervision — Finalized UX Flow Diagram
## All Three Roles · Every Major Interaction

---

## 1. Platform Roles & Access Map

```mermaid
graph TD
    Ministry["🏛️ Ministry Supervisor\n(SuperAdmin)"]
    Admin["👩‍💼 Institution Admin\n(InstitutionAdmin)"]
    Teacher["👨‍🏫 Teacher\n(Teacher)"]

    Ministry -->|Provisions| Admin
    Admin -->|Invites| Teacher

    Ministry --- M1[Manage Institutions]
    Ministry --- M2[Audit All Evaluations]
    Ministry --- M3[Platform-wide Reports]

    Admin --- A1[Manage Teacher Roster]
    Admin --- A2[Upload Training Content]
    Admin --- A3[Create Assignments]
    Admin --- A4[Review AI Evaluations]
    Admin --- A5[Handle Plagiarism Flags]

    Teacher --- T1[Watch Training Videos]
    Teacher --- T2[Submit Assignments]
    Teacher --- T3[View AI Score Report]
    Teacher --- T4[Track CPD Progression]
```

---

## 2. Unauthenticated Landing → Login Flow

```mermaid
sequenceDiagram
    actor U as Any User
    participant Landing as "/" Landing Page
    participant Login as "/login"
    participant Edge as Next.js Edge Middleware
    participant API as FastAPI /auth/login

    U->>Landing: Visit site
    Landing-->>U: Show Academic Registry hero + CTA
    U->>Login: Click "Sign In"
    Login-->>U: Show credential form
    U->>Login: Submit email + password
    Login->>API: POST /api/auth/login (via Next.js proxy)
    API-->>Login: { access_token, refresh_token, user, role }
    Note over Login: Write refresh_token to HttpOnly cookie
    Note over Login: Store access_token in JS memory
    Login->>Edge: Redirect to role-based dashboard
    alt Role = InstitutionAdmin
        Edge-->>U: /admin/dashboard
    else Role = Teacher
        Edge-->>U: /teacher/dashboard
    else Role = SuperAdmin
        Edge-->>U: /admin/dashboard
    end
```

---

## 3. Institution Setup Flow (SuperAdmin)

```mermaid
flowchart TD
    SA[SuperAdmin logs in] --> SAD[/admin/dashboard]
    SAD --> Prov[POST /api/v1/institutions\nProvide: name, code, admin_email]
    Prov --> |Creates institution + admin user| Email[Celery sends admin credentials email]
    Email --> AdminLogin[Admin receives email\nLogs in with temp password]
    AdminLogin --> ChangePass[Admin changes password]
    ChangePass --> AdminReady[Institution Admin ready]
```

---

## 4. Teacher Onboarding Flow (Admin)

```mermaid
sequenceDiagram
    actor A as Institution Admin
    participant FE as Admin Portal
    participant API as FastAPI
    participant Celery as Celery Mail Worker
    actor T as Teacher

    A->>FE: Navigate to Teacher Roster
    A->>FE: Enter teacher email(s) → "Invite"
    FE->>API: POST /api/v1/teachers/invite { emails: [...] }
    API->>API: Create pending user shells
    API->>API: Generate 72h JWT invite tokens
    API->>Celery: Queue send_onboarding_email tasks
    Celery->>T: Email: "Click to activate your account"

    T->>FE: Visit /register/{token}
    FE-->>T: Show registration form
    T->>API: POST /api/v1/teachers/register/{token}
    Note over API: Decode invite JWT\nHash password\nActivate user\nCreate profile
    API-->>T: HTTP 200 — Registration complete
    T->>FE: Redirect to /login
```

---

## 5. Training Content Flow (Admin → Teacher)

```mermaid
flowchart LR
    subgraph Admin Side
        A1[Admin: Content Library page] --> A2[Upload video/PDF/DOCX]
        A2 --> A3{AWS configured?}
        A3 -->|Yes| A4[GET presigned S3 URL\nBrowser uploads directly to S3]
        A3 -->|No - Dev| A5[Mock PUT to local static/uploads/]
        A4 & A5 --> A6[POST /materials — save metadata]
    end

    subgraph Teacher Side
        T1[Teacher: Training page] --> T2[Browse content library]
        T2 --> T3[Open video/PDF]
        T3 --> T4[Watch video]
        T4 --> T5[sessionStorage saves position every 1s]
        T5 --> T6{30s elapsed?}
        T6 -->|Yes| T7[POST /materials/progress — sync to DB]
        T6 -->|No| T4
        T3 --> T8[Tab close / hide event]
        T8 --> T9[navigator.sendBeacon flush final position]
    end
```

---

## 6. Assignment Creation Flow (Admin)

```mermaid
flowchart TD
    Admin[Admin: /admin/assignments] --> Click[Click + New Assignment]
    Click --> Form[Fill form:\nTitle, Description, Due Date, Max Score]
    Form --> Rubric[Add rubric criteria\nLabel + Weight % each\nWeights must sum to 100%]
    Rubric --> Submit[POST /api/v1/assignments]
    Submit --> Saved[Assignment saved with rubric JSON\nInstitution-scoped]
    Saved --> Visible[Teachers see it in /teacher/assignments]
```

---

## 7. Teacher Submission & AI Evaluation Flow *(Core Feature)*

```mermaid
sequenceDiagram
    actor T as Teacher Browser
    participant FE as Next.js Frontend
    participant API as FastAPI
    participant S3 as S3 / Local Storage
    participant Celery as Celery Worker (ai_heavy)
    participant AI as Google Gemini API
    participant Redis as Redis pub/sub

    T->>FE: /teacher/assignments → Click "Submit Work"
    T->>FE: Drop PDF or DOCX file
    FE->>API: POST /submissions/presign { filename, content_type, assignment_id }
    API-->>FE: { upload_url, s3_key }

    Note over FE: XHR PUT (for upload progress events)
    FE->>S3: PUT file directly to upload_url
    S3-->>FE: HTTP 200

    FE->>API: POST /submissions/confirm { s3_key, file_mime, assignment_id }
    API->>API: Create Submission record (status=pending)
    API->>Celery: dispatch chain to ai_heavy queue
    API-->>FE: HTTP 202 Accepted { submission_id }

    Note over FE: Navigate to /teacher/assignments/{id}
    Note over FE: Poll /submissions/{id}/status every 5s

    Note over Celery: ── Stage 1: Text Extraction ──
    Celery->>S3: Read file bytes
    alt DOCX
        Celery->>Celery: python-docx extract
    else Digital PDF
        Celery->>Celery: PyMuPDF extract
    else Scanned PDF / Image
        Celery->>AI: Gemini Flash Vision OCR
        AI-->>Celery: Extracted text
    end

    Note over Celery: ── Stage 2: Embedding ──
    Celery->>AI: text-embedding-004 (768-dim, mean-pooled chunks)
    AI-->>Celery: embedding vector

    Note over Celery: ── Stage 3: Plagiarism Detection ──
    Celery->>Celery: MinHash n-gram fingerprint (datasketch)
    Celery->>Celery: pgvector HNSW cosine search (scoped to institution)
    alt Similarity > 0.88
        Celery->>Celery: Flag in score_json for admin review
    end

    Note over Celery: ── Stage 4: AI Evaluation ──
    Celery->>AI: Gemini 2.0 Flash (dual-pass, temp=0.1)
    AI-->>Celery: Structured JSON { scores[], overall_score, feedback, recommendations }
    alt Score delta > 5pts between passes
        Celery->>AI: Gemini 1.5 Pro (temp=0.0, deterministic)
        AI-->>Celery: Final evaluation
    end

    Note over Celery: ── Stage 5: Store Result ──
    Celery->>API: Write AIEvaluation record
    Celery->>API: Update submission.status = evaluated

    Note over Celery: ── Stage 6: Notify ──
    Celery->>Redis: PUBLISH submission:{id} { status, score }
    Redis-->>FE: SSE event → evaluation_complete
    FE-->>T: Show score ring animation + criterion breakdown
```

---

## 8. Admin Evaluation Review Flow (Plagiarism & Audit)

```mermaid
flowchart TD
    Admin[Admin: /admin/evaluations] --> Table[View paginated submission table\nAll institution submissions]
    Table --> Filter[Filter by status:\nAll / Evaluated / Processing / Pending / Failed]
    Table --> Row[Click Review → on any submission]
    Row --> Detail[/admin/evaluations/{id}\nFull evaluation detail]

    Detail --> Scores[Criterion scores + evidence quotes]
    Detail --> Feedback[AI feedback paragraph]
    Detail --> Recs[Professional development recommendations]
    Detail --> Flag{Plagiarism flag?}
    Flag -->|Yes| AdminReview[Admin reviews flagged submissions\nMakes final plagiarism determination]
    Flag -->|No| Pass[Evaluation complete — no action needed]

    AdminReview --> Decision{Admin decision}
    Decision -->|Not plagiarism| Clear[Clear flag — teacher notified]
    Decision -->|Confirmed plagiarism| Action[Take appropriate institutional action]
```

---

## 9. CPD Progression Pathway (Teacher)

```mermaid
stateDiagram-v2
    [*] --> Foundation: Account activated\nStage 1 begins

    Foundation: 🏫 Foundation\nComplete 2 training modules\nScore ≥ 60 on first assignment

    Practice: 📖 Practice\nComplete 4 training modules\nMaintain average ≥ 70

    Advanced: 🎓 Advanced\nComplete 6 modules\nMaintain average ≥ 80\nNo unresolved plagiarism flags

    Expert: ⭐ Expert\nAll modules complete\nAverage ≥ 90\nPeer mentor activity

    Foundation --> Practice: Meets Practice criteria
    Practice --> Advanced: Meets Advanced criteria
    Advanced --> Expert: Meets Expert criteria
    Expert --> [*]: CPD cycle complete — report to Ministry
```

---

## 10. Complete System Data Flow

```mermaid
graph TB
    subgraph Client["Client Layer"]
        Browser["Teacher & Admin Browser\n(Next.js App Router)"]
    end

    subgraph Edge["Edge & Gateway"]
        Vercel["Vercel Edge Middleware\nCookie presence guard\nRS256 JWT verify"]
        RH["Next.js Route Handlers\n/api/auth/* proxy\nHides FastAPI from browser"]
    end

    subgraph API["Application Layer"]
        FastAPI["FastAPI\n(ECS Fargate / Local uvicorn)\nAsync endpoints + SSE streams"]
    end

    subgraph Queue["Task Queue"]
        Redis["Redis 7\nBroker + pub/sub\nSSE notification channel"]
        Celery["Celery Workers\nai_heavy queue\n6-stage evaluation pipeline"]
    end

    subgraph Storage["State Layer"]
        PgBouncer["PgBouncer\nConnection pooler"]
        PG["PostgreSQL 16\n+ pgvector\nAll relational + vector data"]
        S3["S3 / Local uploads\nSubmission files\nTraining videos"]
    end

    subgraph AI["AI Engine"]
        Gemini["Google Gemini\n2.0 Flash · 1.5 Pro\ntext-embedding-004"]
    end

    Browser <-->|HTTPS| Vercel
    Vercel <--> RH
    RH <-->|Internal| FastAPI
    FastAPI <-->|Async queries| PgBouncer
    PgBouncer <--> PG
    FastAPI <-->|Task dispatch| Redis
    FastAPI <-->|SSE subscribe| Redis
    Redis <--> Celery
    Celery <-->|Read files| S3
    Celery <-->|AI calls sync SDK| Gemini
    Celery <-->|Sync DB writes| PG
    Browser <-->|Direct PUT| S3
```
