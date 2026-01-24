# Specification: Implement Asset Allocations Management API

## Objective

To implement a robust and secure API for managing asset allocations within a user's investment portfolios. This includes endpoints for retrieving all allocations for a given portfolio, adding new allocations, updating existing allocations, and deleting allocations.

## Endpoints

### 1. Get All Portfolio Allocations

- **Endpoint:** `GET /api/portfolios/{portfolio_id}/allocations`
- **Description:** Retrieves all asset allocations for a specific portfolio owned by the authenticated user.
- **Authentication:** Required (User ID from authentication token).
- **Request:**
    - `portfolio_id` (path parameter, UUID): The unique identifier of the portfolio.
- **Response:**
    - `200 OK`: A list of `PortfolioAllocation` objects.
    - `404 Not Found`: If the portfolio does not exist or is not owned by the user.

### 2. Create Portfolio Allocation

- **Endpoint:** `POST /api/portfolios/{portfolio_id}/allocations`
- **Description:** Adds a new asset allocation to a specific portfolio.
- **Authentication:** Required (User ID from authentication token).
- **Request:**
    - `portfolio_id` (path parameter, UUID): The unique identifier of the portfolio.
    - Request Body (`PortfolioAllocationCreate` Pydantic model):
        - `asset_code` (string): The unique code of the asset (e.g., "SPY", "VOO").
        - `weight` (decimal): The allocation weight for the asset in the portfolio (e.g., 0.5 for 50%).
- **Response:**
    - `201 Created`: The newly created `PortfolioAllocation` object.
    - `400 Bad Request`: If the portfolio_id in the path does not match the one in the request body, or if validation fails (e.g., invalid asset_code, weight not between 0 and 1).
    - `404 Not Found`: If the portfolio does not exist or is not owned by the user.

### 3. Update Portfolio Allocation

- **Endpoint:** `PUT /api/portfolios/{portfolio_id}/allocations/{allocation_id}`
- **Description:** Updates an existing asset allocation within a specific portfolio.
- **Authentication:** Required (User ID from authentication token).
- **Request:**
    - `portfolio_id` (path parameter, UUID): The unique identifier of the portfolio.
    - `allocation_id` (path parameter, UUID): The unique identifier of the allocation to update.
    - Request Body (`PortfolioAllocationUpdate` Pydantic model):
        - `asset_code` (string, optional): The unique code of the asset.
        - `weight` (decimal, optional): The allocation weight for the asset.
- **Response:**
    - `200 OK`: The updated `PortfolioAllocation` object.
    - `400 Bad Request`: If validation fails.
    - `404 Not Found`: If the portfolio or allocation does not exist or is not owned by the user.

### 4. Delete Portfolio Allocation

- **Endpoint:** `DELETE /api/portfolios/{portfolio_id}/allocations/{allocation_id}`
- **Description:** Deletes a specific asset allocation from a portfolio.
- **Authentication:** Required (User ID from authentication token).
- **Request:**
    - `portfolio_id` (path parameter, UUID): The unique identifier of the portfolio.
    - `allocation_id` (path parameter, UUID): The unique identifier of the allocation to delete.
- **Response:**
    - `200 OK`: Confirmation message.
    - `404 Not Found`: If the portfolio or allocation does not exist or is not owned by the user.

## Data Models

- **`PortfolioAllocation` (from `schemas.py`):**
    - `id` (UUID)
    - `portfolio_id` (UUID)
    - `asset_code` (string)
    - `weight` (decimal)
    - `created_at` (datetime)
- **`PortfolioAllocationCreate` (from `schemas.py`):**
    - `portfolio_id` (UUID)
    - `asset_code` (string)
    - `weight` (decimal)
- **`PortfolioAllocationUpdate` (new Pydantic model in `schemas.py`):**
    - `asset_code` (string, optional)
    - `weight` (decimal, optional)

## Dependencies

- FastAPI
- SQLAlchemy
- Pydantic
- UUID for identifiers
- Authentication (placeholder `get_current_user_id` will be used for now)

## Validation Rules

- `weight` must be between 0 and 1 (inclusive).
- `asset_code` should be non-empty.
- All UUIDs must be valid.

## Error Handling

- Standard FastAPI HTTPException will be used for error responses (400, 404).

## Considerations

- Need to ensure that operations on allocations respect user ownership of the parent portfolio.
- The sum of weights for a portfolio's allocations should ideally be 1, but this constraint will not be enforced at the API level for now, to allow for partial allocations or portfolios still under construction.
