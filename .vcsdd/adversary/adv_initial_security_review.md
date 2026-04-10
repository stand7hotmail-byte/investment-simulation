# Adversary Review: Initial Security & Stability Assessment

**Persona:** Elite Security Specialist & Hostile Peer Reviewer
**Date:** 2026-04-08
**Status:** Needs Attention

## Findings Summary

### 1. [ADV-001] Weak CORS Configuration (High Risk)
**Location:** `backend/app/main.py`
**Flaw:** `allow_origins=["*"]` is enabled.
**Impact:** Allows any website to make cross-origin requests to this API. While credentials are required for protected routes, unprotected routes (like `/api/assets`) are fully exposed. This can be exploited for tracking or data scraping.
**Adversary's Critique:** "Leaving CORS wide open with a comment like 'temporarily' is the #1 way production leaks happen. Fix this immediately by binding it to an environment variable."

### 2. [ADV-002] Incomplete JWT Verification (Medium Risk)
**Location:** `backend/app/dependencies.py`
**Flaw:** `options = {"verify_aud": False, "verify_iss": False}` in ES256 verification.
**Impact:** The system accepts any valid Supabase token, even those issued for a DIFFERENT project using the same signing algorithm (if the attacker knows the keys). It fails to verify that the token was actually intended for this specific application.
**Adversary's Critique:** "You're doing the hard work of ES256/JWKS but skipping the easiest part: verifying the audience. This is a classic 'security through obscurity' failure."

### 3. [ADV-003] Calculation Drift & Late Sanitization (Low-Medium Risk)
**Location:** `backend/app/simulation.py` vs `backend/app/main.py`
**Flaw:** Numerical stability checks (`isnan`/`isinf`) are performed at the API boundary, but not within the core simulation loop or during DB writes.
**Impact:** Invalid floats could be persisted in the database (via `SimulationResult`) if not careful, leading to 500 errors on retrieval before sanitization happens.
**Adversary's Critique:** "You're sweeping the trash under the rug at the last second. Sanitize at the source of the calculation to ensure the entire system's state remains valid."

## Verdict
**FAIL with Improvements Required.**

## Action Plan
1. [ ] Binding `CORS_ORIGINS` to an environment variable in `config.py`.
2. [ ] Enabling `verify_aud` and `verify_iss` in `jwt.decode` by fetching them from Supabase project settings.
3. [ ] Moving `NaN/Inf` checks directly into the output of `run_monte_carlo_simulation`.
