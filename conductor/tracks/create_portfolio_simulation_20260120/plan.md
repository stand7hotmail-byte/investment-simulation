# Implementation Plan: Portfolio Creation, Management, and Basic Simulation

This plan outlines the steps to implement the core functionality for users to create, manage, and run basic accumulation simulations on their investment portfolios.

## Phase 1: Database Schema and API Endpoints

This phase focuses on setting up the necessary database tables and exposing API endpoints for portfolio creation, storage, and retrieval.

- [x] **Task: Implement Portfolio Table Schema in Alembic Migration** fa6409f
    - [ ] Write a failing test for `portfolios` table existence.
    - [ ] Create Alembic migration script for `portfolios` table based on `tech-stack.md` (id, user_id, name, description, is_current, created_at, updated_at).
    - [ ] Apply migration.
- [x] **Task: Implement Portfolio Allocations Table Schema in Alembic Migration** 28b138a
    - [ ] Write a failing test for `portfolio_allocations` table existence.
    - [ ] Create Alembic migration script for `portfolio_allocations` table (id, portfolio_id, asset_code, weight, created_at).
    - [ ] Apply migration.
- [x] **Task: Create FastAPI Router for Portfolio CRUD Operations**
    - [x] Write failing tests for GET /api/portfolios (get all user portfolios).
    - [x] Implement GET /api/portfolios endpoint.
    - [x] Write failing tests for POST /api/portfolios (create new portfolio).
    - [x] Implement POST /api/portfolios endpoint.
    - [x] Write failing tests for GET /api/portfolios/{id} (get single portfolio).
    - [x] Implement GET /api/portfolios/{id} endpoint.
    - [x] Write failing tests for PUT /api/portfolios/{id} (update portfolio).
    - [x] Implement PUT /api/portfolios/{id} endpoint.
    - [x] Write failing tests for DELETE /api/portfolios/{id} (delete portfolio).
    - [x] Implement DELETE /api/portfolios/{id} endpoint.
- [ ] **Task: Create FastAPI Router for Asset Allocations**
    - [ ] Write failing tests for GET /api/portfolios/{id}/allocations (get allocations for portfolio).
    - [ ] Implement GET /api/portfolios/{id}/allocations endpoint.
    - [ ] Write failing tests for POST /api/portfolios/{id}/allocations (set allocations for portfolio).
    - [ ] Implement POST /api/portfolios/{id}/allocations endpoint.
- [ ] **Task: Conductor - User Manual Verification 'Database Schema and API Endpoints' (Protocol in workflow.md)**

## Phase 2: Frontend Portfolio Management UI

This phase focuses on building the user interface for creating, viewing, and editing portfolios.

- [ ] **Task: Implement Portfolio List View**
    - [ ] Write failing tests for displaying a list of portfolios.
    - [ ] Create Next.js page to fetch and display user's portfolios using TanStack Query.
    - [ ] Add basic UI for each portfolio (name, description, view/edit/delete buttons).
- [ ] **Task: Implement Portfolio Creation Form**
    - [ ] Write failing tests for portfolio creation form submission.
    - [ ] Create a form component using React Hook Form and Zod for validation.
    - [ ] Implement asset selection and weight allocation UI (dropdowns for assets, input fields for weights).
    - [ ] Ensure total weights sum to 100%.
    - [ ] Integrate with the backend POST /api/portfolios endpoint.
- [ ] **Task: Implement Portfolio Edit Form**
    - [ ] Write failing tests for portfolio edit form submission.
    - [ ] Reuse the portfolio creation form component, pre-filling with existing portfolio data.
    - [ ] Integrate with the backend PUT /api/portfolios/{id} endpoint.
- [ ] **Task: Implement Delete Portfolio Functionality**
    - [ ] Write failing tests for portfolio deletion.
    - [ ] Add a confirmation dialog for deleting portfolios.
    - [ ] Integrate with the backend DELETE /api/portfolios/{id} endpoint.
- [ ] **Task: Conductor - User Manual Verification 'Frontend Portfolio Management UI' (Protocol in workflow.md)**

## Phase 3: Basic Accumulation Simulation

This phase focuses on developing the simulation logic in the backend and integrating it with the frontend to display results.

- [ ] **Task: Implement Basic Accumulation Simulation Logic (Backend)**
    - [ ] Write failing unit tests for the simulation logic (e.g., test with fixed returns/volatility).
    - [ ] Develop Python function to calculate projected future value based on initial investment, monthly contribution, period, and portfolio's aggregated expected return/volatility.
- [ ] **Task: Create FastAPI Endpoint for Basic Simulation**
    - [ ] Write failing tests for POST /api/simulate/basic-accumulation endpoint.
    - [ ] Implement POST /api/simulate/basic-accumulation endpoint to receive parameters, call simulation logic, and return results.
- [ ] **Task: Implement Simulation Input Form (Frontend)**
    - [ ] Write failing tests for simulation input form submission.
    - [ ] Create a form component with inputs for initial investment, monthly contribution, and investment period.
    - [ ] Add a dropdown to select a saved portfolio.
    - [ ] Integrate with the backend simulation endpoint.
- [ ] **Task: Display Simulation Results (Frontend)**
    - [ ] Write failing tests for displaying simulation results.
    - [ ] Create a component to display the projected final value and potentially a simple line chart (e.g., using Recharts for simplicity) showing growth over time.
- [ ] **Task: Conductor - User Manual Verification 'Basic Accumulation Simulation' (Protocol in workflow.md)**
