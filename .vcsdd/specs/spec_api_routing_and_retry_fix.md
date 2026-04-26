# Specification: API Routing & Frontend Retry Fix - Final v9

## 1. Overview
Ensure production stability by implementing Request Coalescing with short negative-TTL, a state-machine based PERSISTENT & DETERMINISTIC Circuit Breaker, and strict data model safety.

## 2. Behavioral Requirements (EARS)

- **[R-001: Backend Request Coalescing with Negative TTL]**
  BACKEND shall implement `/api/market-summary` using a **Single-flight pattern**.
  - Exactly ONE fetch for concurrent requests.
  - TTL (Success): 60s.
  - TTL (Error/Negative): **MAX 5s**. 
  - *Rationale*: Prevent transient failures from causing extended outages.

- **[R-002: Exact Retry Policy]**
  FRONTEND `QueryProvider` shall enforce:
  - `retry: (failureCount, error) => {
      if (error.status >= 400 && error.status < 500) return false;
      return failureCount <= 3; 
    }`

- **[R-003: Deterministic State-Machine Circuit Breaker]**
  Triggered ONLY by 5xx or Network Errors:
  - **CLOSED**: Normal.
  - **OPEN**: Triggered after 5 errors in 60s. 
  - **HALF-OPEN**: AUTOMATIC transition after 5 minutes.
  - ON EXPIRY, state MUST transition strictly to **HALF-OPEN**.

- **[R-004: Data Model Access Safety]**
  (unchanged) No mock values. Use DB last-known or return 404/Empty.

- **[R-005: Schema Integrity]**
  (unchanged) Strictly match Pydantic schemas.

- **[R-006: Continuous Persistence & Expiry]**
  FRONTEND MUST persist state and timestamp in `localStorage`.
  - EXPIRED check MUST occur on **EVERY** attempted request or state access, not just boot.

- **[R-007: Domain Scoping]**
  - **MARKET**: `/api/market-summary`, `/api/assets/*`
  - **USER**: `/api/portfolios/*`, `/api/simulation-results/*`

- **[R-008: Graceful Degradation]**
  (unchanged) Use cached values and display "Stale Data" warning if MARKET is OPEN.

- **[R-009: Multi-Tab Synchronization]**
  FRONTEND MUST synchronize circuit state across tabs using `BroadcastChannel` or `window.addEventListener('storage', ...)`.
  - A state transition in one tab MUST be reflected in all other tabs within 100ms.

## 3. Hostile Invariants (Mandated)

- **[I-HOSTILE-001]** ... (Legacy ones retained)
- **[I-HOSTILE-007: Zombie-Prevention]**
  Keep a tab open for 6 minutes without activity; the next fetch MUST bypass the OPEN block because the 5-min timer expired in the background.
- **[I-HOSTILE-008: Negative TTL Pressure]**
  Inject a 500 error, then recover the backend. Within 6 seconds, the frontend MUST receive a 200 OK (proving the error wasn't cached for 60s).
- **[I-HOSTILE-009: Broadcast Coordination]**
  Open Tab A and Tab B. Trigger OPEN in Tab A. Attempt a fetch in Tab B after 100ms. The fetch in Tab B MUST be blocked without a network request.

## 4. Success Criteria
1. Integration tests for 10 concurrent requests and short negative TTL.
2. Verified multi-tab state sync.
3. Domain isolation unit tests pass.
