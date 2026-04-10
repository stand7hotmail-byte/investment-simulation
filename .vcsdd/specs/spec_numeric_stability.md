# SPEC-003: JSON Numeric Stability (NaN/Inf Handling)

## Description
Ensures all API responses are JSON-compliant by sanitizing float values that could be `NaN` or `Infinity`.

## Pre-conditions
- Data retrieved from calculation engine or database may contain invalid float literals.

## Inputs
- Results from Monte Carlo simulation or Asset Data queries.

## Outputs/Effects
- API response body.

## Invariants (Safety Rules)
1. **No Invalid Floats**: Response JSON must NOT contain `NaN`, `Infinity`, or `-Infinity`.
2. **Fallback to Default**: Any invalid float must be converted to a safe default (e.g., `0.0` or `null`) before serialization.

## Edge Cases
- Asset returns of -100% or +Inf%: Must be capped or sanitized.
