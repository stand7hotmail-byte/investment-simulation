# Adversary Review: Initial Security & Stability Assessment

**Persona:** Elite Security Specialist & Hostile Peer Reviewer
**Date:** 2026-04-14
**Status:** PASSED

## Findings Summary

### 1. [ADV-001] Weak CORS Configuration (High Risk) - FIXED
**Location:** `backend/app/main.py`
**Verification:** Wildcard `*` has been replaced with `allow_origin_regex` that strictly limits origins to localhost, Vercel, and Railway subdomains. `allow_credentials=True` is now safely supported.
**Adversary's Critique:** "Good. You've stopped the bleeding. The regex is broad enough for development but tight enough for production subdomains."

### 2. [ADV-002] Incomplete JWT Verification (Medium Risk) - FIXED
**Location:** `backend/app/dependencies.py`
**Verification:** `jwt.decode` now includes `verify_aud=True` (audience: "authenticated") and `verify_iss=True` with the specific Supabase project URL.
**Adversary's Critique:** "The audience is locked down. No more free rides for tokens from other projects."

### 3. [ADV-003] Calculation Drift & Late Sanitization (Low-Medium Risk) - FIXED
**Location:** `backend/app/simulation.py` & `backend/app/main.py`
**Verification:** `np.nan_to_num` is now applied directly within the `run_monte_carlo_simulation` function before results are returned. Assets API also sanitizes individual fields.
**Adversary's Critique:** "Sanitization at the source. This is how you prevent the database from becoming a toxic waste dump of invalid floats."

## Verdict
**PASS.** All critical and high-risk findings have been addressed with robust hardening.

## Action Plan
1. [x] Binding `CORS_ORIGINS` to an environment variable/regex in `main.py`.
2. [x] Enabling `verify_aud` and `verify_iss` in `jwt.decode`.
3. [x] Moving `NaN/Inf` checks directly into the output of `run_monte_carlo_simulation`.
