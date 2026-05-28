# EduSupervision

> **AI-Powered Teacher Training, Evaluation & Educational Supervision Platform**

EduSupervision is an institutional-grade platform that helps education departments, school boards, and academic institutions train, monitor, evaluate, and systematically improve their teaching workforce — powered by AI.

---

## What This Is

This is **not** a student learning management system.

This **is** an AI-driven teacher supervision infrastructure:
- Centralized training content distribution to teaching staff
- AI-evaluated assignment submissions using rubric-driven structured prompts
- Real-time institutional performance dashboards
- Async document processing with plagiarism detection

---

## Repository Structure

```
EduSupervision/
├── docs/
│   └── EduSupervision_Phase0_CTO_Journal.docx   ← Full CTO Architecture Journal
├── scripts/
│   └── generate_journal.py                       ← Word doc generator
└── README.md
```

---

## Phase 0 — Architecture & Planning ✅

Complete system design blueprint covering:
- Full stack architecture (Next.js + FastAPI + PostgreSQL + Celery)
- Database schema with pgvector for semantic plagiarism detection
- AI evaluation pipeline design (Gemini 1.5 Pro/Flash + PyMuPDF OCR)
- RBAC security architecture and JWT auth flow
- API contract design with full endpoint registry
- CI/CD and AWS deployment topology

📄 See: [`docs/EduSupervision_Phase0_CTO_Journal.docx`](docs/EduSupervision_Phase0_CTO_Journal.docx)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, TailwindCSS |
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL 16 + pgvector |
| Task Queue | Celery + Redis |
| AI Engine | Google Gemini 1.5 Pro/Flash |
| Storage | AWS S3 + CloudFront CDN |
| Auth | Self-hosted JWT (RS256) |

---

## Status

| Phase | Status |
|---|---|
| Phase 0 — Architecture & Planning | ✅ Complete |
| Phase 0.5 — 3-Agent Tech Stack Review (2 cycles) | ✅ Complete → [`FINAL_TECH_STACK.md`](docs/FINAL_TECH_STACK.md) |
| Phase 1 — Project Initialization, Repository Setup & Database Architecture | ✅ Complete → [`docs/EduSupervision_CTO_Journal.docx`](docs/EduSupervision_CTO_Journal.docx) |
| Phase 2 — Authentication & Multi-Tenant Role-Based Access Control (RBAC) | 🔜 Next |
| Phase 3 — Academic Administration & Teacher Onboarding | ⏳ Pending |

