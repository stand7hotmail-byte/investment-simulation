# SPEC-001: Monte Carlo Simulation Behavior

## Description
Runs a Monte Carlo simulation using Geometric Brownian Motion (GBM), accounting for dividend yield and optional reinvestment.

## Pre-conditions
- `initial_investment` must be a non-negative float.
- `volatility` must be a non-negative float.
- `years` must be a positive integer.

## Inputs
- `initial_investment`: Initial portfolio value.
- `monthly_contribution`: Regular monthly additions.
- `expected_return` / `mu`: Annual expected total return.
- `volatility` / `sigma`: Annualized standard deviation of returns.
- `years`: Duration of the simulation.
- `dividend_yield`: Annual dividend rate.

## Outputs/Effects
- Returns a dictionary containing:
  - `percentiles`: Final portfolio values at 10, 25, 50, 75, and 90 percentiles.
  - `prob_loss`: Probability that final value is less than total invested.
  - `history`: Year-by-year trajectory data.

## Invariants (Safety Rules)
1. **No Negative Values**: Portfolio values in `history` and `percentiles` must NEVER be negative, regardless of drift or volatility.
2. **Deterministic Percentiles**: Percentiles must be sorted (p10 <= p25 <= p50 <= p75 <= p90).
3. **Dividend Consistency**: If `dividend_yield` is 0, `cumulative_dividends` in history must be 0.

## Edge Cases
- `volatility = 0`: Should result in a deterministic growth path.
- `years = 0`: Should return initial investment as final value.
- Extremely high volatility: Results must be capped or handled to avoid numerical overflow.
