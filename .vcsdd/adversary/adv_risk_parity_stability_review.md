# Adversarial Review: Risk Parity & UI Stability (SPEC-011)

## Summary
The implementation partially addresses the stability concerns but fails to provide a comprehensive safeguard across all simulation endpoints. While Risk Parity has been hardened with a `try-except` block and local sanitization, the primary Efficient Frontier endpoint remains unprotected, and numerical sanitization is missing for portfolio weights.

## Flaws Found

### 1. Missing Protection on Efficient Frontier Endpoint (FAIL)
The `simulate_efficient_frontier` route in `backend/app/main.py` lacks the `try-except` wrapper that was added to `simulate_risk_parity`. 
- **Impact**: Any numerical failure in `cvxpy` (e.g., singular covariance matrix) will trigger a 500 Internal Server Error instead of the required 400 error.
- **Root Cause**: Inconsistent application of the stability pattern across sibling endpoints.
- **Code Reference**: `backend/app/main.py` L145-154.

### 2. Incomplete Numerical Sanitization (FAIL)
In `simulate_risk_parity`, while `expected_return` and `volatility` are sanitized using `safe_ret` and `safe_vol`, the **weights dictionary** is populated directly from `weights_array` without NaN/Inf checks.
- **Impact**: If the optimizer returns NaNs (possible if the objective function is ill-defined for the inputs), the API will return a 200 OK but with a body containing `NaN`, which is invalid JSON and will crash the frontend JSON parser or Plotly renderer.
- **Code Reference**: `backend/app/main.py` L175-179.

### 3. Vulnerability in `calculate_efficient_frontier` (FAIL)
The `simulation.py` implementation of `calculate_efficient_frontier` assumes `min_var_problem.solve()` always succeeds.
- **Impact**: If `min_return` becomes `None` or `NaN`, the subsequent `np.linspace(min_return, max_return, n_points)` will raise an exception, causing a 500 error because the router doesn't catch it.
- **Code Reference**: `backend/app/simulation.py` L156-158.

### 4. Manual and Repetitive Sanitization Logic (improvement)
The sanitization of `AssetData` (NaN/Inf to 0.0) is manually repeated in `read_assets`, `read_asset`, and simulation routers.
- **Impact**: Higher risk of missing a field or endpoint (which happened with Efficient Frontier).
- **Recommendation**: Use a Pydantic `field_validator` or a global FastAPI middleware for numerical sanitization.

## Missing Scenarios

- **Singular Covariance Matrix**: Assets with perfect correlation or zero volatility (if padding fails) will cause `cvxpy` or `scipy.optimize` to crash. The lack of router-level protection on Efficient Frontier makes this a high-risk scenario.
- **UI Error Feedback**: The frontend hooks propagate errors, but there is no evidence that `SimulationControls` or `EfficientFrontierPage` actually renders the *specific error message* from the backend (e.g., "Risk parity optimization could not converge").

## Security Risks
- **Information Leakage**: While `catch_exceptions_middleware` hides stack traces, the frequent 500 errors on the Efficient Frontier endpoint allow an attacker to probe for numerical weaknesses or resource exhaustion by submitting edge-case asset combinations.

## Verdict
**FAIL**

The implementation does not meet the "Graceful Failure" requirement of `SPEC-011` for the Efficient Frontier endpoint, which is the most complex and error-prone part of the simulation. Numerical sanitization is also incomplete for portfolio weights.

## Action Plan
1.  **Harden All Simulation Routers**: Apply the same `try-except` pattern from `simulate_risk_parity` to `simulate_efficient_frontier`, `simulate_monte_carlo`, and `simulate_custom_portfolio`.
2.  **Centralize Sanitization**: Create a utility function `sanitize_numerical_results` that handles NaN/Inf for returns, volatilities, AND weights.
3.  **Harden Efficient Frontier Logic**: Add checks after `min_var_problem.solve()` to ensure `min_return` is finite before generating the range.
4.  **UI Verification**: Ensure `SimulationControls` displays `anyError.message` to the user.
