# Behavioral Specification: Portfolio Management Robustness (SPEC-012)

## Overview
Ensure all portfolio lifecycle operations (Create, Read, Update, Delete) are robust against data inconsistencies and database failures.

## Requirement ID (Bead ID)
`SPEC-012`

## Pre-conditions
- User is authenticated.
- Database is connected.

## Portfolio Operations (API /api/portfolios)

### 1. Creation & Update
- **Input Validation**: Weight sum must be approximately 1.0 (handled by frontend, but backend should sanitize).
- **Numeric Safety**: Asset weights and initial investment values MUST be sanitized for NaN/Inf before saving.
- **Atomic Transaction**: Creation of portfolio and its allocations MUST be atomic.
- **Graceful Error**: If a database constraint is violated or a write fails, return a `400 Bad Request` or `422 Unprocessable Entity` instead of a 500 error.

### 2. Deletion
- **Existence Check**: Ensure the portfolio exists before attempting deletion.
- **Ownership**: Verify the requesting user owns the portfolio.
- **Referential Integrity**: Deleting a portfolio must safely handle (cascade or clear) linked simulation results.
- **Safe Response**: Return `200 OK` on success, `404 Not Found` if the portfolio doesn't exist, and `403 Forbidden` if the user is not the owner.

### 3. Read Operations
- **Output Sanitization**: Ensure all numerical data returned to the user is JSON-safe (no NaN/Inf).
- **Authorization**: Only return portfolios belonging to the authenticated user.

## Edge Cases
- **Duplicate Asset Codes**: A portfolio should not have duplicate asset entries.
- **Database Race Conditions**: Handle scenarios where an asset might be deleted while being added to a portfolio.
- **Malformed JSON**: Input payloads with invalid JSON structures should be caught by Pydantic.

## Pass/Fail Criteria
- [ ] No unhandled database exceptions reach the global middleware (no 500s).
- [ ] Portfolios can be created, updated, and deleted without system instability.
- [ ] Deleting a non-existent or unauthorized portfolio returns a 4xx error.
- [ ] Large number of allocations in a single portfolio does not timeout the request.
