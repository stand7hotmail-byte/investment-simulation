# Plan: Coherence Hardening & Adversarial Approval (VCT-Phase-1c)

## Objective
Finalize the specification for API Routing and Stability, obtaining a PASS verdict from the Adversarial Review (v10) and ensuring all recent fixes are registered in the Coherence Graph.

## Implementation Steps

### Phase 1: Specification Upgrade (v10)
- **Target**: `.vcsdd/specs/spec_api_routing_and_retry_fix.md`
- **Action**: Apply the v10 draft which addresses:
    - [R-003] Deterministic HALF-OPEN exit criteria (3 consecutive successes).
    - [R-002] Smart retry for 408/429 with exponential backoff.
    - [R-007] Physical isolation of circuit breaker instances per domain.
    - [R-001] Negative TTL (5s) for backend error caching.

### Phase 2: Adversarial Review (The Gauntlet)
- **Action**: Run `vcsdd-adversary` on the v10 spec.
- **Goal**: Secure a binary **PASS** verdict.
- **Artifacts**: `findings_v10.md`, `verdict_v10.json`.

### Phase 3: Coherence Registration
- **Action**: Register the new specification version and the recent implementation fixes in `backend/app/main.py` as Implementation Beads in `.vcsdd/coherence.json`.
- **Verification**: Run `vcsdd-verify` to ensure 100% coherence.

## Verification & Testing
- Run existing tests in `backend/tests/` to ensure no regression.
- Manually verify the recovered endpoints (`GET /api/simulation-results/{id}`, `DELETE ...`).
