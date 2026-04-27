# Specification: API Routing & Frontend Retry Fix - Final v16 (DRAFT)

## 1. Overview
Mission-critical resilience spec. Enforces strict request-response pairing, self-releasing backend semaphores, and version-isolated distributed locking.

## 2. Behavioral Requirements (EARS)

- **[R-001: Self-Releasing Fixed-Slot Semaphore]**
  BACKEND shall implement a semaphore with a **Fixed Limit (e.g., 50 concurrent tasks)**.
  - **RAII PATTERN**: The semaphore MUST be acquired and released within a context manager.
  - **LIFECYCLE**: If a client times out (10s), the backend task continues to hold the slot ONLY until the task completion or failure, at which point the context manager MUST guarantee release.
  - **FAIL-FAST**: Reject with 503 if no slots available.

- **[R-002: Smart Jittered Retries]**
  (unchanged) RFC-compliant with Full Jitter.

- **[R-003: Version-Isolated Web Locks]**
  - **DYNAMIC LOCK NAME**: `INVEST_SIM_PROBE_LOCK_${APP_VERSION}_${ENV_NAME}`.
  - Transition logic remains as defined in v14.

- **[R-004: Schema-Strict Model Access]**
  (unchanged)

- **[R-005: Response Verification]**
  (unchanged)

- **[R-006: Server-Calibrated Time]**
  (unchanged)

- **[R-007: Strict ID-Based Request Registry]**
  FRONTEND shall maintain a `Set` or `Map` of active **Request IDs**.
  - **PAIRING**: Each fetch generates a UUID. Add to `registry` on start. Remove *exactly* that ID on response/error.
  - **STATE TRUTH**: `isProcessing = registry.size > 0`.
  - **RECOVERY**: Registry MUST be cleared if a domain-wide 503/OPEN state is detected to prevent UI hang.

- **[R-008: Graceful Degradation]**
  (unchanged)

- **[R-009: Atomic State Transitions]**
  (unchanged)

## 3. Hostile Invariants (Mandated)

- **[I-STRICT-PAIRING]**: Prove that even with reordered network packets, the request registry accurately reflects the number of *inflight* requests.
- **[I-SEMAPHORE-GUARANTEE]**: Verify that a task failing internally *always* releases its semaphore slot within 100ms of failure.
- **[I-VERSION-ISOLATION]**: Prove that V1 of the app does not contend for locks with V2 on the same origin.

## 4. Success Criteria
1. Formal request tracking verified.
2. Verified resource cleanup under failure injection.
3. 100% PASS from adversarial review.
