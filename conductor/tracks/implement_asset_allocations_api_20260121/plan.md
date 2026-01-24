# Implementation Plan: Implement Asset Allocations Management API

This plan outlines the steps to implement the API endpoints for managing asset allocations within a user's investment portfolios.

## Phase 1: Implement Asset Allocation CRUD Operations

- [ ] **Task: Create FastAPI Router for Asset Allocations (GET, PUT, DELETE)**
    - [ ] Add `PortfolioAllocationUpdate` schema in `backend/app/schemas.py`.
    - [ ] Add `get_portfolio_allocations`, `get_portfolio_allocation`, `update_portfolio_allocation`, `delete_portfolio_allocation` functions in `backend/app/crud.py`.
    - [ ] Write failing tests for:
        - `GET /api/portfolios/{portfolio_id}/allocations` (get all allocations for a portfolio).
        - `GET /api/portfolios/{portfolio_id}/allocations/{allocation_id}` (get a single allocation).
        - `PUT /api/portfolios/{portfolio_id}/allocations/{allocation_id}` (update an allocation).
        - `DELETE /api/portfolios/{portfolio_id}/allocations/{allocation_id}` (delete an allocation).
    - [ ] Implement the corresponding endpoints in `backend/app/main.py`.
    - [ ] Rerun all tests to confirm they pass.
- [ ] **Task: Conductor - User Manual Verification 'Asset Allocations Management API' (Protocol in workflow.md)**
