import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app import models

def seed_assets():
    db = SessionLocal()
    try:
        # Initial asset data
        assets = [
            {
                "asset_code": "TOPIX",
                "name": "東証株価指数",
                "asset_class": "Stock",
                "expected_return": 0.0500,
                "volatility": 0.1800,
                "correlation_matrix": {"TOPIX": 1.0, "SP500": 0.70, "MSCI_ACWI": 0.85, "US_10Y": -0.20, "GOLD": 0.10}
            },
            {
                "asset_code": "SP500",
                "name": "S&P 500",
                "asset_class": "Stock",
                "expected_return": 0.0700,
                "volatility": 0.1600,
                "correlation_matrix": {"TOPIX": 0.70, "SP500": 1.0, "MSCI_ACWI": 0.95, "US_10Y": -0.15, "GOLD": 0.05}
            },
            {
                "asset_code": "MSCI_ACWI",
                "name": "MSCI オール・カントリー・ワールド・インデックス",
                "asset_class": "Stock",
                "expected_return": 0.0650,
                "volatility": 0.1700,
                "correlation_matrix": {"TOPIX": 0.85, "SP500": 0.95, "MSCI_ACWI": 1.0, "US_10Y": -0.10, "GOLD": 0.08}
            },
            {
                "asset_code": "US_10Y",
                "name": "米国10年国債",
                "asset_class": "Bond",
                "expected_return": 0.0300,
                "volatility": 0.0500,
                "correlation_matrix": {"TOPIX": -0.20, "SP500": -0.15, "MSCI_ACWI": -0.10, "US_10Y": 1.0, "GOLD": 0.15}
            },
            {
                "asset_code": "GOLD",
                "name": "金 (GOLD)",
                "asset_class": "Commodity",
                "expected_return": 0.0400,
                "volatility": 0.1500,
                "correlation_matrix": {"TOPIX": 0.10, "SP500": 0.05, "MSCI_ACWI": 0.08, "US_10Y": 0.15, "GOLD": 1.0}
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
