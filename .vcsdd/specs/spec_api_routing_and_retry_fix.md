# Specification: API Routing & Frontend Retry Fix - Final v5

## 1. Overview
Ensure production stability by implementing Request Coalescing with proper error propagation and a state-machine based Circuit Breaker.

## 2. Behavioral Requirements (EARS)

- **[R-001: Backend Request Coalescing & Error Propagation]**
  BACKEND shall implement `/api/market-summary` using a **Single-flight pattern**.
  - IF multiple concurrent requests arrive for the same data:
    - Exactly ONE fetch is performed.
    - OTHERS wait for the result.
    - IF the fetch fails, the SAME error MUST be propagated to all waiting requests.
  - TTL: 60s.

- **[R-002: Exact Retry Policy]**
  FRONTEND `QueryProvider` shall enforce:
  - `retry: (failureCount, error) => {
      if (error.status >= 400 && error.status < 500) return false;
      return failureCount <= 3; // Allows 1 initial + 3 retries = 4 total attempts
    }`
  - `staleTime: 30000`.

- **[R-003: State-Machine Circuit Breaker]**
  FRONTEND shall implement a 3-state Circuit Breaker for Background Paths:
  - **CLOSED (Default)**: Requests flow normally.
  - **OPEN**: Triggered after 5 errors in 60s. ALL network calls for Background Paths are blocked.
  - **HALF-OPEN**: Automatic transition after **5 minutes in OPEN state**. 
    - The NEXT single automated fetch is allowed.
    - IF it succeeds -> transition to CLOSED.
    - IF it fails -> transition back to OPEN (reset 5-minute timer).

## 3. Hostile Invariants (Mandated)

- **[I-HOSTILE-001: Backend Cache Isolation]**
  10 concurrent requests MUST result in exactly 1 external provider call.
- **[I-HOSTILE-002: Error Broadcast Consistency]**
  If a Single-flight fetch fails with 500, all 10 concurrent requests MUST receive the 500 error simultaneously.
- **[I-HOSTILE-003: Circuit Auto-Recovery]**
  The system MUST recover from OPEN to CLOSED state automatically after a recovery period (5 min) followed by a successful fetch, without requiring user reload.

## 4. Success Criteria
1. Single-flight tests pass for both success and failure cases.
2. Circuit breaker state machine verified via mock clocks (transition CLOSED -> OPEN -> HALF-OPEN -> CLOSED).
3. Critical paths (Auth/Health) are exempt from the breaker.
