# ITFlow 3D Enterprise E-Commerce Platform

This bundle contains the existing React + Vite frontend and FastAPI + SQLAlchemy backend supplied for this project. The source files have been retained; generated dependencies, Python caches, local environment secrets, and local database files are excluded.

## Project structure

- `frontend/` — React, Vite, Tailwind CSS, Three.js / React Three Fiber UI.
- `backend/app/` — FastAPI application, API routes, models, schemas, services, and tests.
- `backend/scripts/seed_data.py` — development/demo database seeding script.
- `backend/requirements.txt` — Python dependencies.
- `backend/.env.example` — safe configuration template; copy it to `backend/.env`.

## Requirements

- Python 3.10+ (the source was originally supplied with a Python 3.12 virtual environment; that environment is intentionally not included).
- Node.js and npm.
- A database supported by the SQLAlchemy URL and its installed driver. SQLite is the current default for local development.

## Run locally (Windows PowerShell)

### 1. Backend

```powershell
cd backend
py -m venv venv
.env\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` before starting. Generate separate JWT secrets:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Run that command twice and use the two different values for `SECRET_KEY` and `REFRESH_SECRET_KEY`. Set a strong unique `FIRST_SUPER_ADMIN_PASSWORD`. Do not commit `.env`.

Start the API from the `backend` directory:

```powershell
python -m uvicorn app.main:app --reload
```

- API: `http://127.0.0.1:8000`
- Swagger docs: `http://127.0.0.1:8000/api/v1/docs`
- Health endpoint: `http://127.0.0.1:8000/health`

### 2. Frontend

Open a second PowerShell terminal:

```powershell
cd frontend
npm install
npm run dev
```

Vite serves the frontend at `http://localhost:5173`. The supplied Vite config proxies `/api`, `/uploads`, and `/ws` to the local backend at `http://127.0.0.1:8000`.

## Tests and build

Backend tests are located in `backend/app/tests/`. From the `backend` directory, run:

```powershell
pytest
```

From the `frontend` directory, run:

```powershell
npm run build
```

## Important security and deployment notes

1. This is a cleaned source bundle, **not a production security certification or verified deployment build**.
2. Never publish `.env`, database files, customer uploads, payment secrets, or JWT secrets.
3. The source currently contains development fallback credentials/configuration and the seed script creates demo users with fixed passwords. Review and replace/remove these before production; do not use demo accounts in a live system.
4. Review the CORS configuration in `backend/app/main.py`. The supplied source currently allows all origins while credentials are enabled. Restrict it to the exact deployed frontend origin before production.
5. The supplied `/health` endpoint returns a static database status; it does not perform a live database connectivity check.
6. The current startup creates tables with SQLAlchemy `create_all`. Use a migration workflow such as Alembic before production schema changes.
7. The frontend uses relative `/api/v1` requests and the included Vite proxy is for local development. Configure a production reverse proxy or API base URL when deploying the frontend separately.
8. For PostgreSQL/MySQL, install and configure the appropriate SQLAlchemy database driver and use a managed database URL. The default configuration is SQLite.
9. Verify payment gateway integration and webhook/signature validation with the payment provider before accepting real payments.

## Included source scope

The ZIP preserves the supplied backend and frontend source files, package manifests/lockfile, static assets, tests, and seed script. It excludes `backend/.env`, virtual environments, `node_modules`, cache directories, compiled Python files, and local database files.
