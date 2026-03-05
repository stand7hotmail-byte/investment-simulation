---
name: financial-asset-onboarding
description: Adds new financial assets (ETFs, stocks, crypto, etc.) to the investment simulation platform. Use when the user wants to expand the asset universe, track new tickers, or fetch historical data for specific financial instruments.
---

# Financial Asset Onboarding

This skill automates the process of adding new investment assets to the database.

## Workflow

1. **Ticker Verification:** 
   - Check if the ticker symbol exists on Yahoo Finance using `yfinance`.
   - Verify that at least 2 years of historical data is available.

2. **Metadata Generation:**
   - Determine the correct `asset_class` (Stock, Bond, Crypto, Commodity, REIT).
   - Get the full descriptive name of the asset.

3. **Database Insertion:**
   - Update `backend/app/seed_assets.py` with the new ticker and metadata.
   - Run the seed script to populate the `asset_data` table.

4. **Data Synchronization:**
   - Execute `backend/scripts/collect_historical_data.py` to fetch and store historical prices.

## Guardrails

- **Naming Convention:** Use uppercase for tickers (e.g., `SPY`, `BTC-USD`).
- **Currency:** Ensure the asset price is compatible with the app's base calculation logic (mostly USD or JPY based on the ticker suffix).
- **Redundancy Check:** Before adding, check if the `asset_code` already exists in the database using `backend/scripts/db_inspector.py`.

## Commands

- `poetry run python app/seed_assets.py`: Runs the master data sync.
- `poetry run python scripts/collect_historical_data.py`: Fetches time-series data.
