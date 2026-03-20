import sys
import os
import time
from datetime import datetime, timedelta, UTC

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app import models
from app.data_sources.yahoo_finance import fetch_historical_data
from app.data.precomputed_assets import PRECOMPUTED_DATA

def seed_assets():
    """
    Seeds the database with asset master data and historical prices.
    Prioritizes precomputed statistics for reliability.
    """
    db = SessionLocal()
    try:
        # 1. Master Data Seeding (Force Overwrite from precomputed data)
        print(f"Seeding master data for {len(PRECOMPUTED_DATA)} assets...")
        for asset_info in PRECOMPUTED_DATA:
            existing_asset = db.query(models.AssetData).filter(models.AssetData.asset_code == asset_info["asset_code"]).first()
            if existing_asset:
                print(f"Updating {asset_info['asset_code']}: Ret={asset_info['expected_return']:.4f}, Vol={asset_info['volatility']:.4f}")
                existing_asset.name = asset_info["name"]
                existing_asset.asset_class = asset_info["asset_class"]
                existing_asset.expected_return = asset_info["expected_return"]
                existing_asset.volatility = asset_info["volatility"]
                existing_asset.correlation_matrix = asset_info["correlation_matrix"]
            else:
                print(f"Adding new asset {asset_info['asset_code']}")
                db_asset = models.AssetData(**asset_info)
                db.add(db_asset)
        
        db.commit()
        print("Master data sync completed.")

        # 2. Optional Historical Data Sync (Lightweight background task)
        # Fetch last 5 years for visualization purposes.
        assets = db.query(models.AssetData).all()
        for asset in assets:
            # Skip if we already have a decent amount of history
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
                print(f"Skipping history for {asset.asset_code} due to error: {ex}")
            
            # Politeness delay
            time.sleep(0.5)

        print("Asset seeding process complete.")

    except Exception as e:
        print(f"Critical error during seed_assets: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_assets()
