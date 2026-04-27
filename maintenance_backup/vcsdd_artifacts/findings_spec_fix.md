# Adversarial Audit Report: API Routing & Frontend Retry Fix (v4)

**Status:** FAIL
**Reviewer:** Elite Hostile Senior Engineer

## Summary
The specification contains critical mathematical and logical flaws that would lead to incorrect retry behavior and a permanent circuit-breaker lockout in a production environment.

## Findings

### [F-001] Retry Count Mismatch (Mathematical Soundness)
- **Requirement:** "Retry 3 times" (Total 4 attempts).
- **Mandated Code:** `failureCount < 3`.
- **Reality:** In TanStack Query, `failureCount < 3` terminates after the 3rd attempt (Initial + 2 retries).
- **Impact:** Under-retrying in transient network failure scenarios, reducing availability.
- **Fix:** Change to `failureCount <= 3` or `failureCount < 4`.

### [F-002] Circuit Breaker Reset Deadlock (Logical Loop)
- **Requirement:** "Reset after 5 minutes of no automated fetch attempts."
- **Flaw:** Background paths are automated by nature (TanStack Query hooks). If the breaker is OPEN and an automated fetch is "blocked," the system still registers an "attempt" to fetch. If these attempts occur more frequently than every 5 minutes (e.g., every 30s per `staleTime`), the reset timer will NEVER expire.
- **Impact:** Permanent lockout of background services after a single outage.
- **Fix:** Reset after 5 minutes of **wall-clock time since circuit opening**, independent of blocked attempts.

### [F-003] Single-Flight Error Propagation (Backend)
- **Observation:** R-001 does not specify behavior when the "ONE external provider fetch" fails. 
- **Risk:** If the fetch fails and the error is not cached or handled correctly, the `asyncio.Lock` might release but leave waiters in an undefined state or trigger a thundering herd immediately upon the next request.
- **Fix:** Define error caching/coalescing behavior.

## Mandated Hostile Invariants (Updated/Clarified)

1.  **[I-HOSTILE-001]** (Unchanged): Exactly 1 provider call for 10 concurrent stale requests.
2.  **[I-HOSTILE-002]** (Unchanged): 404 results in exactly 1 network request.
3.  **[I-HOSTILE-003]** (Clarified): WHILE circuit is OPEN, `/api/market-summary` MUST NOT produce any network traffic for automated calls, but MUST allow a manual override.
4.  **[I-HOSTILE-004]** (New): The circuit MUST reset after 5 minutes even if automated queries continue to fire (and get blocked) every 30 seconds.

## Final Verdict: FAIL
The spec is NOT production-ready. Revert to v5 and fix the mathematical count and the circuit reset deadlock.
