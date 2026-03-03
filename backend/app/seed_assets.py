import sys
import os
import time
import asyncio
from datetime import datetime, timedelta, UTC

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app import models
from app.data_sources.yahoo_finance import fetch_historical_data

def seed_assets():
    db = SessionLocal()
    try:
        # 1. Master Data Seeding (Upsert basic info)
        assets_list = [
            {"asset_code": "SPY", "name": "S&P 500 ETF (SPY)", "asset_class": "Stock", "expected_return": 0.07, "volatility": 0.16},
            {"asset_code": "QQQ", "name": "Nasdaq 100 ETF (QQQ)", "asset_class": "Stock", "expected_return": 0.08, "volatility": 0.20},
            {"asset_code": "VTI", "name": "Vanguard Total Stock Market ETF (VTI)", "asset_class": "Stock", "expected_return": 0.07, "volatility": 0.16},
            {"asset_code": "VOO", "name": "Vanguard S&P 500 ETF (VOO)", "asset_class": "Stock", "expected_return": 0.07, "volatility": 0.16},
            {"asset_code": "VYM", "name": "Vanguard High Dividend Yield ETF (VYM)", "asset_class": "Stock", "expected_return": 0.06, "volatility": 0.14},
            {"asset_code": "DIA", "name": "SPDR Dow Jones Industrial Average ETF (DIA)", "asset_class": "Stock", "expected_return": 0.06, "volatility": 0.15},
            {"asset_code": "1306.T", "name": "NEXT FUNDS TOPIX ETF (1306)", "asset_class": "Stock", "expected_return": 0.05, "volatility": 0.17},
            {"asset_code": "1321.T", "name": "NEXT FUNDS Nikkei 225 ETF (1321)", "asset_class": "Stock", "expected_return": 0.05, "volatility": 0.18},
            {"asset_code": "2558.T", "name": "MAXIS S&P 500 ETF (2558)", "asset_class": "Stock", "expected_return": 0.07, "volatility": 0.16},
            {"asset_code": "1557.T", "name": "SPDR S&P 500 ETF (1557)", "asset_class": "Stock", "expected_return": 0.07, "volatility": 0.16},
            {"asset_code": "BND", "name": "Vanguard Total Bond Market ETF (BND)", "asset_class": "Bond", "expected_return": 0.03, "volatility": 0.05},
            {"asset_code": "AGG", "name": "iShares Core U.S. Aggregate Bond ETF (AGG)", "asset_class": "Bond", "expected_return": 0.03, "volatility": 0.05},
            {"asset_code": "TLT", "name": "iShares 20+ Year Treasury Bond ETF (TLT)", "asset_class": "Bond", "expected_return": 0.04, "volatility": 0.12},
            {"asset_code": "2510.T", "name": "NEXT FUNDS Japan Govt Bond ETF (2510)", "asset_class": "Bond", "expected_return": 0.01, "volatility": 0.03},
            {"asset_code": "2511.T", "name": "NEXT FUNDS Foreign Govt Bond ETF (2511)", "asset_class": "Bond", "expected_return": 0.02, "volatility": 0.06},
            {"asset_code": "GLD", "name": "SPDR Gold Shares (GLD)", "asset_class": "Commodity", "expected_return": 0.04, "volatility": 0.15},
            {"asset_code": "SLV", "name": "iShares Silver Trust (SLV)", "asset_class": "Commodity", "expected_return": 0.05, "volatility": 0.25},
            {"asset_code": "DBC", "name": "Invesco DB Commodity Index ETF (DBC)", "asset_class": "Commodity", "expected_return": 0.04, "volatility": 0.18},
            {"asset_code": "VNQ", "name": "Vanguard Real Estate ETF (VNQ)", "asset_class": "REIT", "expected_return": 0.06, "volatility": 0.22},
            {"asset_code": "IYR", "name": "iShares U.S. Real Estate ETF (IYR)", "asset_class": "REIT", "expected_return": 0.06, "volatility": 0.21},
            {"asset_code": "1343.T", "name": "NEXT FUNDS TSE REIT Index ETF (1343)", "asset_class": "REIT", "expected_return": 0.04, "volatility": 0.15},
            {"asset_code": "1555.T", "name": "Listed Index Fund Australian REIT (1555)", "asset_class": "REIT", "expected_return": 0.05, "volatility": 0.18},
            {"asset_code": "BTC-USD", "name": "Bitcoin USD (BTC-USD)", "asset_class": "Crypto", "expected_return": 0.15, "volatility": 0.60},
            {"asset_code": "ETH-USD", "name": "Ethereum USD (ETH-USD)", "asset_class": "Crypto", "expected_return": 0.18, "volatility": 0.70},
        ]

        for asset_data in assets_list:
            existing_asset = db.query(models.AssetData).filter(models.AssetData.asset_code == asset_data["asset_code"]).first()
            if existing_asset:
                existing_asset.name = asset_data["name"]
                existing_asset.asset_class = asset_data["asset_class"]
                existing_asset.expected_return = asset_data["expected_return"]
                existing_asset.volatility = asset_data["volatility"]
            else:
                db_asset = models.AssetData(**asset_data)
                db.add(db_asset)
        
        db.commit()
        print(f"Basic master data seeded for {len(assets_list)} assets.")

        # 2. Historical Data Sync (Robust with retries)
        assets = db.query(models.AssetData).all()
        for asset in assets:
            if asset.historical_prices and len(asset.historical_prices) > 100:
                print(f"Skipping {asset.asset_code} (already has {len(asset.historical_prices)} data points).")
                continue

            print(f"Fetching data for {asset.asset_code}...")
            end_date = datetime.now(UTC)
            start_date = end_date - timedelta(days=365 * 20)
            
            success = False
            for attempt in range(3): # Try up to 3 times
                try:
                    historical_data = fetch_historical_data(
                        asset.asset_code,
                        start_date=start_date.strftime("%Y-%m-%d"),
                        end_date=end_date.strftime("%Y-%m-%d")
                    )
                    
                    if historical_data:
                        historical_data.sort(key=lambda x: x['date'])
                        asset.historical_prices = historical_data
                        db.add(asset)
                        db.commit() # Save progress for this asset
                        print(f"Successfully updated {asset.asset_code} with {len(historical_data)} points.")
                        success = True
                        break
                    else:
                        print(f"No data returned for {asset.asset_code} (Attempt {attempt+1}/3).")
                except Exception as ex:
                    print(f"Error fetching {asset.asset_code}: {ex} (Attempt {attempt+1}/3).")
                
                time.sleep(2) # Backoff before retry
            
            if not success:
                print(f"Failed to update historical data for {asset.asset_code} after retries.")
            
            time.sleep(1) # Grace period between assets to avoid rate limits

        print("Historical data sync completed.")

    except Exception as e:
        print(f"Critical error during seed_assets: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_assets()
