"""
EduSupervision - Phase 0 CTO Journal Generator
Generates a comprehensive Word document (.docx) combining the implementation
plan, system architecture, logic flows, and design decisions.
"""

from docx import Document
from docx.shared import Pt, RGBColor, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import datetime

# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def set_cell_bg(cell, hex_color):
    """Set background color of a table cell."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tcPr.append(shd)


def add_heading(doc, text, level=1, color=None):
    heading = doc.add_heading(text, level=level)
    heading.alignment = WD_ALIGN_PARAGRAPH.LEFT
    for run in heading.runs:
        if color:
            run.font.color.rgb = RGBColor(*bytes.fromhex(color))
    return heading


def add_paragraph(doc, text, bold=False, size=11, color=None, indent=False):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = bold
    run.font.size = Pt(size)
    if color:
        run.font.color.rgb = RGBColor(*bytes.fromhex(color))
    if indent:
        p.paragraph_format.left_indent = Inches(0.4)
    return p


def add_code_block(doc, code_text):
    """Render a code block with monospaced font, shaded background."""
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.4)
    p.paragraph_format.right_indent = Inches(0.4)
    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), '1E1E2E')
    pPr.append(shd)
    run = p.add_run(code_text)
    run.font.name = 'Cascadia Code'
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(0xA6, 0xE3, 0xA1)
    return p


def add_bullet(doc, text, level=0, bold_prefix=None):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.left_indent = Inches(0.3 + level * 0.3)
    if bold_prefix:
        run = p.add_run(bold_prefix)
        run.bold = True
        run.font.size = Pt(11)
        run2 = p.add_run(text)
        run2.font.size = Pt(11)
    else:
        run = p.add_run(text)
        run.font.size = Pt(11)
    return p


def add_table(doc, headers, rows, header_bg="1A1A2E", header_fg="FFFFFF", alt_row_bg="F0F4FF"):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = 'Table Grid'

    # Header row
    hdr_row = table.rows[0]
    for i, h in enumerate(headers):
        cell = hdr_row.cells[i]
        cell.text = h
        set_cell_bg(cell, header_bg)
        for para in cell.paragraphs:
            for run in para.runs:
                run.bold = True
                run.font.color.rgb = RGBColor(*bytes.fromhex(header_fg))
                run.font.size = Pt(10)

    # Data rows
    for r_idx, row_data in enumerate(rows):
        row = table.rows[r_idx + 1]
        bg = alt_row_bg if r_idx % 2 == 0 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.text = val
            set_cell_bg(cell, bg)
            for para in cell.paragraphs:
                for run in para.runs:
                    run.font.size = Pt(10)
    return table


def add_divider(doc):
    p = doc.add_paragraph()
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '6')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), '4F46E5')
    pBdr.append(bottom)
    pPr.append(pBdr)


# ─────────────────────────────────────────────
# DOCUMENT SETUP
# ─────────────────────────────────────────────

doc = Document()

# Page margins
section = doc.sections[0]
section.top_margin = Cm(2.0)
section.bottom_margin = Cm(2.0)
section.left_margin = Cm(2.5)
section.right_margin = Cm(2.5)

# Default font
style = doc.styles['Normal']
style.font.name = 'Inter'
style.font.size = Pt(11)


# ─────────────────────────────────────────────
# COVER PAGE
# ─────────────────────────────────────────────

doc.add_paragraph()
doc.add_paragraph()

title_p = doc.add_paragraph()
title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
title_run = title_p.add_run('EduSupervision')
title_run.bold = True
title_run.font.size = Pt(36)
title_run.font.color.rgb = RGBColor(0x4F, 0x46, 0xE5)

subtitle_p = doc.add_paragraph()
subtitle_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
sub_run = subtitle_p.add_run('AI-Powered Teacher Training, Evaluation & Educational Supervision Platform')
sub_run.font.size = Pt(14)
sub_run.font.color.rgb = RGBColor(0x64, 0x64, 0x8C)

doc.add_paragraph()

phase_p = doc.add_paragraph()
phase_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
phase_run = phase_p.add_run('PHASE 0 — SYSTEM ARCHITECTURE & IMPLEMENTATION BLUEPRINT')
phase_run.bold = True
phase_run.font.size = Pt(13)
phase_run.font.color.rgb = RGBColor(0x10, 0xB9, 0x81)

doc.add_paragraph()

meta_p = doc.add_paragraph()
meta_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
meta_p.add_run(f'Document Version: 1.0   |   Date: {datetime.date.today().strftime("%B %d, %Y")}   |   Classification: Internal – Architecture\n')
meta_p.add_run('Author: CTO Office — EduSupervision Engineering Team')

doc.add_page_break()


# ─────────────────────────────────────────────
# SECTION 1: EXECUTIVE SUMMARY
# ─────────────────────────────────────────────

add_heading(doc, '1. Executive Summary', level=1, color='4F46E5')
add_divider(doc)

add_paragraph(doc, (
    'EduSupervision is an institutional-grade, AI-powered teacher training and educational supervision platform. '
    'The system is architected to address systemic deficiencies in how educational institutions train, evaluate, '
    'and provide structured feedback to their teaching workforce. Traditional supervision models are manual, '
    'inconsistent, and unscalable. EduSupervision replaces that with a centralized, async-first, AI-orchestrated '
    'workflow that standardizes teacher quality assessment across any institution size.'
))

add_paragraph(doc, 'Core Platform Value Propositions:', bold=True)
add_bullet(doc, 'Centralized AI-assisted teacher evaluation using rubric-driven structured prompts.')
add_bullet(doc, 'Asynchronous document processing pipeline (Celery + Redis + Gemini API).')
add_bullet(doc, 'Real-time institutional performance dashboards with pgvector-based semantic comparisons.')
add_bullet(doc, 'Institution-isolated, RBAC-governed multi-tenant security model.')
add_bullet(doc, 'Extensible architecture designed for phased capability addition without code rewrites.')

doc.add_paragraph()


# ─────────────────────────────────────────────
# SECTION 2: PLATFORM ARCHITECTURE
# ─────────────────────────────────────────────

add_heading(doc, '2. Platform Architecture', level=1, color='4F46E5')
add_divider(doc)

add_heading(doc, '2.1 Stack Decisions & Engineering Rationale', level=2)

rows_stack = [
    ['Frontend', 'Next.js 14+ (App Router)', 'React Server Components for reduced hydration cost. SSR + ISR for dashboard pages. Native API route proxying avoids CORS complexity.'],
    ['Styling', 'TailwindCSS', 'Utility-first, zero-runtime CSS. Compatible with shadcn/ui component primitives for rapid institutional UI composition.'],
    ['Backend API', 'FastAPI (Python 3.11+)', 'Native async/await support critical for concurrent Gemini API calls. Auto-generates OpenAPI docs. Pydantic V2 for strict schema enforcement at every layer.'],
    ['Task Queue', 'Celery + Redis', 'Decouples long-running AI jobs from HTTP threads. Redis broker supports pub/sub for live SSE broadcasts. Celery Beat handles scheduled report generation.'],
    ['Database', 'PostgreSQL 16 + pgvector', 'ACID compliance for institutional data. pgvector enables cosine similarity lookups without a separate vector DB. HNSW indexing ensures sub-10ms similarity queries at scale.'],
    ['AI Engine', 'Google Gemini 1.5 Pro / Flash', 'Gemini 1.5 Flash for fast single-page evaluations. 1.5 Pro for multi-page vision-based OCR and complex rubric analysis. Structured JSON output mode eliminates parsing ambiguity.'],
    ['OCR Layer', 'PyMuPDF + Gemini Vision', 'PyMuPDF handles native digital PDFs at zero API cost. Gemini Vision fallback for scanned/handwritten documents ensures 97%+ extraction accuracy.'],
    ['Auth', 'Self-hosted JWT (RS256)', 'RS256 asymmetric signing enables stateless verification across services. HttpOnly cookie storage prevents XSS token theft. Refresh token rotation with Redis-backed revocation list.'],
    ['Storage', 'AWS S3 + CloudFront CDN', 'S3 for raw document and video storage. CloudFront CDN for low-latency video streaming to geographically distributed institutions.'],
    ['Video Streaming', 'Cloudinary HLS', 'Adaptive bitrate HLS streaming transcoded by Cloudinary. Ensures reliable playback in bandwidth-constrained environments common in government schools.'],
]

add_table(doc,
    headers=['Layer', 'Technology', 'Engineering Rationale'],
    rows=rows_stack
)

doc.add_paragraph()
add_heading(doc, '2.2 System Topology Diagram', level=2)
add_paragraph(doc, 'The following describes the layered component topology and data flow direction across the platform:')

add_code_block(doc, '''
┌──────────────────────────────────────────────────────────────────────────┐
│                      END USER CLIENTS (Browser)                          │
│              Admin Portal ◄──────────────────► Teacher Portal            │
└────────────────────────┬─────────────────────────────────────────────────┘
                         │ HTTPS / WSS
                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                 Vercel Edge / CloudFront CDN Layer                        │
│   Static Assets  │  Next.js SSR Pages  │  Video Streaming (HLS/CDN)      │
└────────────────────────┬─────────────────────────────────────────────────┘
                         │ REST API Calls
                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                  AWS Application Load Balancer                            │
└──────────────┬──────────────────────────────────┬───────────────────────┘
               │                                  │
               ▼                                  ▼
   ┌───────────────────────┐          ┌───────────────────────┐
   │  FastAPI API Server   │          │  Celery Worker Pool   │
   │  (AWS ECS Fargate)    │◄────────►│  (AWS ECS Fargate)    │
   └───────────┬───────────┘          └───────────┬───────────┘
               │                                  │
    ┌──────────┼──────────────────────────────────┤
    │          │                                  │
    ▼          ▼                                  ▼
┌───────┐  ┌───────┐                    ┌─────────────────┐
│  RDS  │  │ Redis │                    │  Gemini API     │
│  PG   │  │ Cache │                    │  (Google Cloud) │
│  DB   │  │ Pub/  │                    └─────────────────┘
│+pgvec │  │ Sub   │
└───────┘  └───────┘
''')


# ─────────────────────────────────────────────
# SECTION 3: DATABASE SCHEMA DESIGN
# ─────────────────────────────────────────────

doc.add_page_break()
add_heading(doc, '3. Database Schema Design', level=1, color='4F46E5')
add_divider(doc)

add_heading(doc, '3.1 Entity Relationship Map', level=2)
add_code_block(doc, '''
institutions ──────< users >──────── profiles
     │                  │
     │                  │
     ├──────< materials  │
     │                  │
     └──────< assignments >──────< submissions >──────── ai_evaluations
                                        │
                                   audit_logs

Cardinality:
  institutions  ──1:N──►  users
  users         ──1:1──►  profiles
  institutions  ──1:N──►  materials
  institutions  ──1:N──►  assignments
  assignments   ──1:N──►  submissions
  users(teacher)──1:N──►  submissions
  submissions   ──1:1──►  ai_evaluations
  users         ──1:N──►  audit_logs
''')

add_heading(doc, '3.2 Table Definitions & Indexing Strategy', level=2)

tables_info = [
    ('institutions', ['id UUID PK', 'name VARCHAR(255)', 'code VARCHAR(50) UNIQUE', 'created_at TIMESTAMPTZ'],
     'Root tenant entity. All data is scoped to an institution_id to enforce multi-tenant isolation at the query layer.'),
    ('users', ['id UUID PK', 'email VARCHAR UNIQUE', 'password_hash VARCHAR', 'role ENUM(super_admin, admin, teacher)', 'status ENUM(pending, active, suspended)', 'institution_id UUID FK'],
     'Central auth entity. Role column drives all RBAC middleware decisions. Indexed on email and institution_id.'),
    ('profiles', ['id UUID PK', 'user_id UUID FK UNIQUE', 'first_name', 'last_name', 'employee_id', 'bio TEXT'],
     'One-to-one extension of users. Separated to keep auth table lean and avoid fetching PII on every JWT validation.'),
    ('materials', ['id UUID PK', 'institution_id UUID FK', 'title', 'type ENUM(video, pdf, document)', 'file_url VARCHAR(512)', 'uploader_id UUID FK'],
     'Training content. file_url points to S3 object. Cloudinary HLS URL stored for videos post-transcoding webhook.'),
    ('assignments', ['id UUID PK', 'institution_id UUID FK', 'title', 'description TEXT', 'rubric JSONB', 'max_score INT', 'due_date TIMESTAMPTZ', 'creator_id UUID FK'],
     'rubric JSONB contains weighted criteria array. Stored as JSONB for flexible schema evolution without migrations.'),
    ('submissions', ['id UUID PK', 'assignment_id UUID FK', 'teacher_id UUID FK', 'file_url VARCHAR(512)', 'text_content TEXT', 'embedding vector(1536)', 'status ENUM(submitted, processing, evaluated, failed)'],
     'embedding column uses pgvector type. HNSW index on embedding enables fast cosine similarity lookups for plagiarism checks. Indexed on assignment_id and teacher_id.'),
    ('ai_evaluations', ['id UUID PK', 'submission_id UUID FK UNIQUE', 'scores JSONB', 'overall_score NUMERIC(5,2)', 'feedback TEXT', 'recommendations JSONB', 'tokens_used INT'],
     'One-to-one with submissions. scores and recommendations stored as JSONB arrays matching the Pydantic schema contract.'),
    ('audit_logs', ['id UUID PK', 'user_id UUID FK', 'action VARCHAR(100)', 'ip_address VARCHAR(45)', 'details JSONB', 'created_at TIMESTAMPTZ'],
     'Append-only governance log. Writes happen async via background tasks to avoid impacting API response latency. Indexed on user_id and action.'),
]

for table_name, columns, note in tables_info:
    add_paragraph(doc, f'Table: {table_name}', bold=True, size=11, color='10B981')
    add_paragraph(doc, note, size=10, indent=True)
    add_code_block(doc, '\n'.join(f'  {col}' for col in columns))
    doc.add_paragraph()


# ─────────────────────────────────────────────
# SECTION 4: API DESIGN
# ─────────────────────────────────────────────

doc.add_page_break()
add_heading(doc, '4. API Design & Contract', level=1, color='4F46E5')
add_divider(doc)

add_heading(doc, '4.1 Versioning & Middleware Strategy', level=2)
add_paragraph(doc, (
    'All endpoints are versioned under /api/v1. Middleware stack is ordered as: '
    'Rate Limiter → CORS → Request Logging → JWT Decoder → RBAC Role Checker → Route Handler. '
    'Token verification uses RS256 asymmetric keys. Public keys are distributed via a /.well-known/jwks.json endpoint '
    'to enable future service-to-service validation without shared secrets.'
))

add_heading(doc, '4.2 Full Endpoint Registry', level=2)

api_rows = [
    ['POST', '/api/v1/auth/login', 'Public', 'Authenticate credentials, return access + refresh JWT pair.'],
    ['POST', '/api/v1/auth/refresh', 'Public', 'Rotate access token using valid refresh token.'],
    ['DELETE', '/api/v1/auth/logout', 'Any Auth', 'Revoke refresh token (add to Redis denylist).'],
    ['POST', '/api/v1/institutions', 'SuperAdmin', 'Provision new institution tenant.'],
    ['GET', '/api/v1/institutions/{id}/stats', 'SuperAdmin', 'Aggregated institution performance telemetry.'],
    ['POST', '/api/v1/teachers/invite', 'Admin', 'Bulk invite teachers via email list.'],
    ['POST', '/api/v1/teachers/register/{token}', 'Public', 'Complete teacher onboarding from invite link.'],
    ['GET', '/api/v1/teachers', 'Admin', 'Paginated list of teachers with status and score summary.'],
    ['PATCH', '/api/v1/teachers/{id}/verify', 'Admin', 'Activate or suspend teacher account.'],
    ['POST', '/api/v1/materials', 'Admin', 'Upload training material metadata (file pre-signed via S3).'],
    ['GET', '/api/v1/materials', 'Any Auth', 'List materials scoped to caller\'s institution.'],
    ['DELETE', '/api/v1/materials/{id}', 'Admin', 'Soft-delete material record.'],
    ['POST', '/api/v1/assignments', 'Admin', 'Create assignment with embedded rubric JSON schema.'],
    ['GET', '/api/v1/assignments', 'Any Auth', 'List institutional assignments (teacher sees active only).'],
    ['PUT', '/api/v1/assignments/{id}', 'Admin', 'Update assignment or rubric before due date.'],
    ['POST', '/api/v1/submissions', 'Teacher', 'Upload submission file (multipart/form-data).'],
    ['GET', '/api/v1/submissions/{id}', 'Any Auth', 'Get submission state, extracted text, timestamps.'],
    ['GET', '/api/v1/submissions/{id}/evaluation', 'Any Auth', 'Fetch full AI evaluation: scores, feedback, recommendations.'],
    ['GET', '/api/v1/submissions/stream', 'Any Auth', 'SSE stream for real-time evaluation status updates.'],
    ['GET', '/api/v1/analytics/overview', 'Admin', 'Aggregated institution: avg scores, submission rates, top/low performers.'],
    ['GET', '/api/v1/analytics/teacher/{id}', 'Admin', 'Per-teacher longitudinal performance trend data.'],
]

add_table(doc,
    headers=['Method', 'Endpoint', 'Role', 'Purpose'],
    rows=api_rows
)

doc.add_paragraph()
add_heading(doc, '4.3 Sample Request/Response Contracts', level=2)

add_paragraph(doc, 'POST /api/v1/assignments — Create Assignment', bold=True, size=11, color='4F46E5')
add_code_block(doc, '''{
  "title": "Inquiry-Based Science Lesson Plan",
  "description": "Design a 60-minute physics lesson using inquiry scaffolding for Grade 8.",
  "due_date": "2026-06-15T23:59:59Z",
  "max_score": 100,
  "rubric": {
    "criteria": [
      { "name": "Pedagogical Scaffolding",       "weight": 0.40,
        "description": "Clear learning progression from concept to application." },
      { "name": "Differentiated Learning Plans", "weight": 0.30,
        "description": "Strategies for varied learner needs and abilities." },
      { "name": "Formative Assessment Alignment","weight": 0.30,
        "description": "Assessment tasks mapped to lesson learning outcomes." }
    ]
  }
}''')

doc.add_paragraph()
add_paragraph(doc, 'GET /api/v1/submissions/{id}/evaluation — AI Evaluation Response', bold=True, size=11, color='4F46E5')
add_code_block(doc, '''{
  "submission_id": "b3f0df51-2ef3-4d43-9821-6e3e1dfb003a",
  "overall_score": 84.50,
  "scores": [
    {
      "criterion": "Pedagogical Scaffolding",
      "score_assigned": 36.00,
      "max_possible": 40.00,
      "justification": "Learning sequence moves well from inquiry to synthesis..."
    },
    {
      "criterion": "Differentiated Learning Plans",
      "score_assigned": 22.50,
      "max_possible": 30.00,
      "justification": "Visual learner strategies present, but reading-impaired plans absent."
    }
  ],
  "feedback": "Strong structural competence and scientific inquiry methodology...",
  "recommendations": [
    { "area": "Differentiation", "action": "Add graphic worksheets for reading-impaired learners.", "priority": "High" },
    { "area": "Scaffolding", "action": "Define visual cue anchors during concept transitions.", "priority": "Medium" }
  ],
  "plagiarism_check": {
    "highest_similarity_score": 0.12,
    "verdict": "Clear",
    "matching_submission_id": null
  }
}''')


# ─────────────────────────────────────────────
# SECTION 5: AI EVALUATION ENGINE LOGIC
# ─────────────────────────────────────────────

doc.add_page_break()
add_heading(doc, '5. AI Evaluation Engine — Logic Design', level=1, color='4F46E5')
add_divider(doc)

add_heading(doc, '5.1 Async Celery Evaluation State Machine', level=2)
add_code_block(doc, '''
[Submission POST]
       │
       ├─► Validate MIME type (allow: pdf, docx, png, jpg)
       ├─► Validate file size (max 10MB, max 20 pages for docs)
       ├─► Upload raw file → AWS S3 (submissions/{institution_id}/{uuid}.ext)
       └─► INSERT submissions record (status=submitted)
                      │
                      ▼
             [Publish Celery Task]
             Redis Queue: evaluate_submission
             Payload: { submission_id, assignment_id, institution_id }
                      │
                      ▼
           [Worker: Document Parsing]
           │
           ├─► Is PDF with extractable text?
           │        YES → PyMuPDF: fitz.open(file).get_text()
           │        NO  → Download from S3 → Gemini Pro Vision multimodal extraction
           │
           └─► Sanitize: strip HTML, normalize whitespace, remove headers/footers
                      │
                      ▼
         [Worker: Embedding + Plagiarism Check]
         │
         ├─► Call text-embedding-004: embed(text_content) → vector[1536]
         ├─► Store embedding in submissions.embedding
         │
         └─► SQL: SELECT id, teacher_id, (1 - embedding <=> :vec) AS sim
                  FROM submissions
                  WHERE assignment_id = :aid AND institution_id = :iid
                    AND teacher_id != :tid
                  ORDER BY embedding <=> :vec LIMIT 5
             │
             └─► if max(sim) >= 0.85 → Flag plagiarism_warning=true
                      │
                      ▼
          [Worker: Gemini Rubric Evaluation]
          │
          ├─► Fetch assignment.rubric from DB
          ├─► Construct structured system prompt (injecting rubric criteria + weights)
          ├─► Call Gemini 1.5 Flash (responseMimeType = application/json)
          │
          ├─► Validate response with Pydantic AIEvaluationSchema
          │        SUCCESS → Proceed
          │        FAILURE → Retry with Gemini 1.5 Pro, temperature=0.0
          │                  FAILURE again → status=failed, log error
          │
          └─► INSERT ai_evaluations record
              UPDATE submissions SET status=evaluated
              Publish Redis SSE event: { submission_id, status: evaluated }
''')

add_heading(doc, '5.2 Prompt Engineering Specification', level=2)
add_paragraph(doc, 'System Prompt Template (Evaluation):', bold=True)
add_code_block(doc, '''You are an expert academic evaluator, pedagogical specialist, and institutional auditor.
Your task is to objectively evaluate the teacher submission against the provided rubric criteria.

RUBRIC CRITERIA:
{rubric_criteria_json}

MAXIMUM TOTAL SCORE: {max_score}

TEACHER SUBMISSION:
---
{submission_text}
---

EVALUATION DIRECTIVES:
1. Score each criterion independently based only on evidence in the submission text.
2. Do not invent criteria. Do not evaluate criteria not listed in the rubric.
3. Cite specific evidence from the submission text to justify each score.
4. Formulate recommendations that are practical, classroom-ready, and developmental.
5. Compute overall_score as the sum of all weighted criterion scores.
6. Return ONLY valid JSON matching the provided response schema. No markdown. No prose.''')

add_heading(doc, '5.3 Hallucination Mitigation Strategy', level=2)
add_bullet(doc, 'Source Anchoring: Prompts instruct model to cite exact quote locations from submission text.')
add_bullet(doc, 'Schema Enforcement: Gemini responseSchema forces strict JSON output — model cannot deviate.')
add_bullet(doc, 'Pydantic Guard Layer: Server-side Pydantic V2 validates every field type, range, and enum.')
add_bullet(doc, 'Retry Loop: On Pydantic validation failure, retry with 1.5 Pro at temperature=0.0 for deterministic output.')
add_bullet(doc, 'Rubric Boundary: Model receives only the defined rubric criteria JSON — cannot invent new scoring axes.')
add_bullet(doc, 'Human Override: Admins can override any AI score. Override events are logged in audit_logs.')


# ─────────────────────────────────────────────
# SECTION 6: PLAGIARISM CHECK LOGIC
# ─────────────────────────────────────────────

doc.add_page_break()
add_heading(doc, '6. Plagiarism Detection — Vector Search Logic', level=1, color='4F46E5')
add_divider(doc)

add_heading(doc, '6.1 Pipeline Overview', level=2)
add_code_block(doc, '''
[Submission Text]
       │
       ▼
[Gemini text-embedding-004]
  → Dense 1536-dim floating point vector
  → Represents semantic meaning of document

       │
       ▼
[pgvector Cosine Similarity Query]
  Algorithm: HNSW (Hierarchical Navigable Small World Graph)
  Index: CREATE INDEX ON submissions USING hnsw (embedding vector_cosine_ops);

  Distance Metric:
    Cosine Distance  = 1 - Cosine Similarity
    Cosine Similarity = (A · B) / (||A|| × ||B||)

  Threshold Logic:
    If Cosine Similarity ≥ 0.85 → Potential Plagiarism
    If Cosine Similarity ≥ 0.70 → Structural Similarity (Flag for review)
    If Cosine Similarity < 0.70 → Clear

  Scoping:
    All queries scoped to institution_id AND assignment_id
    Teachers cannot be matched against their own previous submissions
    Cross-institution matching: DISABLED at MVP (GDPR/data governance compliance)
''')

add_heading(doc, '6.2 SQL Implementation', level=2)
add_code_block(doc, '''SELECT
    sub.id                      AS matching_submission_id,
    sub.teacher_id              AS matching_teacher_id,
    p.first_name || ' ' || p.last_name AS matching_teacher_name,
    (1 - (sub.embedding <=> :new_vector))  AS similarity_score
FROM submissions sub
JOIN profiles p ON sub.teacher_id = p.user_id
WHERE
    sub.assignment_id   = :assignment_id
AND sub.institution_id  = :institution_id
AND sub.id             != :current_submission_id
AND sub.status          = 'evaluated'
AND (1 - (sub.embedding <=> :new_vector)) >= 0.70
ORDER BY sub.embedding <=> :new_vector
LIMIT 5;''')


# ─────────────────────────────────────────────
# SECTION 7: RBAC SECURITY ARCHITECTURE
# ─────────────────────────────────────────────

doc.add_page_break()
add_heading(doc, '7. Security Architecture — RBAC & Auth Design', level=1, color='4F46E5')
add_divider(doc)

add_heading(doc, '7.1 Role Permission Matrix', level=2)

rbac_rows = [
    ['Provision Institution', '✅', '❌', '❌'],
    ['Create/Manage Admin Accounts', '✅', '❌', '❌'],
    ['Invite & Manage Teachers', '✅', '✅', '❌'],
    ['Upload Training Materials', '✅', '✅', '❌'],
    ['Create Assignments & Rubrics', '✅', '✅', '❌'],
    ['View All Submissions (Institution)', '✅', '✅', '❌'],
    ['Override AI Evaluation Score', '✅', '✅', '❌'],
    ['Access Audit Logs', '✅', '❌', '❌'],
    ['View Platform Analytics', '✅', '✅', '❌'],
    ['View Training Materials', '✅', '✅', '✅'],
    ['Submit Assignment', '❌', '❌', '✅'],
    ['View Own Evaluation Report', '❌', '❌', '✅'],
    ['Track Own Progress', '❌', '❌', '✅'],
]

add_table(doc,
    headers=['Permission / Capability', 'Super Admin', 'Institution Admin', 'Teacher'],
    rows=rbac_rows
)

doc.add_paragraph()
add_heading(doc, '7.2 JWT Auth Flow', level=2)
add_code_block(doc, '''
[Login Request]
  POST /api/v1/auth/login { email, password }
       │
       ├─► Hash password with bcrypt (cost factor 12)
       ├─► Compare against stored hash in DB
       ├─► On success:
       │     Generate Access Token:  RS256, exp=15min
       │                             Claims: { sub=user_id, role, institution_id }
       │     Generate Refresh Token: RS256, exp=7days
       │                             Store refresh_token_hash in Redis (TTL=7d)
       │
       └─► Return: Set-Cookie: access_token (HttpOnly, Secure, SameSite=Strict)
                   Set-Cookie: refresh_token (HttpOnly, Secure, SameSite=Strict)

[Authenticated Request]
  Any protected route
       │
       ├─► Middleware: Decode JWT from HttpOnly cookie
       ├─► Verify RS256 signature using public key
       ├─► Check token expiry (exp claim)
       ├─► Extract: user_id, role, institution_id from claims
       └─► RBAC check: Does role satisfy route permission requirement?
                YES → Proceed to route handler (inject current_user)
                NO  → HTTP 403 Forbidden

[Token Refresh]
  POST /api/v1/auth/refresh
       │
       ├─► Verify refresh token signature and expiry
       ├─► Lookup refresh_token_hash in Redis (revocation check)
       ├─► Rotate: Revoke old refresh token (delete from Redis)
       └─► Issue new access token + new refresh token pair
''')

add_heading(doc, '7.3 File Upload Security Controls', level=2)
add_bullet(doc, 'MIME type whitelist enforced server-side (not client-reported Content-Type).')
add_bullet(doc, 'File size cap: 10MB per submission, 500MB per video upload.')
add_bullet(doc, 'Files renamed to UUID before S3 storage (prevents path traversal attacks).')
add_bullet(doc, 'S3 buckets are private. File access via time-limited pre-signed URLs (15-minute expiry).')
add_bullet(doc, 'No direct script execution permitted. S3 objects are served with Content-Disposition: attachment.')
add_bullet(doc, 'Virus/malware scanning via AWS S3 event trigger + ClamAV Lambda (Phase 2).')


# ─────────────────────────────────────────────
# SECTION 8: USER FLOWS
# ─────────────────────────────────────────────

doc.add_page_break()
add_heading(doc, '8. Core User Flows', level=1, color='4F46E5')
add_divider(doc)

flows = [
    ('8.1 Admin Onboarding Flow', [
        'Super Admin provisions institution via POST /api/v1/institutions.',
        'Admin credentials auto-generated and emailed via SendGrid.',
        'Admin logs in → completes institution profile (name, logo, department structure).',
        'Admin navigates to Teacher Management → clicks "Bulk Invite".',
        'System accepts CSV of emails → creates pending user shells → dispatches invite emails.',
        'Invite link contains time-limited token (expires 72 hours).',
        'System dashboard shows onboarding completion rate in real time.',
    ]),
    ('8.2 Teacher Registration Flow', [
        'Teacher receives invite email with personalized registration link.',
        'Link contains JWT invite token encoding institution_id and email.',
        'Teacher completes: Name, Employee ID, Password, Profile Photo.',
        'Backend: validates token, creates user profile, sets status=active.',
        'Teacher immediately redirected to their personal dashboard.',
    ]),
    ('8.3 Assignment Submission & Evaluation Flow', [
        'Admin creates assignment with rubric criteria, weights, and due date.',
        'Teachers see assignment in their portal with deadline countdown.',
        'Teacher clicks "Submit Assignment" → drag-and-drop file upload UI.',
        'Frontend requests S3 pre-signed upload URL from backend.',
        'File uploaded directly to S3 (not through API server, reduces load).',
        'Backend receives S3 upload confirmation → creates submissions record.',
        'Celery worker picks up task: extracts text, runs plagiarism check, evaluates via Gemini.',
        'SSE stream updates teacher UI: submitted → processing → evaluated.',
        'Teacher receives detailed score breakdown and AI recommendations.',
        'Admin sees new evaluated submission appear in supervision dashboard.',
    ]),
]

for flow_title, steps in flows:
    add_heading(doc, flow_title, level=2)
    for i, step in enumerate(steps, 1):
        add_bullet(doc, step)
    doc.add_paragraph()


# ─────────────────────────────────────────────
# SECTION 9: DEPLOYMENT ARCHITECTURE
# ─────────────────────────────────────────────

doc.add_page_break()
add_heading(doc, '9. Deployment Architecture', level=1, color='4F46E5')
add_divider(doc)

add_heading(doc, '9.1 Environment Stages', level=2)

deploy_rows = [
    ['Local Dev', 'Docker Compose', 'FastAPI + Next.js + PostgreSQL + Redis all in containers. Hot reload enabled. Mock S3 via LocalStack.'],
    ['Staging', 'Render.com / Fly.io', 'Mirrors production topology. Auto-deploys on merge to develop branch. Seeded test institution data.'],
    ['Production', 'AWS ECS Fargate', 'FastAPI and Celery workers as separate ECS services. RDS PostgreSQL Multi-AZ. ElastiCache Redis cluster. CloudFront CDN for static + video.'],
]

add_table(doc,
    headers=['Environment', 'Platform', 'Specification'],
    rows=deploy_rows
)

doc.add_paragraph()
add_heading(doc, '9.2 CI/CD Pipeline (GitHub Actions)', level=2)
add_code_block(doc, '''
[git push → main branch]
       │
       ▼
  [GitHub Actions Workflow]
  ├─► Run unit tests (pytest)
  ├─► Run API integration tests
  ├─► Run type checks (mypy)
  ├─► Lint check (ruff)
  │
  ├─► Build Docker image: edusupervision-api:sha-{commit}
  ├─► Push to AWS ECR (Elastic Container Registry)
  │
  └─► Trigger ECS Service Update (Rolling Deploy, zero downtime)
      ├─► ECS starts new task with new image
      ├─► Health check passes → old task drained and stopped
      └─► Deployment complete → Slack notification
''')


# ─────────────────────────────────────────────
# SECTION 10: FOLDER STRUCTURE
# ─────────────────────────────────────────────

doc.add_page_break()
add_heading(doc, '10. Repository & Folder Structure', level=1, color='4F46E5')
add_divider(doc)

add_heading(doc, '10.1 Backend — FastAPI', level=2)
add_code_block(doc, '''edusupervision-backend/
├── app/
│   ├── core/
│   │   ├── config.py            # Pydantic Settings (reads .env)
│   │   ├── security.py          # JWT encode/decode, bcrypt
│   │   ├── database.py          # Async SQLAlchemy engine + session factory
│   │   └── celery.py            # Celery app initialization
│   ├── models/                  # SQLAlchemy ORM models (DB table definitions)
│   │   ├── user.py
│   │   ├── institution.py
│   │   ├── material.py
│   │   ├── assignment.py
│   │   ├── submission.py
│   │   ├── evaluation.py
│   │   └── audit_log.py
│   ├── schemas/                 # Pydantic V2 request/response schemas
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── assignment.py
│   │   ├── submission.py
│   │   └── evaluation.py
│   ├── api/
│   │   ├── deps.py              # Shared FastAPI dependencies (get_current_user, db_session)
│   │   └── v1/
│   │       ├── auth.py
│   │       ├── teachers.py
│   │       ├── materials.py
│   │       ├── assignments.py
│   │       ├── submissions.py
│   │       └── analytics.py
│   ├── services/                # Business logic, orchestration
│   │   ├── auth_service.py
│   │   ├── teacher_service.py
│   │   ├── material_service.py
│   │   ├── submission_service.py
│   │   ├── ai_evaluator.py      # Gemini API integration
│   │   ├── ocr.py               # PyMuPDF + Gemini Vision fallback
│   │   ├── storage.py           # AWS S3 pre-signed URL generator
│   │   └── embedding.py         # text-embedding-004 + pgvector queries
│   ├── tasks/
│   │   └── evaluation_worker.py # Celery task definitions
│   └── main.py                  # FastAPI app factory + router registration
├── alembic/                     # Database migration scripts
├── tests/
│   ├── unit/
│   └── integration/
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
└── .env.example''')

add_heading(doc, '10.2 Frontend — Next.js', level=2)
add_code_block(doc, '''edusupervision-frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/[token]/page.tsx
│   │   ├── admin/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── teachers/page.tsx
│   │   │   ├── content/page.tsx
│   │   │   ├── assignments/page.tsx
│   │   │   └── submissions/[id]/page.tsx
│   │   ├── teacher/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── content/page.tsx
│   │   │   ├── assignments/page.tsx
│   │   │   └── submissions/[id]/page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                  # Primitive UI: Button, Input, Card, Badge, Modal
│   │   ├── admin/               # AdminSidebar, TeacherTable, SubmissionReviewCard
│   │   ├── teacher/             # VideoPlayer, AssignmentUpload, EvaluationReport
│   │   └── shared/              # Header, MetricCard, LoadingSpinner, RoleGuard
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSSE.ts            # Server-Sent Events connection management
│   │   └── useSubmission.ts
│   ├── lib/
│   │   ├── api.ts               # Axios instance with JWT interceptors
│   │   └── utils.ts
│   └── types/
│       └── index.ts             # Shared TypeScript type definitions
├── public/
├── tailwind.config.ts
├── next.config.js
└── package.json''')


# ─────────────────────────────────────────────
# SECTION 11: MVP FEATURE PRIORITIZATION
# ─────────────────────────────────────────────

doc.add_page_break()
add_heading(doc, '11. MVP Feature Prioritization', level=1, color='4F46E5')
add_divider(doc)

priority_rows = [
    ['JWT Auth + Role-Based Access Control', 'P0 — Critical', 'Sprint 1', 'All other modules depend on auth.'],
    ['Teacher Invite & Registration', 'P0 — Critical', 'Sprint 1', 'Zero usage without teacher accounts.'],
    ['Admin Dashboard (basic)', 'P0 — Critical', 'Sprint 2', 'Core admin workflow entry point.'],
    ['Teacher Dashboard (basic)', 'P0 — Critical', 'Sprint 2', 'Core teacher workflow entry point.'],
    ['Training Material Upload', 'P0 — Critical', 'Sprint 2', 'Foundation of training content delivery.'],
    ['Video Player with Progress Tracking', 'P1 — High', 'Sprint 3', 'Core teacher engagement mechanic.'],
    ['Assignment Creation + Rubric Builder', 'P0 — Critical', 'Sprint 3', 'Required for submission pipeline.'],
    ['Submission File Upload (S3)', 'P0 — Critical', 'Sprint 3', 'Core teacher action.'],
    ['Celery Async Processing Queue', 'P0 — Critical', 'Sprint 4', 'All AI evaluation requires async queue.'],
    ['OCR Text Extraction (PyMuPDF + Gemini Vision)', 'P0 — Critical', 'Sprint 4', 'Required to feed AI evaluation.'],
    ['AI Rubric Evaluation (Gemini)', 'P0 — Critical', 'Sprint 4', 'Primary product differentiator.'],
    ['SSE Live Status Updates', 'P1 — High', 'Sprint 4', 'UX: avoids teachers needing to reload.'],
    ['Plagiarism Check (pgvector)', 'P1 — High', 'Sprint 4', 'Academic integrity requirement.'],
    ['Admin Override of AI Scores', 'P1 — High', 'Sprint 4', 'Human-in-the-loop governance.'],
    ['Audit Log System', 'P1 — High', 'Sprint 5', 'Compliance and accountability.'],
    ['Analytics Dashboard (Aggregated)', 'P1 — High', 'Sprint 5', 'Institutional oversight requirement.'],
    ['PDF/Excel Report Export', 'P2 — Medium', 'Phase 2', 'Nice-to-have for management reporting.'],
    ['Classroom Recording Video Evaluation', 'P3 — Future', 'Phase 3', 'Multimodal deep evaluation capability.'],
]

add_table(doc,
    headers=['Feature', 'Priority', 'Target Sprint', 'Rationale'],
    rows=priority_rows
)


# ─────────────────────────────────────────────
# SECTION 12: RISKS & MITIGATIONS
# ─────────────────────────────────────────────

doc.add_page_break()
add_heading(doc, '12. Risks, Failure Points & Mitigations', level=1, color='4F46E5')
add_divider(doc)

risk_rows = [
    ['AI Grading Inconsistency', 'High', 'Teachers claim unfair scores → institutional trust risk', 'Admin override capability. Log all evaluations with full AI reasoning. Score deviation alerts if override > 10 points.'],
    ['Gemini API Cost Overrun', 'Medium', 'Large institutions submit many large documents simultaneously', 'Enforce 10MB / 20-page cap. Route simple submissions to Flash model. Implement token budget alerts via Cloud Billing API.'],
    ['OCR Failure on Poor Scan Quality', 'Medium', 'Blurry images return empty or garbled text → failed evaluations', 'Pre-upload image resolution validation. Confidence score from Gemini Vision — if low, reject upload with reupload prompt.'],
    ['Celery Worker Queue Backlog', 'Medium', 'Mass submission around assignment deadlines causes delay', 'Auto-scaling Celery worker pool on AWS ECS. Queue depth alert triggers additional worker containers.'],
    ['JWT Token Theft via XSS', 'High', 'Malicious script extracts token from browser', 'Tokens stored only in HttpOnly cookies (inaccessible to JS). CSP headers enforced on all pages.'],
    ['Institutional Data Leakage', 'Critical', 'Bug allows cross-institution data reads', 'Strict institution_id scoping at query layer AND service layer. All repositories enforce institution_id filtering as mandatory parameter.'],
    ['Adoption Resistance', 'Medium', 'Teachers reject digital system, refuse to submit electronically', 'UX must be mobile-responsive and require minimal steps. Onboarding flow to be tested with teacher focus groups before launch.'],
    ['Plagiarism False Positives', 'Low', 'Template-based submissions (e.g. lesson plan format) trigger false match', 'Similarity threshold set conservatively at 0.85. Flagged submissions go to Admin review, not auto-rejection.'],
]

add_table(doc,
    headers=['Risk', 'Severity', 'Scenario', 'Mitigation'],
    rows=risk_rows
)


# ─────────────────────────────────────────────
# SECTION 13: MVP SUCCESS METRICS
# ─────────────────────────────────────────────

doc.add_page_break()
add_heading(doc, '13. MVP Success Metrics & Validation Criteria', level=1, color='4F46E5')
add_divider(doc)

add_heading(doc, '13.1 Adoption Metrics (30-Day Post Launch)', level=2)
kpi_rows = [
    ['Teacher Activation Rate', '≥ 80% of invited teachers complete onboarding within 14 days'],
    ['Material Engagement Rate', '≥ 70% of registered teachers complete at least one training video'],
    ['Submission Completion Rate', '≥ 65% of assigned tasks receive at least one submission before deadline'],
    ['Platform DAU / MAU Ratio', '≥ 0.30 (indicates sticky engagement, not just one-time logins)'],
]
add_table(doc, headers=['Metric', 'Target'], rows=kpi_rows)

doc.add_paragraph()
add_heading(doc, '13.2 AI Quality Metrics', level=2)
ai_kpi_rows = [
    ['AI Score Consistency Index', 'AI score within ±5 points of manual supervisor score on ≥ 85% of evaluations'],
    ['Evaluation Latency', 'End-to-end: submission → evaluated status in ≤ 60 seconds (p95)'],
    ['Admin Override Rate', '≤ 10% of AI evaluations manually overridden (indicates high AI accuracy)'],
    ['OCR Success Rate', '≥ 97% of submissions produce extractable, non-empty text output'],
    ['Pydantic Validation Failure Rate', '≤ 2% of Gemini calls require a retry due to schema mismatch'],
]
add_table(doc, headers=['Metric', 'Target'], rows=ai_kpi_rows)

doc.add_paragraph()
add_heading(doc, '13.3 What Defines MVP Validation', level=2)
add_bullet(doc, '1 live institution onboarded with 10+ active teachers using the platform.')
add_bullet(doc, '50+ assignment submissions processed end-to-end through the AI evaluation pipeline.')
add_bullet(doc, 'Admin dashboard surfacing accurate institution-level performance metrics.')
add_bullet(doc, 'Zero critical security incidents (data leakage, unauthorized access) in first 30 days.')
add_bullet(doc, 'AI evaluation quality validated by at least 2 senior academic supervisors reviewing 20+ reports.')


# ─────────────────────────────────────────────
# SECTION 14: PHASE 1 — BASE SETUP & DATABASE LOGIC
# ─────────────────────────────────────────────

doc.add_page_break()
add_heading(doc, '14. Phase 1 — Base Setup & Database Architecture (CTO Journal)', level=1, color='4F46E5')
add_divider(doc)

add_paragraph(doc, (
    'Phase 1 focuses on building the underlying infrastructure. The core structures initialized '
    'in this phase are outlined below, providing the technical basis for the next development cycles.'
))

add_heading(doc, '14.1 Database Connection Pooling and Transaction Lifecycle', level=2)
add_paragraph(doc, (
    'We use PgBouncer configured in Transaction Mode as a sidecar proxy. Transactions are committed '
    'or rolled back atomically at the end of each request lifecycle. The FastAPI async database session lifecycle '
    'is managed cleanly via dependency injection.'
))

add_code_block(doc, '''[FastAPI Request Router]
       │  (Acquires session from get_db dependency)
       ▼
[SQLAlchemy AsyncSession]
       │  (Uses PgBouncer on port 6432)
       ├─► Transaction BEGIN
       ├─► Execute Queries (SELECT, INSERT, UPDATE)
       ├─► Request Success?
       │        YES ──► Transaction COMMIT
       │        NO   ──► Transaction ROLLBACK
       ▼
[Close Session] (Releases connection back to pool)''')

add_heading(doc, '14.2 Database Table Definitions & Schema Configuration', level=2)
add_paragraph(doc, (
    'All SQLAlchemy models utilize modern declarative 2.0 mappings. Alembic migrations are set up '
    'to run asynchronously (using asyncpg) to create the relational schema, including indexes for: '
    'institution_id isolation, email searches, and submissions history ordering.'
))

add_heading(doc, '14.3 Local Development Docker Compose Environment', level=2)
add_paragraph(doc, (
    'The local orchestration defines three containers: db (Postgres + pgvector), pgbouncer (transaction-pooler), '
    'and redis (caching and task queue broker). Health checks are configured to block dependent services until the '
    'dependencies are fully responsive.'
))

# ─────────────────────────────────────────────
# SECTION 15: PHASE 2 — AUTHENTICATION & MULTI-TENANT RBAC LOGIC
# ─────────────────────────────────────────────

doc.add_page_break()
add_heading(doc, '15. Phase 2 — Authentication & Multi-Tenant RBAC (CTO Journal)', level=1, color='4F46E5')
add_divider(doc)

add_paragraph(doc, (
    'Phase 2 secures the platform utilizing stateless asymmetric RS256 JWT tokens. '
    'The Edge Middleware (Next.js) and API Gateway (FastAPI) collaborate to enforce permissions.'
))

add_heading(doc, '15.1 Asymmetric Signature Verification Sequence', level=2)
add_paragraph(doc, (
    'The FastAPI backend signs JWTs using an RS256 private key, while Next.js Edge Middleware verifies them '
    'at the edge using only the public key, bypassing internal database network overhead.'
))

add_code_block(doc, '''[User Client Browser]
       │  (Requests /admin/dashboard with HttpOnly cookie)
       ▼
[Next.js Edge Middleware]
       │  (Imports RS256 public key)
       ├─► Decodes & Verifies Refresh Token
       ├─► Checks payload.role == 'InstitutionAdmin'
       │        YES ──► Inject headers & Proceed
       │        NO   ──► Redirect to /teacher/dashboard
       ▼
[FastAPI Endpoints] (Enforces database queries scoped to payload.institution_id)''')

add_heading(doc, '15.2 Cookie Storage Policies & Replay Attack Mitigations', level=2)
add_paragraph(doc, (
    'Access tokens expire in 15 minutes and live solely in-memory. Refresh tokens expire in 7 days, '
    'stored as HttpOnly, Secure, SameSite=Strict cookies. On token rotation (/refresh), the old token is '
    'blacklisted in Redis for its remaining time-to-live to prevent reuse.'
))

# ─────────────────────────────────────────────
# FOOTER
# ─────────────────────────────────────────────

doc.add_page_break()
end_p = doc.add_paragraph()
end_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
end_run = end_p.add_run('— END OF PLATFORM ARCHITECTURE JOURNAL —')
end_run.bold = True
end_run.font.size = Pt(13)
end_run.font.color.rgb = RGBColor(0x4F, 0x46, 0xE5)

note_p = doc.add_paragraph()
note_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
note_p.add_run(
    f'Document generated: {datetime.datetime.now().strftime("%B %d, %Y at %H:%M")}  |  '
    'EduSupervision Engineering  |  All contents confidential'
).font.size = Pt(9)


# ─────────────────────────────────────────────
# SAVE
# ─────────────────────────────────────────────

output_path = r'c:\Users\Devansh\Desktop\Projects\EduSupervision\docs\EduSupervision_CTO_Journal.docx'
import os
os.makedirs(os.path.dirname(output_path), exist_ok=True)
doc.save(output_path)
print(f"SUCCESS: Document saved to {output_path}")


