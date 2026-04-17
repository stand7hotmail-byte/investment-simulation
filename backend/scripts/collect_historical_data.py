import sys
import os
import asyncio
from datetime import datetime, timedelta, UTC

# Add parent directory to path to allow importing modules from backend.app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import get_session_local
from app.models import AssetData
from app.data_sources.yahoo_finance import fetch_historical_data

async def collect_historical_data():
    """
    Collects historical price data for all assets in the AssetData table
    and updates their historical_prices column.
    """
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        assets = db.query(AssetData).all()
        print(f"Found {len(assets)} assets to process.")

        for asset in assets:
            print(f"Collecting data for {asset.name} ({asset.asset_code})...")
            # Determine start and end dates based on the track's requirements
            # End date is today, start date is 20 years ago (or as far as possible)
            end_date = datetime.now(UTC)
            start_date = end_date - timedelta(days=365 * 20)

            historical_data = fetch_historical_data(
                asset.asset_code,
                start_date=start_date.strftime("%Y-%m-%d"),
                end_date=end_date.strftime("%Y-%m-%d")
            )
            
            if historical_data:
                # Ensure data is sorted by date ascending before storing
                historical_data.sort(key=lambda x: x['date'])
                asset.historical_prices = historical_data
                db.add(asset)
                print(f"Successfully collected and updated historical data for {asset.asset_code}.")
            else:
                print(f"No historical data found or error for {asset.asset_code}.")
        
        db.commit()
        print("Historical data collection complete for all assets.")

    except Exception as e:
        db.rollback()
        print(f"An error occurred during historical data collection: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # This script is meant to be run periodically (e.g., monthly via cron job)
    # For initial run or testing, execute it directly
    asyncio.run(collect_historical_data())
