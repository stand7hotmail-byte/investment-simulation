# Specification: API Routing & Frontend Retry Fix - Final v12 (DRAFT)

## 1. Overview
Industrial-grade resilience spec: Request Coalescing with context-cancellation, atomic cross-tab circuit coordination, and transport-aware request prioritization.

## 2. Behavioral Requirements (EARS)

- **[R-001: Leak-Proof Request Coalescing]**
  BACKEND shall implement `/api/market-summary` using a Single-flight pattern.
  - **CONTEXT CANCELLATION**: If a 10s safety timeout occurs, the primary fetch task MUST be explicitly cancelled and underlying resources (threads/connections) reclaimed immediately.
  - TTL (Success): 60s; TTL (Error): 5s.

- **[R-002: Jittered RFC-Compliant Retries]**
  FRONTEND shall respect `Retry-After`. 
  - IF no header, use **Full Jitter Exponential Backoff** (Base 1s, Max 10s).
  - MAX attempts: 4.

- **[R-003: Atomic Multi-Tab Circuit Breaker]**
  - **CLOSED**: Normal.
  - **OPEN**: Triggered after 5 relevant errors (5xx/Net) in 60s. 
  - **HALF-OPEN (The Probe Gate)**:
    - ONLY ONE request across all tabs is permitted to "probe" the backend.
    - Coordination MUST be achieved via `localStorage` locking or a designated Leader Tab.
    - **RECOVERY**: 5 consecutive successes from ANY tab transition state to CLOSED.
    - **RELAPSE**: 1 failure in HALF-OPEN transitions state back to OPEN globally.

- **[R-004: Data Model Access Safety]**
  (unchanged) No mock values.

- **[R-005: Schema Integrity]**
  (unchanged)

- **[R-006: Skew-Resistant Persistence]**
  Persist circuit state using **Relative Time Deltas** calibrated against the `Date` header from the last successful server response to mitigate local clock manipulation.

- **[R-007: Priority Request Interceptor]**
  FRONTEND shall implement a **Request Interceptor** (Axios/Fetch wrapper):
  - IF origin connection limit (6) is nearing saturation AND the circuit is not CLOSED:
    - **USER** requests (Critical) take absolute priority.
    - **MARKET** requests (Non-critical) MUST be queued or dropped until connection slots release.

- **[R-008: Graceful Degradation]**
  (unchanged) "Stale Data" warning.

- **[R-009: Leader-Tab Orchestration]**
  A deterministic "Leader" tab (lowest Tab ID) shall be responsible for state transition broadcasts and HALF-OPEN probe authorization to prevent thundering herds.

## 3. Hostile Invariants (Mandated)

- **[I-COALESCE-LEAK]**: Verify thread/socket reclamation on 10s timeout.
- **[I-ATOMIC-HALF-OPEN]**: Ensure strictly ONE request is sent even if 10 tabs try to fetch in HALF-OPEN state simultaneously.
- **[I-PRIORITY-QUEUE]**: Prove that a pending USER request is not blocked by a queued MARKET request when a connection slot becomes available.
- **[I-CLOCK-SKEW]**: Verify that moving the system clock 1 hour forward does not prematurely exit an OPEN state cooldown.

## 4. Success Criteria
1. No resource leaks detected under simulated backend hangs.
2. Verified global cross-tab single-probe logic.
3. Priority-aware fetch behavior confirmed under connection pressure.
