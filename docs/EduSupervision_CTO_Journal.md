# EduSupervision — Master CTO Architecture & Implementation Journal

> **AI-Powered Teacher Training, Evaluation & Educational Supervision Platform**
> 
> *This document captures the low-level, diagrammatic technical systems design, async state machines, multi-tenant database patterns, and event-driven data flows of the EduSupervision platform from Phase 0 to Phase 5.*

---

## 🗺️ Master Platform Roadmap & Journal Directory

The documentation and journals for the platform's lifecycle are located as follows:

| Asset | Path | Description | Format |
|---|---|---|---|
| **Definitive Tech Stack Guide** | [`docs/FINAL_TECH_STACK.md`](file:///c:/Users/Devansh/Desktop/Projects/EduSupervision/docs/FINAL_TECH_STACK.md) | Complete resolved architectural specifications and exact configurations. | Markdown |
| **Phased Development Journal** | [`docs/EduSupervision_CTO_Journal.md`](file:///c:/Users/Devansh/Desktop/Projects/EduSupervision/docs/EduSupervision_CTO_Journal.md) | **(This File)** Low-level diagrams, workflows, and logical state machines for all phases. | Markdown (Mermaid) |
| **Print-Ready Phase 0 Specs** | [`docs/EduSupervision_Phase0_Journal.docx`](file:///c:/Users/Devansh/Desktop/Projects/EduSupervision/docs/EduSupervision_Phase0_Journal.docx) | System architecture blueprint and planning summaries for stakeholders. | MS Word (`.docx`) |
| **Print-Ready CTO Journal** | [`docs/EduSupervision_CTO_Journal.docx`](file:///c:/Users/Devansh/Desktop/Projects/EduSupervision/docs/EduSupervision_CTO_Journal.docx) | Fully styled Word document containing comprehensive code models and blueprints. | MS Word (`.docx`) |

---

## 1. System Topology & Data Flow (Phase 0)

EduSupervision is architected as an asynchronous, event-driven web application. The design separates frontend presentation, stateless API coordination, long-running heavy AI task execution, and sub-second caching.

### 🔌 Component Communication Topology

```mermaid
graph TD
    subgraph Client Layer [Client Layer]
        Browser[Teacher & Admin Browser]
    end

    subgraph CDN & Routing [Edge & Gateway Layer]
        CloudFront[AWS CloudFront CDN / Vercel Edge]
        ALB[AWS Application Load Balancer]
    end

    subgraph Application Core [Service Layer]
        FastAPI[FastAPI API Web Server - AWS ECS Fargate]
        CeleryWorker[Celery Task Workers - AWS ECS Fargate]
    end

    subgraph Storage & Cache [State Layer]
        PG[(PostgreSQL 16 + pgvector)]
        PgBouncer[PgBouncer Connection Pooler]
        Redis[(Redis Cache & Task Broker)]
        S3[(AWS S3 Secure Storage)]
    end

    subgraph AI Engine [Intelligence Layer]
        Gemini[Google Gemini 1.5 Pro / 2.0 Flash API]
    end

    %% Connections
    Browser -->|HTTPS / WSS| CloudFront
    CloudFront -->|Stateless Routes| ALB
    ALB -->|API Request| FastAPI
    FastAPI -->|1. Generate Presigned URL| S3
    Browser -->|2. Direct File Upload| S3
    
    FastAPI -->|Session / Cache| Redis
    FastAPI -->|Acquire Connection| PgBouncer
    PgBouncer -->|Relay Queries| PG

    %% Async Tasks
    FastAPI -->|3. Trigger AI Task| Redis
    Redis -->|4. Pull Job| CeleryWorker
    CeleryWorker -->|5. Read File Stream| S3
    CeleryWorker -->|6. Run Evaluation| Gemini
    CeleryWorker -->|7. Write Results| PgBouncer
    CeleryWorker -->|8. Publish Event| Redis
    Redis -->|9. Broadcast SSE| FastAPI
    FastAPI -->|10. Real-Time Status| Browser
```

---

## 2. Technical Deliberations & Resolved Conflicts (Phase 0.5)

During the architecture review stage, the engineering team resolved major trade-offs in three core domains: database search, security latency, and traffic loads.

### 2.1 Plagiarism Vector Search: HNSW vs. IVFFlat
*   **The Conflict:** The database architect proposed `IVFFlat` for its small memory footprint, while the AI engineer pushed for `HNSW` (Hierarchical Navigable Small World).
*   **The Resolution:** We committed to **HNSW**. While `IVFFlat` consumes less memory, it silently degrades in search accuracy (`recall@10` drops to `~0.90`) as the corpus grows unless constant manual `REINDEX` operations are scheduled. `HNSW` achieves `0.98+` recall natively, handles incremental updates gracefully without accuracy loss, and consumes only `~25MB` of memory for a 100K-vector corpus.

### 2.2 Security: Edge JWKS Fetch vs. Embedded RS256 Env Public Keys
*   **The Conflict:** Verifying access tokens in the Next.js Edge Middleware requires validating the signature. Fetching public keys via a remote JWKS (JSON Web Key Set) endpoint adds network latency.
*   **The Resolution:** The **RS256 Public Key is embedded as an environment variable in Next.js**. This eliminates remote network roundtrips entirely, ensuring sub-5ms route security decisions at the Edge.

### 2.3 Traffic: Throttling Video Progress Tracking
*   **The Conflict:** Tracking video telemetry every 10 seconds would generate 50 requests per second for 500 concurrent teachers, risking database resource exhaustion.
*   **The Resolution:** Implement a **30-second throttled buffer with Keepalive fallback**:
    1. Played timestamps write immediately to client `sessionStorage`.
    2. API syncs occur only once every **30 seconds** during active playback.
    3. If the tab closes or is hidden, a final telemetry payload is flushed instantly via browser `navigator.sendBeacon` or a `fetch(..., { keepalive: true })` call.

---

## 3. Database Architecture & pgvector Modeling (Phase 1)

EduSupervision implements a robust multi-tenant schema where all operational data is partitioned at the query layer via `institution_id` scopes.

### 🗄️ Database Entity Relationship Map

```mermaid
erDiagram
    institutions ||--o{ users : "hosts"
    institutions ||--o{ materials : "curates"
    institutions ||--o{ assignments : "assigns"
    
    users ||--|| profiles : "describes"
    users ||--o{ submissions : "submits"
    users ||--o{ audit_logs : "triggers"
    
    assignments ||--o{ submissions : "assesses"
    submissions ||--|| ai_evaluations : "generates"
    
    institutions {
        uuid id PK
        varchar name
        varchar code UK
        timestamptz created_at
    }
    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar role "SuperAdmin | InstitutionAdmin | Teacher"
        varchar status "pending | active | suspended"
        uuid institution_id FK
    }
    profiles {
        uuid id PK
        uuid user_id FK "Unique"
        varchar first_name
        varchar last_name
        varchar employee_id
    }
    submissions {
        uuid id PK
        uuid teacher_id FK
        uuid assignment_id FK
        uuid institution_id FK
        varchar file_url
        text extracted_text
        vector embedding "768-dimensions"
        varchar status "submitted | processing | evaluated | failed"
    }
```

### ⚡ Indexing Strategy for Performance Isolation
To maintain instant search metrics, database performance is secured with these index rules:
1.  **Multi-Tenant Isolation Routing:** Indexes are created on `(institution_id, user_id)` compound columns.
2.  **Semantic Plagiarism Search Index:**
    ```sql
    CREATE INDEX CONCURRENTLY ON submissions
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);
    ```
3.  **Audit Logs Indexes:** Compound index on `(user_id, created_at DESC)` ensures historical checks do not trigger sequential table scans.

---

## 4. Stateless RS256 Authentication & RBAC (Phase 2)

We implement a highly secure, stateless authentication flow designed to be completely immune to common Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF) vulnerabilities.

### 🔑 Security Protocol Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Teacher as Teacher Browser
    participant Edge as Next.js Edge Middleware
    participant Proxy as Next.js API Route Handler
    participant BE as FastAPI API Server
    
    Teacher->>Proxy: POST /api/auth/login { email, password }
    Proxy->>BE: POST /api/v1/auth/login (Internal Network)
    Note over BE: Validate password hash via pbkdf2_sha256
    BE->>BE: Generate Access Token (RS256 Private Key, 15m expiry)
    BE->>BE: Generate Refresh Token (RS256 Private Key, 7d expiry)
    BE-->>Proxy: Return JSON: { access_token, refresh_token, user }
    
    Note over Proxy: Write refresh_token to HttpOnly, Secure, SameSite=Strict cookie
    Proxy-->>Teacher: Return access_token in JS memory state
    
    Note over Teacher, Edge: Next Route Request (/teacher/dashboard)
    Teacher->>Edge: Access Route (sends cookies automatically)
    Note over Edge: Load Local RS256 Public Key (Vercel Env)
    Edge->>Edge: Verify Signature & check roleClaim
    alt Authorized
        Edge-->>Teacher: Render Layout (Instant client routing)
    else Expired / Unauthorized
        Edge-->>Teacher: Redirect to /login
    end
```

### 🛡️ Core Security Controls
*   **No localStorage Storage:** Access tokens are kept in client-side runtime memory (variables) and are destroyed on page refresh. Refresh tokens live inside secure, HTTP-only cookie structures.
*   **Asymmetric Key Separation:** Public keys only verify tokens, allowing edge middleware to operate without storing private signing keys.
*   **Tenant Scoping:** The `institution_id` claim is automatically extracted from JWT payloads in FastAPI, injecting tenant constraints into database execution handlers.

---

## 5. Bulk Teacher Onboarding Pipeline (Phase 3)

The onboarding model allows administrators to invite hundreds of educators using automated background task coordination.

### 👥 Onboarding & Registration Event Loop

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Institution Admin
    participant BE as FastAPI API Server
    participant Celery as Celery Mail Workers
    actor Teacher as Teacher Client
    
    Admin->>BE: POST /api/v1/teachers/invite { emails: [...] }
    Note over BE: Generate 72-hour invite JWT token (roleClaim=Teacher)
    BE->>Celery: Queue send_onboarding_email task
    BE-->>Admin: HTTP 200 OK (Invited emails queued)
    
    Celery-->>Teacher: Deliver onboarding welcome email containing /register/{token} link
    
    Teacher->>BE: POST /api/v1/teachers/register/{token} { password, profile_details }
    Note over BE: Decode & Verify registration token
    Note over BE: Hash password using pbkdf2_sha256 (29k rounds)
    BE->>BE: Update user.status = 'active' & Insert Profile record
    BE-->>Teacher: HTTP 200 OK (Registration Complete)
```

---

## 6. Training Distribution & Hybrid Video Telemetry (Phase 4)

EduSupervision supports high-bandwidth media delivery that runs both locally in offline developer mode and securely in the cloud.

### 🎥 Media Upload and Progress Buffering Design

```mermaid
graph TD
    subgraph Administration [Admin Video Setup]
        A1[Click Upload Video] --> A2{Check AWS S3 Keys}
        A2 -->|Keys Exist| A3[FastAPI: Generate Presigned URL]
        A2 -->|Keys Missing| A4[FastAPI: Fallback Mock Upload Route]
        A3 --> A5[Direct Browser-to-S3 Upload]
        A4 --> A6[Upload to local static/uploads/ folder]
    end

    subgraph Telemetry [Teacher Playback Telemetry]
        T1[Teacher Plays Video] --> T2[Write play position to sessionStorage every 1s]
        T2 --> T3{Has 30s elapsed since last API sync?}
        T3 -->|Yes| T4[Sync: POST /api/v1/materials/progress]
        T3 -->|No| T2
        T1 --> T5[Tab Closed / Hidden Event]
        T5 --> T6[Flush final position via keepalive fetch]
    end
```

---

## 7. Asynchronous AI Evaluation Engine (Phase 5)

The core engine handles teacher submission parsing, plagiarism indexing, multi-stage LLM evaluation, and real-time frontend updates.

### 🤖 Async AI Evaluation Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Submitting : POST /api/v1/submissions
    Submitting --> S3_Uploading : File validated (MIME/Size)
    S3_Uploading --> Enqueued : Upload completed; Task sent to Redis broker
    S3_Uploading --> Error_Failed : S3 Network/IO exception
    
    state Enqueued {
        [*] --> Redis_Queue : Task ID registered
        Redis_Queue --> Worker_Assigned : Celery worker pulls job
    }

    Enqueued --> Document_Parsing : Status = 'processing'
    
    state Document_Parsing {
        [*] --> Check_MIME
        Check_MIME --> Native_PDF : application/pdf (Digital)
        Check_MIME --> Image_Fallback : image/* or Scanned PDF
        
        Native_PDF --> Extract_Text : Extract stream using PyMuPDF
        Image_Fallback --> Gemini_Vision_OCR : Multi-page Vision prompt
        
        Extract_Text --> Text_Sanitized : Clean whitespace & strip HTML
        Gemini_Vision_OCR --> Text_Sanitized : Extract and clean text layout
    }

    Document_Parsing --> Plagiarism_Matching : Check text length > threshold
    Document_Parsing --> Error_Failed : Empty text stream / Parsing crash

    state Plagiarism_Matching {
        [*] --> Generate_Embedding : Request text-embedding-004
        Generate_Embedding --> Vector_Query : Execute pgvector cosine similarity lookup
        Vector_Query --> Similarity_Verdict : Match score >= 0.85?
        Similarity_Verdict --> Isolate_Match : Flag submission & reference ID
        Similarity_Verdict --> Clear : No close match found
    }

    Plagiarism_Matching --> Rubric_Evaluation
    
    state Rubric_Evaluation {
        [*] --> Construct_Structured_Prompt : Inject Rubric JSON Schema + Submission Text
        Construct_Structured_Prompt --> Call_Gemini_Pro : Invoke API (Temp = 0.2)
        Call_Gemini_Pro --> Parse_Pydantic : Validate structured JSON response
        
        Parse_Pydantic --> Evaluation_Complete : Validation Success
        Parse_Pydantic --> Call_Gemini_Retry : JSON Validation Failure (Refine Prompt)
        Call_Gemini_Retry --> Parse_Pydantic : Retry 2 (Temp = 0.0)
    }

    Rubric_Evaluation --> DB_Write : Status = 'evaluated'
    Rubric_Evaluation --> Error_Failed : Retries exhausted / API timeout

    state DB_Write {
        [*] --> Write_Metrics : Save scores, feedback, and recommendations
        Write_Metrics --> Broadcast_SSE : Trigger WebSocket/SSE notification
    }

    DB_Write --> [*]
    Error_Failed --> [*] : Mark record status = 'failed' & Log Error to Sentry
```

### 🛡️ Evaluation Engine Safeguards
1.  **Strict JSON Output Scheme:** We configure `responseMimeType="application/json"` with exact schema parameters, forcing Gemini to return a structured JSON evaluation matching our domain models.
2.  **Deterministic Evaluation Retries:** In the rare event of a schema mismatch, the fallback handler retries with the larger `Gemini 1.5 Pro` model at `temperature=0.0` (fully deterministic).
3.  **Semantic Plagiarism Flagging:** We calculate similarity strictly within matching assignments of the same institution. If `similarity_score >= 0.85`, the evaluation is flagged for human administrative review.
