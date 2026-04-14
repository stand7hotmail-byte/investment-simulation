# Spec: Railway Startup Fix & CORS Robustness (SPEC-006)

## Context
The application is experiencing a **502 Bad Gateway** on Railway and **Failed to fetch** errors on the frontend. This suggests a failure during the backend startup process or a mismatch in CORS headers.

## Requirements

### 1. Robust Startup Command
- **Pre-condition**: `railway.toml` uses `&&` to chain multiple setup scripts (`repair_db`, `alembic stamp`, `seed_assets`).
- **Input**: Railway deployment trigger.
- **Output/Effect**: 
  - Ensure the main web server (`uvicorn`) starts even if secondary maintenance tasks fail, to allow for diagnostic logs and health-checks.
  - Wrap maintenance tasks in a script or use `;` instead of `&&` for non-critical steps (like `seed_assets`).

### 2. Reliable CORS Responses
- **Pre-condition**: `CORSMiddleware` is configured with a complex regex.
- **Input**: Preflight (OPTIONS) requests from Vercel.
- **Output/Effect**: 
  - If the server is returning a 5xx error, the CORS middleware might be bypassed by Railway's edge, resulting in `Failed to fetch`.
  - Ensure the server is stable enough to return 200/403/401 with appropriate headers.
  - Explicitly allow the primary Vercel production domain in `allow_origins` to avoid regex calculation issues during high load.

### 3. Graceful DB Fallback
- **Pre-condition**: `database.py` raises a `RuntimeError` if engine creation fails.
- **Input**: Missing or malformed `DATABASE_URL`.
- **Output/Effect**: 
  - Allow the application to start in a "Limited Mode" if the DB is unavailable, so the `/` health-check endpoint still works for Railway's health checks.
  - Log a critical error instead of crashing the entire process.

## Verification Criteria
- Backend URL returns `{"status": "ok"}` on the root endpoint.
- Frontend no longer shows `TypeError: Failed to fetch`.
- `railway.toml` start command is resilient to minor maintenance failures.
