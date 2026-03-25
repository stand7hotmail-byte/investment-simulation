import sys
import os
import time
from datetime import datetime, timedelta, UTC

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app import models
from app.data_sources.yahoo_finance import fetch_historical_data, fetch_dividend_data
from app.data.precomputed_assets import PRECOMPUTED_DATA

def seed_affiliates(db):
    """
    Seeds the database with affiliate broker data.
    """
    affiliates = [
        # JP Region
        {
            "name": "SBI証券",
            "region": "JP",
            "description": ["国内株式手数料0円", "Vポイント貯まる", "米国株・ETFも充実"],
            "priority": 10,
            "affiliate_url": "https://www.sbisec.co.jp/",
            "cta_text": "口座開設はこちら"
        },
        {
            "name": "楽天証券",
            "region": "JP",
            "description": ["楽天ポイントで投資可能", "使いやすいアプリ「iSPEED」", "新NISA対応も万全"],
            "priority": 5,
            "affiliate_url": "https://www.rakuten-sec.co.jp/",
            "cta_text": "口座開設はこちら"
        },
        # GLOBAL Region
        {
            "name": "Interactive Brokers",
            "region": "GLOBAL",
            "description": ["Lowest margin rates", "Access to 150+ markets", "Powerful Trader Workstation"],
            "priority": 10,
            "affiliate_url": "https://www.interactivebrokers.com/",
            "cta_text": "Open Account"
        },
        {
            "name": "eToro",
            "region": "GLOBAL",
            "description": ["Social Copy Trading", "0% Commission on Stocks", "Easy-to-use Interface"],
            "priority": 5,
            "affiliate_url": "https://www.etoro.com/",
            "cta_text": "Get Started"
        }
    ]

    print(f"Seeding {len(affiliates)} affiliate brokers...")
    for aff_data in affiliates:
        existing_aff = db.query(models.AffiliateBroker).filter(
            models.AffiliateBroker.name == aff_data["name"],
            models.AffiliateBroker.region == aff_data["region"]
        ).first()

        if existing_aff:
            print(f"Updating affiliate {aff_data['name']} ({aff_data['region']})")
            for key, value in aff_data.items():
                setattr(existing_aff, key, value)
        else:
            print(f"Adding new affiliate {aff_data['name']} ({aff_data['region']})")
            db_aff = models.AffiliateBroker(**aff_data)
            db.add(db_aff)
    
    db.commit()
    print("Affiliate data sync completed.")

def seed_assets():
    """
    Seeds the database with asset master data and historical prices.
    Prioritizes precomputed statistics for reliability.
    """
    # Ensure tables exist
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 0. Affiliate Data Seeding
        seed_affiliates(db)

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

        # 2. Optional Historical & Dividend Data Sync (Lightweight background task)
        # Fetch last 25 years to cover historical stress tests (Lehman, Dot-com) and dividends.
        assets = db.query(models.AssetData).all()
        for asset in assets:
            # Check if we need to sync history or dividends
            needs_history = not asset.historical_prices or len(asset.historical_prices) < 6000
            needs_dividends = not asset.dividend_history

            if not needs_history and not needs_dividends:
                continue

            print(f"Syncing data for {asset.asset_code}...")

            # Sync History if needed
            if needs_history:
                print(f"  Fetching long-term history (for stress tests)...")
                end_date = datetime.now(UTC)
                start_date = end_date - timedelta(days=365 * 25)
                try:
                    historical_data = fetch_historical_data(
                        asset.asset_code,
                        start_date=start_date.strftime("%Y-%m-%d"),
                        end_date=end_date.strftime("%Y-%m-%d")
                    )
                    if historical_data:
                        historical_data.sort(key=lambda x: x['date'])
                        asset.historical_prices = historical_data
                        print(f"  Updated history.")
                except Exception as ex:
                    print(f"  Skipping history due to error: {ex}")

            # Sync Dividends if needed
            if needs_dividends:
                print(f"  Fetching dividend history...")
                try:
                    div_data = fetch_dividend_data(asset.asset_code)
                    if div_data:
                        asset.dividend_history = div_data

                        # Calculate a rough dividend yield based on last 12 months
                        one_year_ago = (datetime.now(UTC) - timedelta(days=365)).strftime("%Y-%m-%d")
                        recent_divs = sum(d['amount'] for d in div_data if d['date'] >= one_year_ago)

                        # Get current price
                        if asset.historical_prices:
                            current_price = float(asset.historical_prices[-1]['price'])
                            if current_price > 0:
                                asset.dividend_yield = recent_divs / current_price
                                print(f"  Updated dividends & yield ({asset.dividend_yield:.2%})")
                except Exception as ex:
                    print(f"  Skipping dividends due to error: {ex}")

            db.add(asset)
            db.commit()
            time.sleep(0.5)

        print("Asset seeding process complete.")

    except Exception as e:
        print(f"Critical error during seed_assets: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_assets()
