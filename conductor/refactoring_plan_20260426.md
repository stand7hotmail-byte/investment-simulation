# Refactoring Plan: Project-Wide Readability & Structural Improvement

## Objective
Improve code readability, maintainability, and architectural structure across both backend and frontend. The primary focus is decomposing the bloated `main.py` in the backend and modularizing large components/logic in the frontend.

## Proposed Changes

### 1. Backend: Router Refactoring
Split `backend/app/main.py` into specialized routers to follow FastAPI best practices.

- **New Directory**: `backend/app/routers/`
- **Asset Router (`routers/assets.py`)**:
    - `GET /api/assets`
    - `GET /api/asset-classes`
    - `GET /api/assets/{asset_code}`
    - `GET /api/assets/{asset_code}/historical-data`
- **Portfolio Router (`routers/portfolios.py`)**:
    - `GET /api/portfolios`
    - `POST /api/portfolios`
    - `GET /api/portfolios/{portfolio_id}`
    - `PUT /api/portfolios/{portfolio_id}`
    - `DELETE /api/portfolios/{portfolio_id}`
- **Simulation Router (`routers/simulation.py`)**:
    - `POST /api/simulate/basic-accumulation`
    - `POST /api/simulate/custom-portfolio`
    - `POST /api/simulation-results`
    - `GET /api/simulation-results/{result_id}`
    - `POST /api/simulate/monte-carlo`
    - `POST /api/simulate/efficient-frontier`
    - `POST /api/simulate/risk-parity`
- **Analytics Router (`routers/analytics.py`)**:
    - `GET /api/analytics/market-summary`
    - `GET /api/analytics/dividend-forecast`
    - `GET /api/analytics/rebalance-suggestions`
    - `GET /api/analytics/stress-test`
    - `GET /api/affiliates`
- **Main Entry Point (`main.py`)**:
    - Keep lifespan, middleware, and router inclusion.

### 2. Backend: Logic & Cleanup
- **CRUD Refactoring**: Consolidate weight normalization and asset validation logic in `crud.py`.
- **Typing**: Add missing type hints and improve consistency between `schemas.py` and `models.py`.
- **Cleanup**: Delete redundant files like `main.py.restored`.

### 3. Frontend: Component & Hook Modularization
- **Page Decomposition**:
    - Split `AccumulationPage` (`app/[lang]/simulation/accumulation/page.tsx`) into sub-components (Form, Results, Chart).
    - Split `EfficientFrontierPage` into sub-components.
- **Shared Constants**: Move shared Plotly layouts and chart colors to a dedicated `lib/constants.ts` or `lib/chart-utils.ts`.
- **API Client**: Refactor `fetchApi` in `api.ts` to be slightly more modular (separate header construction).

### 4. Code Style & Documentation
- Ensure all new functions have docstrings (Python) or JSDoc (TypeScript).
- Standardize error handling messages to use i18n keys where appropriate.

## Verification Plan

### Backend Verification
- Run unit tests: `pytest backend/tests/`
- Verify API docs: Start server and check `/docs` for correct routing.
- Check for regression in numerical stability (NaN/Inf handling).

### Frontend Verification
- Run tests: `npm test`
- Build check: `npm run build`
- Manual verification: Check critical flows (Simulation, Portfolio CRUD) in the UI.

## Alternatives Considered
- **Keeping `main.py` as is**: Not recommended as it has become a "God Object" and is hard to navigate.
- **Using a different directory structure**: Sticking to the standard FastAPI `routers/` pattern as it is idiomatic.
