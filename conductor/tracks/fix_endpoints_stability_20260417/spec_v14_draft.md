# Specification: API Routing & Frontend Retry Fix - Final v14 (DRAFT)

## 1. Overview
Hardened distributed system spec. Mandates native Web Locks for atomicity, scoped resource tracking for starvation prevention, and safe backend task detachment.

## 2. Behavioral Requirements (EARS)

- **[R-001: Graceful Task Detachment]**
  BACKEND shall implement `/api/market-summary` using a Single-flight pattern.
  - **SAFE DETACHMENT**: If a 10s safety timeout occurs, clients are released with a 504. The primary backend task MUST be marked as "detached", its priority lowered, and allowed to complete or be garbage-collected without blocking new requests.

- **[R-002: Jittered RFC-Compliant Retries]**
  (unchanged) Respect `Retry-After` + Full Jitter backoff.

- **[R-003: Atomic Cross-Tab Coordination via Web Locks]**
  - **HALF-OPEN (The Probe Gate)**:
    - Coordination MUST use the **Web Locks API** (`navigator.locks.request`).
    - Only the tab that acquires the exclusive lock named `api_probe_lock` is permitted to fire the recovery probe.
    - Locks MUST be requested with a timeout (e.g., `ifAvailable: true`) to prevent permanent stalls if the API itself hangs.

- **[R-004: Schema-Strict Model Access]**
  (unchanged)

- **[R-005: Response Verification]**
  (unchanged)

- **[R-006: Calibrated Cooldowns]**
  (unchanged) Use server-delta offset.

- **[R-007: Failsafe Scoped Request Counter]**
  FRONTEND shall maintain an internal counter for active requests.
  - **LEAK PREVENTION**: The counter MUST be managed within a `try...finally` block at the lowest possible level of the fetch wrapper to ensure decrement occurs even on exceptions.
  - **CRASH RECOVERY**: If the counter remains > 0 for 60s without a new request being started, it MUST be force-reset to 0.

- **[R-008: Degraded State UI]**
  (unchanged)

- **[R-009: Lock-Protected State Transitions]**
  ALL circuit state transitions (OPEN -> HALF-OPEN -> CLOSED) MUST be performed within an exclusive Web Lock to ensure global atomicity across all tabs.

## 3. Hostile Invariants (Mandated)

- **[I-WEB-LOCK-SAFETY]**: Prove that 100 concurrent tabs result in exactly 1 probe request using the Web Locks API.
- **[I-LEAK-FREE-COUNTER]**: Simulate 1000 failed/aborted requests; verify counter returns to 0.
- **[I-DETACHED-CLEANUP]**: Verify backend memory usage remains stable even if 100 tasks are "detached" due to timeouts.

## 4. Success Criteria
1. Zero race conditions in state transitions.
2. Verified resilience against tab crashes using native browser locking.
3. 100% RFC compliance.
