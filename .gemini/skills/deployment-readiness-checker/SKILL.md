---
name: deployment-readiness-checker
description: Scans FastAPI/PostgreSQL/Next.js projects for common deployment pitfalls like ES256 JWT, JSON/JSONB type mismatches, and relative API paths. Use before deploying to Vercel/Railway.
---

# Deployment Readiness Checker

This skill provides a systematic workflow to verify that an application is ready for production deployment, specifically focusing on cross-platform compatibility between development (SQLite) and production (PostgreSQL/Vercel).

## Workflow

Follow these steps before every production deployment:

### 1. Database Compatibility Scan (PostgreSQL)
- **Check JSON Columns**: Verify if `JSON` type is used in SQLAlchemy models. If so, ensure it's either upgraded to `JSONB` for PostgreSQL or the queries use `cast(..., String)` for comparisons.
- **Check UUID/GUID Handling**: Ensure that custom `GUID` types correctly handle `uuid.UUID` objects returned by the PostgreSQL driver to avoid `'UUID' object has no attribute 'replace'` errors.

### 2. Authentication & JWT Hardening
- **Verify Algorithm (alg)**: Scan the JWT verification logic. If Supabase is used, check if `ES256` is supported.
- **Strict Verification**: Ensure `algorithms` list is explicitly defined and `verify_signature=True` is the goal for production.

### 3. Frontend-Backend Connectivity
- **Absolute URLs**: Ensure all frontend API calls use a wrapper (e.g., `fetchApi`) that prepends the production backend URL.
- **Relative Path Check**: Search for `axios.get("/api/...")` or `fetch("/api/...")` and replace with absolute URL logic.

### 4. Environment Variable Validation
- **Secret Hygiene**: Verify that `SUPABASE_JWT_SECRET` and other keys are loaded from environment variables and `.strip()` is applied to avoid whitespace issues.
- **Required Vars**: Check for the presence of `DATABASE_URL`, `ALLOWED_ORIGINS`, and `NEXT_PUBLIC_API_URL`.

## Resource Reference

- For detailed PostgreSQL JSON comparison patterns, see [POSTGRES_PATTERNS.md](references/postgres_patterns.md).
- For Supabase ES256 public key integration, see [SUPABASE_HARDENING.md](references/supabase_hardening.md).
