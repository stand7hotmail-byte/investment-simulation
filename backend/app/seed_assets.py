import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app import models

def seed_assets():
    db = SessionLocal()
    try:
        # Clear existing assets to avoid duplicates when re-seeding
        db.query(models.AssetData).delete()
        db.commit()
        print("Cleared existing assets.")

        # Initial asset data
        assets = [
            {
                "asset_code": "SPY",
                "name": "S&P 500 ETF (SPY)",
                "asset_class": "Stock",
                "expected_return": 0.0700,
                "volatility": 0.1600,
                "correlation_matrix": {"SPY": 1.0, "QQQ": 0.9, "BND": -0.1, "GLD": 0.05, "VNQ": 0.7}
            },
            {
                "asset_code": "QQQ",
                "name": "Nasdaq 100 ETF (QQQ)",
                "asset_class": "Stock",
                "expected_return": 0.0800,
                "volatility": 0.2000,
                "correlation_matrix": {"SPY": 0.9, "QQQ": 1.0, "BND": -0.2, "GLD": 0.03, "VNQ": 0.6}
            },
            {
                "asset_code": "BND",
                "name": "Vanguard Total Bond Market Index Fund ETF (BND)",
                "asset_class": "Bond",
                "expected_return": 0.0300,
                "volatility": 0.0500,
                "correlation_matrix": {"SPY": -0.1, "QQQ": -0.2, "BND": 1.0, "GLD": 0.1, "VNQ": 0.2}
            },
            {
                "asset_code": "GLD",
                "name": "SPDR Gold Shares (GLD)",
                "asset_class": "Commodity",
                "expected_return": 0.0400,
                "volatility": 0.1500,
                "correlation_matrix": {"SPY": 0.05, "QQQ": 0.03, "BND": 0.1, "GLD": 1.0, "VNQ": 0.15}
            },
            {
                "asset_code": "VNQ",
                "name": "Vanguard Real Estate Index Fund ETF (VNQ)",
                "asset_class": "REIT",
                "expected_return": 0.0600,
                "volatility": 0.2200,
                "correlation_matrix": {"SPY": 0.7, "QQQ": 0.6, "BND": 0.2, "GLD": 0.15, "VNQ": 1.0}
            }
        ]

        for asset_data in assets:
            db_asset = db.query(models.AssetData).filter(models.AssetData.asset_code == asset_data["asset_code"]).first()
            if db_asset:
                # Update existing asset
                for key, value in asset_data.items():
                    setattr(db_asset, key, value)
            else:
                # Create new asset
                db_asset = models.AssetData(**asset_data)
                db.add(db_asset)
        
        db.commit()
        print("Successfully seeded assets.")
    except Exception as e:
        print(f"Error seeding assets: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_assets()
