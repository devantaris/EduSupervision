# Things That Need Your Input
## EduSupervision — Decisions Only You Can Make

> These are **not** things I can guess or default. They require your judgement as the product owner.
> Items marked 🔴 will block Phase 7+ from being deployable.

---

## 🔴 Blockers — Required Before Any Real Deployment

### 1. Google Gemini API Key
- **What:** A `GEMINI_API_KEY` from Google AI Studio or Google Cloud
- **Why:** Without this, AI evaluation runs in mock mode (returns dummy scores)
- **Where to add:** `backend/.env` → `GEMINI_API_KEY=your_key_here`
- **Get it at:** https://aistudio.google.com/apikey
- **Cost impact:** ~$0.0024 per evaluation (very cheap)

### 2. RS256 JWT Key Pair
- **What:** A real RSA private/public key pair for signing tokens
- **Why:** The default dev keys in `.env` are NOT secure for production
- **Generate with:**
  ```bash
  openssl genrsa -out private.pem 2048
  openssl rsa -in private.pem -pubout -out public.pem
  ```
- **Add to:** `backend/.env` → `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY`
- **Also add `JWT_PUBLIC_KEY` to:** Vercel environment variables (for Edge Middleware)

### 3. Domain Name Decision
- **What:** What will the production URL be?
- **Options:** `edusupervision.app`, `edusupervision.com`, `edusupervision.edu`, or your institution's domain
- **Why:** Affects cookie `SameSite` config, CORS allow-list, and Vercel deployment settings

---

## 🟠 High Priority — Required Before Any Ministry Demo

### 4. Email Provider Setup
- **What:** Which email service will send teacher invitations?
- **Current state:** Invites just print to the Celery worker terminal (mock mode)
- **Options:**
  - **SendGrid** (recommended — free tier: 100/day, easy API)
  - **AWS SES** (cheaper at scale, harder setup)
  - **Resend** (developer-friendly, free tier)
- **What I need:** API key + sender email address (e.g. `noreply@edusupervision.app`)
- **Impact:** Without this, teachers cannot receive onboarding invite links

### 5. AWS S3 Bucket Setup (or alternative)
- **What:** A storage bucket for uploaded submission files
- **Current state:** Files upload to local `backend/static/uploads/` in dev — works for demo, NOT production
- **Options:**
  - **AWS S3** (already architected in the codebase)
  - **Cloudflare R2** (S3-compatible, cheaper egress)
  - **Supabase Storage** (simpler managed option)
- **What I need:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`

### 6. Ministry Pilot Institutions
- **What:** Names, codes, and admin email addresses for the first institutions to onboard
- **Why:** The system needs at least one institution provisioned before any teachers can be invited
- **Format:** `{name: "Al Ain School District", code: "AASD", admin_email: "admin@aasd.edu"}`

---

## 🟡 Design Decisions — Before Phase 7 (Reporting)

### 7. What Does the Ministry Supervisor See?
- **Question:** The Ministry supervisor role is currently a `SuperAdmin`. Do they need:
  - [ ] A completely separate dashboard view (read-only auditing across ALL institutions)?
  - [ ] Or is `SuperAdmin` access sufficient for the Ministry?
  - [ ] Should Ministry users be able to compare scores across institutions?

### 8. Performance Report Format
- **Question:** When a teacher's evaluation is complete, what does the official performance report look like?
  - [ ] A downloadable PDF report (needs a PDF generation library like `weasyprint`)
  - [ ] An in-app digital report only
  - [ ] Both
- **Phase 7** will implement reporting — I need this decision to design it correctly

### 9. CPD (Continuing Professional Development) Pathway Stages
- **Question:** The teacher dashboard shows a 4-stage certification pathway: `Foundation → Practice → Advanced → Expert`. Are these the correct stage names and criteria for your context?
  - What score threshold unlocks each stage? (e.g. average >= 60 → Practice, >= 75 → Advanced)
  - Who decides when a teacher advances — the AI alone, or admin approval?

### 10. Multi-Language Support
- **Question:** Will the platform need Arabic language support for the Ministry of Education context?
  - [ ] English only (current)
  - [ ] English + Arabic (RTL layout required — significant frontend work)
  - [ ] Arabic primary, English secondary

---

## 🟢 Nice-to-Have Clarifications

### 11. Notification Preferences
- **What:** Should teachers receive email notifications when their evaluation is complete?
- **Currently:** Real-time SSE updates the browser only

### 12. Submission Re-evaluation
- **What:** Can teachers re-submit? Can admins trigger a re-evaluation?
- **Currently:** One submission per assignment is enforced

### 13. Assignment Due Date Enforcement
- **What:** Should the system hard-block submissions after the due date?
- **Currently:** Teachers can still see assignments after due date — no submission block

### 14. Plagiarism Threshold
- **What:** The current cosine similarity threshold is **0.88**. Should this be configurable per institution?
- **Impact:** Lower = more flags (more false positives), Higher = fewer flags (may miss real plagiarism)

---

## Summary Table

| # | Item | Urgency | Blocks |
|---|---|---|---|
| 1 | Gemini API Key | 🔴 Critical | Real AI evaluation |
| 2 | RS256 JWT Keys | 🔴 Critical | Secure auth in production |
| 3 | Domain Name | 🔴 Critical | Deployment |
| 4 | Email Provider | 🟠 High | Teacher onboarding |
| 5 | S3 Bucket | 🟠 High | Production file storage |
| 6 | Pilot Institutions | 🟠 High | Ministry demo |
| 7 | Ministry Supervisor Role | 🟡 Medium | Phase 7 reporting |
| 8 | Report Format (PDF?) | 🟡 Medium | Phase 7 reporting |
| 9 | CPD Stage Criteria | 🟡 Medium | Teacher progression logic |
| 10 | Arabic Language | 🟡 Medium | Frontend i18n scope |
| 11 | Email on evaluation | 🟢 Low | Phase 8 notifications |
| 12 | Re-submission policy | 🟢 Low | Submission rules |
| 13 | Due date enforcement | 🟢 Low | Assignment rules |
| 14 | Plagiarism threshold | 🟢 Low | Detection sensitivity |
