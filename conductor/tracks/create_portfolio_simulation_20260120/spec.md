# Specification for Portfolio Creation, Management, and Basic Simulation

## 1. Introduction

This document outlines the specifications for the initial core functionalities of the investment simulation web application. The primary goal is to enable users to create and save their investment portfolios, and then to run basic accumulation simulations on these portfolios.

## 2. User Stories

### User Story: Portfolio Creation and Saving
**As a** registered user,
**I want to** create a new portfolio by selecting multiple assets and assigning weights,
**So that I can** save my investment strategy for future analysis and simulation.

**Acceptance Criteria:**
*   User can select assets from a predefined list (e.g., from `asset_data` master table).
*   User can assign a weight (percentage) to each selected asset.
*   The sum of all asset weights in a portfolio must be 100%.
*   User can provide a name and optional description for the portfolio.
*   The created portfolio is saved and accessible from their dashboard.

### User Story: Basic Accumulation Simulation
**As a** registered user with a saved portfolio,
**I want to** input initial investment, monthly contribution, and investment period,
**So that I can** see a basic projection of my portfolio's future value.

**Acceptance Criteria:**
*   User can select one of their saved portfolios for simulation.
*   User can input an initial investment amount.
*   User can input a monthly contribution amount.
*   User can specify the investment period in years.
*   The simulation should calculate a projected future value based on the portfolio's expected return and volatility (simplified model).
*   The simulation results should be displayed in a clear and understandable format (e.g., a simple chart or summary table).

## 3. Functional Requirements

### 3.1 Portfolio Management
*   **PFM-001: Create Portfolio:** Allow users to define a new portfolio with a unique name, description, and asset allocations.
*   **PFM-002: Edit Portfolio:** Enable users to modify existing portfolios (name, description, asset allocations).
*   **PFM-003: View Portfolios:** Display a list of all user-created portfolios with key details (name, number of assets, creation date).
*   **PFM-004: Delete Portfolio:** Allow users to remove a portfolio from their saved list.
*   **PFM-005: Asset Selection:** Provide an interface to select assets from the `asset_data` master.
*   **PFM-006: Weight Allocation:** Ensure asset weights add up to 100%.

### 3.2 Basic Simulation
*   **BSS-001: Select Portfolio:** Users can select a saved portfolio as input for the simulation.
*   **BSS-002: Input Parameters:** Users can input initial investment, monthly contribution, and investment years.
*   **BSS-003: Run Simulation:** Execute a simplified accumulation simulation (e.g., using a geometric Brownian motion model with portfolio's aggregated expected return and volatility).
*   **BSS-004: Display Results:** Present simulation results clearly, including final projected value, and possibly a basic trajectory graph.

## 4. Technical Details (High-Level)

*   **Frontend:** Next.js application will provide the user interface for portfolio creation, parameter input, and result display.
*   **Backend:** FastAPI endpoints will handle portfolio CRUD operations and execute the simulation logic.
*   **Database:** PostgreSQL will store user portfolios, asset allocations, and potentially cached simulation results.
*   **Simulation Logic:** Python libraries (NumPy, Pandas, SciPy) will be used for mathematical calculations in the backend.

## 5. User Interface (Conceptual)

### 5.1 Portfolio Creation/Editing Screen
*   Form fields for Portfolio Name, Description.
*   Dynamic list of asset input fields (asset selector dropdown, weight input field).
*   "Add Asset" / "Remove Asset" buttons.
*   Validation message if total weight is not 100%.
*   Save/Cancel buttons.

### 5.2 Simulation Input Screen
*   Dropdown to select a saved portfolio.
*   Input fields for Initial Investment, Monthly Contribution, Investment Period (years).
*   "Run Simulation" button.

### 5.3 Simulation Results Screen
*   Display of key simulation parameters.
*   Projected final value.
*   Simple line chart showing potential growth over time.
