---
name: financial-logic-validator
description: Validates investment simulation results for mathematical correctness and business logic. Use when verifying efficient frontier, risk parity, or Monte Carlo outputs to ensure weights sum to 1.0, risk contributions are balanced, and results are within plausible bounds.
---

# Financial Logic Validator

This skill provides a systematic workflow for validating financial calculation results within the Investment Simulation App.

## Validation Protocol

When asked to validate financial logic or simulation results, follow these steps:

### 1. Fundamental Constraint Check
- **Weights Sum:** Verify that asset weights sum exactly to 1.0 (or 100%).
- **Non-negativity:** Unless short-selling is explicitly enabled, all weights must be ≥ 0.
- **Data Integrity:** Ensure no `NaN`, `Infinity`, or null values exist in the output arrays.

### 2. Efficient Frontier Validation
- **Monotonicity:** Expected return should generally increase as volatility increases along the frontier.
- **Plausibility:** Returns and volatilities should be within reasonable historical bounds (e.g., return between -20% and +100%, volatility > 0).
- **Optimal Points:**
    - **Max Sharpe Ratio:** Should be the point where (Return - RiskFreeRate) / Volatility is maximized.
    - **Minimum Variance:** Should be the point with the absolute lowest volatility.

### 3. Risk Parity Validation
- **Risk Contributions:** Each asset's risk contribution should be approximately equal (1/N).
- **Formula Check:** $\text{RC}_i = w_i \frac{(\Sigma w)_i}{\sqrt{w^T \Sigma w}}$
- **Convergence:** Check if the optimization reached the required tolerance ($10^{-6}$ or better).

### 4. Monte Carlo Validation
- **Statistical Soundness:** Final values should follow a log-normal distribution pattern.
- **Confidence Intervals:** 95% interval should contain the mean/median in a plausible relative position.
- **Path Consistency:** Individual paths should not show impossible jumps (e.g., +1000% in a day).

## Automation Scripts

Use the following internal scripts for verification:

- `scripts/validate_mvo.py`: Runs a series of mathematical checks on Mean-Variance Optimization outputs.
- `scripts/check_risk_parity.py`: Verifies equal risk contribution for a given covariance matrix and weights.

## Reference Material

See [financial_formulas.md](references/financial_formulas.md) for the exact mathematical definitions used in this project.
