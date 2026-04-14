# Spec: Code Refinement & Hardening (SPEC-005)

## Context
Refactoring "makeshift" code patterns discovered during global review to ensure production-grade stability and security.

## Requirements

### 1. Unified Logging Strategy
- **Pre-condition**: System uses raw `print()` for critical errors and debug info.
- **Input**: Application events (startup, CORS config, exceptions).
- **Output/Effect**: 
  - Replace `print()` in `main.py`, `database.py`, and `simulation.py` with standard `logging` module.
  - Exception middleware must log full stack traces at `ERROR` level but return sanitized details to the client.

### 2. Numerical Stability Constants (Epsilon)
- **Pre-condition**: Different epsilon values (1e-8, 1e-9, 1e-10) are hardcoded in `simulation.py`.
- **Input**: Matrix inversions, zero-division guards.
- **Output/Effect**: 
  - Define a global `EPSILON = 1e-9` in `simulation.py` or a config file.
  - Standardize all small-value guards to use this constant.

### 3. Strict CORS Hardening
- **Pre-condition**: `allow_origin_regex` permits any `*.vercel.app` or `*.up.railway.app`.
- **Input**: HTTP request origin header.
- **Output/Effect**: 
  - Narrow the regex to specific project domains if available, or move allowed origins to an environment variable `CORS_ALLOWED_ORIGINS` (comma-separated).
  - Fallback to safe defaults (localhost) if the variable is missing.

### 4. Database Initialization Robustness
- **Pre-condition**: Database engine failure only prints an error.
- **Input**: DB connection failure.
- **Output/Effect**: 
  - Raise a `RuntimeError` or similar descriptive exception if the engine cannot be initialized, preventing the app from starting in a broken state.

## Verification Criteria
- No `print()` calls in `backend/app/` core files (excluding CLI scripts like `seed_assets.py`).
- All numerical guards in `simulation.py` use a defined constant.
- CORS responds with 403 for unauthorized origins (e.g., `attacker.vercel.app`).
- App fails to start if `DATABASE_URL` is invalid.
