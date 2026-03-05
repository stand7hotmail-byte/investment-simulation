---
name: simulation-validator
description: Validates investment simulation results for mathematical correctness and business logic. Use when verifying efficient frontier, risk parity, or Monte Carlo outputs to ensure weights sum to 1.0, risk contributions are balanced, and results are within plausible bounds.
---

# Simulation Validator

This skill provides procedures and scripts to validate investment simulation results.

## Key Checks

- **Weight Summation**: Ensure that all portfolio weights sum exactly to 1.0 (with small floating point tolerance).
- **Risk Parity ERC**: For Risk Parity simulations, verify that the risk contribution from each asset is approximately equal.
- **Efficient Frontier Bounds**: Ensure that the frontier points are monotonically increasing in return for increasing risk (where applicable).
- **Logical Bounds**: Ensure volatilities are positive and returns are within expected historical ranges.

## Usage

1. **Automatic Validation**: Run the provided validation script on simulation output JSON.
2. **Manual Review**: Follow the checklist in [CHECKLIST.md](references/checklist.md).

## Bundled Resources

- `scripts/validate_results.py`: Python script to validate JSON simulation outputs.
- `references/checklist.md`: Comprehensive mathematical validation checklist.
