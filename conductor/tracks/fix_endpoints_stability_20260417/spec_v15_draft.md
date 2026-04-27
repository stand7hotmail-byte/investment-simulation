# Specification: API Routing & Frontend Retry Fix - Final v15 (DRAFT)

## 1. Overview
Industrial-grade resilient architecture. Addresses worker pool protection, atomic coordination with namespace isolation, and robust resource tracking.

## 2. Behavioral Requirements (EARS)

- **[R-001: Backend Worker Protection (Semaphore)]**
  BACKEND shall implement a **Max-Concurrency Semaphore** for Single-flight fetch tasks.
  - IF a safety timeout (10s) occurs, the client is released, but the background task MUST NOT exceed a global limit (e.g., 20% of total workers). 
  - IF the semaphore is full, subsequent MARKET requests MUST be rejected with 503 Service Unavailable immediately (no waiting).

- **[R-002: Jittered RFC-Compliant Retries]**
  (unchanged) Respect `Retry-After`.

- **[R-003: Namespaced Atomic Coordination]**
  - **WEB LOCKS**: Use `navigator.locks.request` with a unique application prefix (e.g., `INVEST_SIM_PROBE_LOCK`).
  - Transition logic remains as defined in v14 but isolated to this application namespace.

- **[R-004: Schema-Strict Model Access]**
  (unchanged)

- **[R-005: Response Verification]**
  (unchanged)

- **[R-006: Millisecond Time Calibration]**
  (unchanged) Use server-delta.

- **[R-007: Safe Scoped Request Counter]**
  - **NON-NEGATIVE GUARD**: Decrement logic MUST use `Math.max(0, counter - 1)`.
  - **SAFETY RESET**: Keep the 60s reset but ensure the counter never goes negative.

- **[R-008: Degraded State UI]**
  (unchanged)

- **[R-009: Exclusive State Management]**
  (unchanged) Lock-protected state transitions.

## 3. Hostile Invariants (Mandated)

- **[I-WORKER-RESERVE]**: Prove that 100 hung backend requests do NOT consume more than 20% of the FastAPI worker pool.
- **[I-NAMESPACE-ISOLATION]**: Verify that a lock held by this app does not block a different app on the same origin using a different prefix.
- **[I-COUNTER-STABILITY]**: Simulate a 70s late response; verify the counter does not become negative or stay stuck.

## 4. Success Criteria
1. Worker pool exhaustion prevented under simulated high-latency.
2. Verified non-negative counter stability.
3. Successful coordination across 10+ tabs.
