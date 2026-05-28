# EduSupervision

> **AI-Powered Teacher Training, Evaluation & Educational Supervision Platform**

EduSupervision is an institutional-grade platform that helps education departments, school boards, and academic institutions train, monitor, evaluate, and systematically improve their teaching workforce — powered by AI.

---

## 🏗️ System Architecture

EduSupervision is built using a modern, performant, and fully containerized tech stack:

*   **Frontend**: Next.js 14 (App Router) + React 19 + TailwindCSS v4
*   **Backend**: FastAPI (Python 3.12) + SQLAlchemy 2.0 Async + Alembic
*   **Database**: PostgreSQL 16 + `pgvector` (for semantic plagiarism detection) + PgBouncer (transaction pooling)
*   **Task Queue**: Celery 5.4 + Redis 7.2 (as broker & cache)
*   **AI Engine**: Google Gemini 2.0 Flash / 1.5 Pro + PyMuPDF OCR + python-docx
*   **Auth**: Self-hosted JWT (RS256 asymmetric keys)

---

## 🚀 How to Run the Project (Step-by-Step)

Follow these instructions to set up and run the entire development environment locally.

### 📋 Prerequisites

Ensure you have the following installed on your system:
*   [Docker & Docker Desktop](https://www.docker.com/products/docker-desktop/)
*   [Node.js](https://nodejs.org/) (v18.x or higher)
*   [Python](https://www.python.org/) (v3.11 or v3.12)
*   [Git](https://git-scm.com/)

---

### Step 1: Clone and Set Up Environment Variables

1. Clone the repository and navigate to the project root:
   ```bash
   git clone https://github.com/devantaris/EduSupervision.git
   cd EduSupervision
   ```

2. Create a root `.env` file by copying the template:
   ```bash
   cp .env.example .env
   ```
   *(Note: The development `.env.example` comes pre-configured with a default RS256 JWT private/public key pair for quick setup.)*

---

### Step 2: Spin Up Infrastructure Services (Docker)

EduSupervision uses Docker to host its persistent services. Run the following command from the root directory:

```bash
docker compose up -d
```

This starts:
*   **PostgreSQL** (`edusupervision_db`) on port `5432`
*   **PgBouncer** (`edusupervision_pgbouncer`) on port `6432` (transaction pooler)
*   **Redis** (`edusupervision_redis`) on port `6379` (broker/cache)

---

### Step 3: Run the Backend API Server & Celery

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   *   **Windows (PowerShell)**:
       ```powershell
       python -m venv .venv
       .\.venv\Scripts\Activate.ps1
       ```
   *   **Windows (CMD)**:
       ```cmd
       python -m venv .venv
       .\.venv\Scripts\activate.bat
       ```
   *   **macOS / Linux**:
       ```bash
       python3 -m venv .venv
       source .venv/bin/activate
       ```

3. Install backend dependencies:
   ```bash
   pip install -e .
   ```

4. Run the database migrations using Alembic:
   ```bash
   alembic upgrade head
   ```

5. Seed the database with default interactive test accounts:
   ```bash
   python seed.py
   ```
   *(This creates an institution, a SuperAdmin, an Institution Admin, a Teacher, a sample training video, and an assignment!)*

6. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend API is now running at [http://localhost:8000](http://localhost:8000). You can view the interactive Swagger docs at [http://localhost:8000/docs](http://localhost:8000/docs).

7. *(Optional)* Start the **Celery Task Worker** for background tasks (e.g., mail sending, AI evaluations):
   *   **On Windows (dev)**:
       ```bash
       celery -A app.core.celery.celery_app worker --loglevel=info -P solo
       ```
   *   **On macOS / Linux**:
       ```bash
       celery -A app.core.celery.celery_app worker --loglevel=info
       ```

---

### Step 4: Run the Frontend (Next.js)

1. Open a new terminal window and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Copy the frontend environment variables template:
   ```bash
   cp .env.example .env
   ```

3. Install node packages:
   ```bash
   npm install
   ```

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Pre-seeded Test Credentials

The database seeding script creates these default accounts to help you test the platform instantly:

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `superadmin@edusupervision.com` | `SuperPassword123!` |
| **Institution Admin** | `admin@oakridge.edu` | `AdminPassword123!` |
| **Teacher** | `teacher@oakridge.edu` | `TeacherPassword123!` |

---

## 📂 Repository Layout

```
EduSupervision/
├── backend/                  # FastAPI + SQLAlchemy API and Celery workers
│   ├── app/                  # Application source code
│   │   ├── api/              # API router endpoints
│   │   ├── core/             # DB, configuration, JWT and celery setup
│   │   ├── models/           # SQLAlchemy DB models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   └── tasks/            # Celery task definitions
│   ├── alembic/              # Database migration scripts
│   ├── seed.py               # Database seeder script
│   └── pyproject.toml        # Backend dependencies
├── frontend/                 # Next.js 14 + TailwindCSS v4 app
│   ├── src/                  # App router components and layouts
│   │   ├── app/              # Routes: (auth), admin, teacher
│   │   └── components/       # Custom React components
│   └── package.json          # Frontend dependencies
├── docker-compose.yml        # Docker composition for database & cache
└── README.md                 # Project guide
```

---

> [!TIP]
> **Pro-Tip for Local Development:**
> If you're on Windows, make sure to use the `-P solo` pool flag when launching Celery workers to avoid Windows compatibility issues with prefork execution.
