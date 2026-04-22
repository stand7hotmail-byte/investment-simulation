# Track: Portfolio Management Robustness (2026-04-18)

## Objective
Ensure 100% robustness for portfolio lifecycle operations (CRUD) by eliminating potential 500 errors, enforcing numeric integrity, and validating data relationships.

## Key Files & Context
- `backend/app/schemas.py`: Pydantic models with field validation.
- `backend/app/crud.py`: Database logic with atomic transactions and referential integrity checks.
- `backend/app/main.py`: API endpoints with consistent error handling (no 500s).

## Implementation Steps
1. **Schema Validation**: Add validators to ensure weights are valid Decimals and sum to 1.0.
2. **Referential Integrity**: Update `crud.create_portfolio` to verify each `asset_code` exists before saving.
3. **Consistent Error Handling**: Replace all catch-all 500 returns in `main.py` with 400 Bad Request and detailed logs.
4. **Numeric Accuracy**: Ensure `Decimal` precision is maintained during sanitization (avoiding unnecessary float coercion).

## Verification & Testing
1. **Unit Tests**: Update `backend/tests/test_portfolio_robustness.py` to cover weight sum and invalid asset codes.
2. **Adversarial Review**: Trigger Round 2 of the Adversary review until a PASS verdict is achieved.
