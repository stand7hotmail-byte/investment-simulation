# Adversary Review: Code Refinement & Hardening (ADV-REFINE-001)

**Persona:** Elite Security Specialist & Hostile Peer Reviewer
**Date:** 2026-04-14
**Status:** FAIL (Critical Vulnerabilities Found)

## Findings Summary

### 1. [ADV-CRITICAL-001] Non-Thread-Safe Engine Creation
**Location:** `backend/app/database.py`
**Flaw:** `get_engine()` does not use a lock. In a concurrent server like Uvicorn, multiple threads could simultaneously check `_engine is None` and create separate engine instances, leading to connection pool exhaustion and memory leaks.
**Impact:** High. System instability under load.

### 2. [ADV-HIGH-001] Excessive CORS Permission
**Location:** `backend/app/main.py`
**Flaw:** The regex `.*\.vercel\.app` is too broad. It allows ANY project hosted on Vercel to bypass CORS.
**Impact:** High. Cross-site request forgery or data scraping from unauthorized origins.

### 3. [ADV-MED-001] Stale Auth Keys
**Location:** `backend/app/dependencies.py`
**Flaw:** `lifespan=86400` (24 hours) for `FailsafeJWKClient` is dangerous. If Supabase rotates keys, the backend will reject valid tokens until the cache expires.
**Impact:** Medium. Service denial for legitimate users.

### 4. [ADV-MED-002] Risk Parity Mathematical Failure
**Location:** `backend/app/simulation.py`
**Flaw:** If an asset has 0 volatility, `1.0 / (asset_volatilities + EPSILON)` creates a massive weight relative to others.
**Impact:** Medium. Nonsensical simulation results for stablecoins or cash-like assets.

## Verdict
**FAIL.** The implementation of SPEC-005 and SPEC-006 introduced latent concurrency bugs and a major CORS vulnerability.

## Action Plan
1. [ ] Implement `threading.Lock` in `get_engine()` and `get_session_local()`.
2. [ ] Tighten CORS regex to strictly match the specific Vercel project ID or move to a strict list.
3. [ ] Reduce JWKS cache lifespan to 1 hour and implement proactive rotation check.
4. [ ] Add a guard in `simulation.py` to handle zero-volatility assets by excluding them from risk parity or capping weights.
