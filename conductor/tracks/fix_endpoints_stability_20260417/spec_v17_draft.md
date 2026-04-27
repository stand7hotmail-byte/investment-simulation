# Specification: API Routing & Frontend Retry Fix - Final v17 (DRAFT)

## 1. Overview
Ultimate-grade resilience spec. Addresses distributed deadlocks, semaphore poisoning, and non-destructive state synchronization.

## 2. Behavioral Requirements (EARS)

- **[R-001: Hard-Timed RAII Semaphore]**
  BACKEND shall implement a semaphore with a **Fixed Limit (50 slots)**.
  - **HARD TIMEOUT**: Every semaphore slot MUST have a mandatory **30s lifecycle limit**. 
  - IF a task exceeds 30s, the slot MUST be force-released and a `SemaphoreTimeoutError` raised to the worker.
  - This prevents "Zombie slots" from permanently poisoning the capacity.

- **[R-002: Smart Jittered Retries]**
  (unchanged) RFC-compliant with Full Jitter.

- **[R-003: Deadlock-Free Web Locks]**
  - **NON-BLOCKING ACQUISITION**: Web Locks for `api_probe_lock` MUST use `{ ifAvailable: true }` or a maximum 5s timeout.
  - IF the lock cannot be acquired within the timeout, the tab MUST assume another tab is probing and enter a **Passive Wait** state (backing off) rather than blocking the UI or connection pool.

- **[R-004: Schema-Strict Model Access]**
  (unchanged)

- **[R-005: Response Verification]**
  (unchanged)

- **[R-006: Server-Calibrated Time]**
  (unchanged)

- **[R-007: Self-Cleaning Request Registry]**
  FRONTEND shall maintain a `Map` of active Request IDs with metadata (start_timestamp).
  - **SURGICAL CLEANUP**: A background **Garbage Collector (GC)** shall run every 10s.
  - IF a Request ID has been in the registry for > 45s without a response, it MUST be removed individually and its specific UI state marked as "Timed Out".
  - A global wipe is strictly PROHIBITED to preserve UI truth for healthy concurrent requests.

- **[R-008: Graceful Degradation]**
  (unchanged)

- **[R-009: Ordered State Transitions]**
  Circuit state transitions MUST be performed using a **Sequential Lock Order** to prevent circular dependencies between local state and global `BroadcastChannel` events.

## 3. Hostile Invariants (Mandated)

- **[I-SEMAPHORE-HARD-RELEASE]**: Prove that a backend task hanging for 1 hour still releases its semaphore slot at exactly T+30s.
- **[I-DEADLOCK-IMMUNITY]**: Simulate a "Full Semaphore" on backend and a "Held Lock" on frontend; verify that new tabs do NOT hang and can still navigate the UI.
- **[I-SURGICAL-GC]**: Prove that one hung request (ID-A) being timed out by the GC does NOT affect the successful completion of a parallel request (ID-B).

## 4. Success Criteria
1. ZERO distributed deadlocks in high-concurrency simulation.
2. Verified resource recovery from zombie tasks.
3. **PASS** verdict from adversarial review.
