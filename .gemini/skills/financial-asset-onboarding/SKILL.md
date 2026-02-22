---
name: financial-asset-onboarding
description: Adds new financial assets (ETFs, stocks, crypto, etc.) to the investment simulation platform. Use when the user wants to expand the asset universe, track new tickers, or fetch historical data for specific financial instruments.
---

# Financial Asset Onboarding

## Overview

This skill provides a streamlined workflow for onboarding new assets into the Investment Simulation application. It ensures consistent data entry, proper seeding of the database, and automatic collection of historical price data from Yahoo Finance.

## Workflow

Follow these steps precisely to add new assets:

### 1. Identify Asset Details
Gather the necessary information for each asset:
- **Ticker Symbol:** The Yahoo Finance ticker (e.g., `1306.T`, `BTC-USD`).
- **Name:** A descriptive name for the asset.
- **Asset Class:** One of `Stock`, `Bond`, `Commodity`, `REIT`, or `Crypto`.
- **Reference:** See `references/asset_classes.md` for common tickers and categories.

### 2. Update Seed Data
Use the provided script to append new assets to `backend/app/seed_assets.py`.

```bash
# Example: Adding a new ETF
python .gemini/skills/financial-asset-onboarding/scripts/add_asset.py "VTI" "Vanguard Total Stock Market ETF" "Stock" 0.07 0.16
```

If adding multiple assets, run the script for each one.

### 3. Seed Database
Run the seed script to register the new assets in the database.
**Warning:** This script clears existing assets before re-seeding by default.

```bash
python backend/app/seed_assets.py
```

### 4. Collect Historical Data
Run the historical data collection script. This will fetch up to 20 years of price data for all assets in the database.

```bash
python backend/scripts/collect_historical_data.py
```

### 5. Verify Installation
Run the database inspector or check via the API to ensure the assets are correctly registered and have historical data.

```bash
# Verify assets count
python backend/scripts/db_inspector.py --count-assets
```

## Resources

### scripts/add_asset.py
A Python utility to safely append new asset definitions to the seed file without manual `replace` operations.

### references/asset_classes.md
A guide to supported asset classes and common ticker symbols for quick reference.
