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
        # 1. Load Precomputed Data
        precomputed_path = os.path.join(os.path.dirname(__file__), 'precomputed_assets.json')
        precomputed_data = []
        if os.path.exists(precomputed_path):
            with open(precomputed_path, 'r', encoding='utf-8') as f:
                precomputed_data = json.load(f)
            print(f"Found precomputed data for {len(precomputed_data)} assets.")
        else:
            print("Precomputed data file not found! Please run precompute_asset_stats.py first.")
            return

        # 2. Upsert Asset Data (Stats & Correlations)
        for asset_info in precomputed_data:
            existing_asset = db.query(models.AssetData).filter(models.AssetData.asset_code == asset_info["asset_code"]).first()
            if existing_asset:
                existing_asset.name = asset_info["name"]
                existing_asset.asset_class = asset_info["asset_class"]
                existing_asset.expected_return = asset_info["expected_return"]
                existing_asset.volatility = asset_info["volatility"]
                existing_asset.correlation_matrix = asset_info["correlation_matrix"]
            else:
                db_asset = models.AssetData(**asset_info)
                db.add(db_asset)
        
        db.commit()
        print(f"Master data (including correlations) seeded for {len(precomputed_data)} assets.")

        # 3. Optional Historical Data Sync (Lightweight)
        # Fetch last 5 years only if data is missing (< 252 points).
        # This supports chart visualization but won't block simulation accuracy.
        assets = db.query(models.AssetData).all()
        for asset in assets:
            if asset.historical_prices and len(asset.historical_prices) > 252:
                continue

            print(f"Fetching history for {asset.asset_code} (for charts)...")
            end_date = datetime.now(UTC)
            start_date = end_date - timedelta(days=365 * 5)
            
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
                    db.commit()
                    print(f"Updated {asset.asset_code} history.")
            except Exception as ex:
                print(f"Skipping history for {asset.asset_code}: {ex}")
            
            time.sleep(0.5)

        print("Asset seeding process complete.")


    except Exception as e:
        print(f"Critical error during seed_assets: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_assets()
