# Specification: API Routing & Frontend Retry Fix - Final v18 (DRAFT)

## 1. Overview
Fail-Safe Distributed System Spec (v18). Addresses synchronous worker hangs, deterministic lock recovery, and strict temporal alignment.

## 2. Behavioral Requirements (EARS)

- **[R-001: Aggressive Resource Reclamation]**
  - **SLOT RELEASE**: 30s hard limit for semaphore slots.
  - **TERMINATION**: If a slot is force-released due to timeout, the backend MUST attempt to terminate the underlying task/thread via SIGINT/SIGKILL or a runtime-level recycler to prevent capacity leak.

- **[R-002: Jittered RFC-Compliant Retries]**
  (unchanged) Full Jitter backoff.

- **[R-003: Deterministic Lock Recovery]**
  - **PASSIVE WAIT**: If `api_probe_lock` is unavailable, the tab MUST enter a wait state.
  - **WAKE-UP PROTOCOL**: Waiting tabs MUST retry lock acquisition at a randomized interval (e.g., 2s + rand(0, 3s)).
  - This ensures that if the current holder crashes, a new probe starts within 5s.

- **[R-004: Schema-Strict Model Access]**
  (unchanged)

- **[R-005: Response Verification]**
  (unchanged)

- **[R-006: Server-Calibrated Time]**
  (unchanged)

- **[R-007: Temporally Aligned Registry GC]**
  - **ALIGNED TIMEOUT**: Frontend Registry GC timeout MUST match the backend hard timeout (30s) plus a 5s network jitter buffer (Total **35s**).
  - This eliminates the "phantom zone" where states are incoherent between layers.

- **[R-008: Degraded State UI]**
  (unchanged)

- **[R-009: Strict Lock Hierarchy]**
  ALL state transitions MUST follow a global **Acquisition Order**: 
  1. Local Tab State -> 2. Domain Lock -> 3. Global Origin Lock.
  - Releasing MUST occur in reverse order to prevent circular deadlocks.

- **[R-010: Memory-Safe Abort Propagation]**
  Every request in the Registry MUST have an associated `AbortController`. 
  - ON GC removal, `abort()` MUST be called to release browser-side socket handles and memory instantly.

## 3. Hostile Invariants (Mandated)

- **[I-SEMAPHORE-RECOVERY-SYNC]**: Prove that 50 synchronous hung workers result in a healthy, responsive system after the 30s timeout + worker recycling.
- **[I-DETERMINISTIC-WAKEUP]**: Simulate a crashed probe tab; verify another tab resumes the probe within 5s without human interaction.
- **[I-MEMORY-CEILING]**: Prove O(1) memory ceiling for the registry under 100% request failure conditions.

## 4. Success Criteria
1. Full VCT Coherence (100% verified).
2. ZERO leaks (Resource/Thread/Socket).
3. **PASS** verdict from adversarial review.
