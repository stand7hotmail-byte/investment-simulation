# Behavioral Specification: Risk Parity & UI Stability (SPEC-011)

## Overview
Ensure the Risk Parity simulation is numerically stable and the UI remains responsive even when the backend fails.

## Requirement ID (Bead ID)
`SPEC-011`

## Pre-conditions
- Users are on the Efficient Frontier simulation page.
- At least 2 assets are selected.

## Backend Behavior (Risk Parity API)
1.  **Optimization Safety**: If the covariance matrix is singular or non-positive definite, the optimizer MUST NOT throw an unhandled exception.
2.  **Graceful Failure**: If optimization fails (e.g., convergence issues), the API should return a 400 or 422 error with a clear message: "Risk parity optimization could not converge for the selected assets."
3.  **Sanitized Output**: Ensure all numerical outputs (expected return, volatility) are sanitized for JSON compatibility (no NaN/Inf).

## Frontend Behavior (UI Stability)
1.  **Retry Limitation**: Requests to simulation endpoints MUST NOT retry infinitely. Max 1 retry for 500 errors.
2.  **Error Propagation**: If a simulation fails, the error MUST be caught and displayed to the user via the UI (e.g., error alert in the controls panel).
3.  **Prevent Render Loops**: The simulation lifecycle hook MUST NOT trigger infinite re-renders when an error state is reached.

## Edge Cases
- **Highly Correlated Assets**: Assets with 0.99+ correlation might lead to numerical instability.
- **Assets with 0 Volatility**: Handled by backend EPSILON padding.
- **Network Failure**: Frontend should show "Check your connection" instead of crashing.

## Pass/Fail Criteria
- [ ] Backend returns a non-500 error for impossible optimization tasks.
- [ ] Frontend stops loading state and shows an error message when the API fails.
- [ ] No recursive "Fetch failed" patterns are observed in the console logs during failure.
