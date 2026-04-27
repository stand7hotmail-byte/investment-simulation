# Specification: API Routing & Frontend Retry Fix - Final v10 (DRAFT)

## 1. Overview
Ensure production stability by implementing Request Coalescing with short negative-TTL, a state-machine based PERSISTENT, DETERMINISTIC, and DOMAIN-ISOLATED Circuit Breaker.

## 2. Behavioral Requirements (EARS)

- **[R-001: Backend Request Coalescing with Negative TTL]**
  BACKEND shall implement `/api/market-summary` using a **Single-flight pattern**.
  - Exactly ONE fetch for concurrent requests.
  - TTL (Success): 60s.
  - TTL (Error/Negative): **MAX 5s**. 

- **[R-002: Smart Retry Policy]**
  FRONTEND `QueryProvider` shall enforce:
  - `retry: (failureCount, error) => {
      if (error.status === 408 || error.status === 429) return failureCount <= 3;
      if (error.status >= 400 && error.status < 500) return false;
      return failureCount <= 3; 
    }`
  - Exponential backoff MUST be applied for retries.

- **[R-003: Deterministic Circuit Breaker State Machine]**
  Triggered ONLY by 5xx or Network Errors (Excluding 4xx except 408/429):
  - **CLOSED**: Normal.
  - **OPEN**: Triggered after 5 relevant errors in 60s. 
  - **HALF-OPEN**: Transition after 5 minutes. 
    - **RECOVERY CRITERIA**: If **3 consecutive requests succeed**, transition to CLOSED.
    - **RELAPSE CRITERIA**: If **ANY single request fails**, transition back to OPEN (resets timer).

- **[R-004: Data Model Access Safety]**
  BACKEND shall access `AssetData` exclusively via defined schema fields. No mock values (like 100.0).

- **[R-005: Schema Integrity]**
  BACKEND response payloads MUST match Pydantic schemas. 

- **[R-006: Continuous Persistence & Expiry]**
  FRONTEND MUST persist state and timestamp in `localStorage`.
  - EXPIRED check MUST occur on EVERY attempted request or state access.

- **[R-007: Physically Isolated Domain Scopes]**
  Circuit Breaker instances MUST be unique per domain:
  - **MARKET**: `/api/market-summary`, `/api/assets/*`
  - **USER**: `/api/portfolios/*`, `/api/simulation-results/*`
  - AN outage in MARKET domain MUST NOT share state, memory, or execution thread blocking with USER domain.

- **[R-008: Graceful Degradation]**
  (unchanged)

- **[R-009: Multi-Tab Synchronization]**
  Broadcast state changes within 100ms using BroadcastChannel or storage events.

## 3. Hostile Invariants (Mandated)

- **[I-HOSTILE-010: Success Saturation]**
  Verify that 1 or 2 successes in HALF-OPEN state followed by 1 failure results in an immediate transition back to OPEN.
- **[I-HOSTILE-011: Zero-Shared-Fate]**
  Prove that a 100% failure rate in MARKET domain causes ZERO latency overhead (>1ms) for requests in the USER domain.
- **[I-HOSTILE-012: Recoverable 4xx Retry]**
  Verify that a 429 (Rate Limit) triggers exactly 3 retries with increasing delay before final failure.

## 4. Success Criteria
1. Integration tests for concurrent coalescing.
2. Verified 3-success recovery in HALF-OPEN.
3. Multi-tab sync verified.
