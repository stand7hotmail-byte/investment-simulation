# Specification: API Routing & Frontend Retry Fix - Final v13 (DRAFT)

## 1. Overview
Fail-safe distributed architecture for high-concurrency environments. Focus on self-healing tab coordination, heuristic connection management, and best-effort resource reclamation.

## 2. Behavioral Requirements (EARS)

- **[R-001: Best-Effort Async Request Coalescing]**
  BACKEND shall implement `/api/market-summary` using a Single-flight pattern.
  - **ASYNC TERMINATION**: If a 10s safety timeout occurs, the backend MUST trigger asynchronous cancellation of the fetch task and attempt to close associated transport handles.

- **[R-002: Full-Jitter RFC-Compliant Retries]**
  FRONTEND shall respect `Retry-After`. 
  - IF no header, use **Full Jitter Exponential Backoff** (Base 1s, Max 10s).

- **[R-003: Self-Healing Multi-Tab Circuit Breaker]**
  - **CLOSED/OPEN**: (Standard logic).
  - **HALF-OPEN (Coordinated Probe)**:
    - Coordination via **Lock-with-TTL**: A tab must acquire a `probe_lock` key in `localStorage` with a 5s TTL.
    - **HEARTBEAT**: The probing tab MUST refresh the lock every 1s until completion.
    - **RECOVERY**: If a lock is found to be expired (Last Heartbeat > 5s), ANY tab may claim it and restart the probe.

- **[R-004: Schema-Strict Model Access]**
  (unchanged) No mocks. Use `historical_prices`.

- **[R-005: Response Verification]**
  (unchanged) Strictly match schemas.

- **[R-006: Calibrated Cooldowns]**
  Use a server-calculated `X-Server-Timestamp` (millisecond precision) to calculate a local offset. All cooldowns MUST be calculated using `Date.now() + offset` to prevent system clock bypass.

- **[R-007: Internal-Counter Priority Interceptor]**
  FRONTEND shall maintain an **Active Request Counter** per origin (heuristic).
  - IF counter >= 4 (leaving buffer for critical calls) AND circuit is not CLOSED:
    - **MARKET** requests MUST be queued.
    - **USER** requests bypass queue.

- **[R-008: Degraded State UI]**
  (unchanged)

- **[R-009: Broadcast-State Propagation]**
  State changes (OPEN/CLOSED) MUST be broadcast via `BroadcastChannel`. 
  - Atomic transitions are handled via the lock mechanism in R-003.

## 3. Hostile Invariants (Mandated)

- **[I-COALESCE-ABORT]**: Verify backend task cancellation triggers on timeout.
- **[I-STALE-LOCK-RECOVERY]**: Simulate a crashed probe tab; verify another tab takes over the probe after 5s without user intervention.
- **[I-HEURISTIC-PRIORITY]**: Confirm 4 concurrent MARKET calls do not block a subsequent USER call.
- **[I-TIME-CALIBRATION]**: Verify cooldown persistence when local clock is manipulated.

## 4. Success Criteria
1. No permanent stalls in HALF-OPEN state on tab crash.
2. Verified priority queueing using internal counter.
3. Full RFC 7231 compliance.
