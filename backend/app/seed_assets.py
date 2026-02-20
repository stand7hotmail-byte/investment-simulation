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
        # Note: In production, you might want a more sophisticated merge strategy
        db.query(models.AssetData).delete()
        db.commit()
        print("Cleared existing assets.")

        # Expanded asset data
        assets = [
            # Stocks - US
            {"asset_code": "SPY", "name": "S&P 500 ETF (SPY)", "asset_class": "Stock", "expected_return": 0.07, "volatility": 0.16},
            {"asset_code": "QQQ", "name": "Nasdaq 100 ETF (QQQ)", "asset_class": "Stock", "expected_return": 0.08, "volatility": 0.20},
            {"asset_code": "VTI", "name": "Vanguard Total Stock Market ETF (VTI)", "asset_class": "Stock", "expected_return": 0.07, "volatility": 0.16},
            {"asset_code": "VOO", "name": "Vanguard S&P 500 ETF (VOO)", "asset_class": "Stock", "expected_return": 0.07, "volatility": 0.16},
            {"asset_code": "VYM", "name": "Vanguard High Dividend Yield ETF (VYM)", "asset_class": "Stock", "expected_return": 0.06, "volatility": 0.14},
            {"asset_code": "DIA", "name": "SPDR Dow Jones Industrial Average ETF (DIA)", "asset_class": "Stock", "expected_return": 0.06, "volatility": 0.15},
            
            # Stocks - Japan
            {"asset_code": "1306.T", "name": "NEXT FUNDS TOPIX ETF (1306)", "asset_class": "Stock", "expected_return": 0.05, "volatility": 0.17},
            {"asset_code": "1321.T", "name": "NEXT FUNDS Nikkei 225 ETF (1321)", "asset_class": "Stock", "expected_return": 0.05, "volatility": 0.18},
            {"asset_code": "2558.T", "name": "MAXIS S&P 500 ETF (2558)", "asset_class": "Stock", "expected_return": 0.07, "volatility": 0.16},
            {"asset_code": "1557.T", "name": "SPDR S&P 500 ETF (1557)", "asset_class": "Stock", "expected_return": 0.07, "volatility": 0.16},
            
            # Bonds
            {"asset_code": "BND", "name": "Vanguard Total Bond Market ETF (BND)", "asset_class": "Bond", "expected_return": 0.03, "volatility": 0.05},
            {"asset_code": "AGG", "name": "iShares Core U.S. Aggregate Bond ETF (AGG)", "asset_class": "Bond", "expected_return": 0.03, "volatility": 0.05},
            {"asset_code": "TLT", "name": "iShares 20+ Year Treasury Bond ETF (TLT)", "asset_class": "Bond", "expected_return": 0.04, "volatility": 0.12},
            {"asset_code": "2510.T", "name": "NEXT FUNDS Japan Govt Bond ETF (2510)", "asset_class": "Bond", "expected_return": 0.01, "volatility": 0.03},
            {"asset_code": "2511.T", "name": "NEXT FUNDS Foreign Govt Bond ETF (2511)", "asset_class": "Bond", "expected_return": 0.02, "volatility": 0.06},
            
            # Commodities
            {"asset_code": "GLD", "name": "SPDR Gold Shares (GLD)", "asset_class": "Commodity", "expected_return": 0.04, "volatility": 0.15},
            {"asset_code": "SLV", "name": "iShares Silver Trust (SLV)", "asset_class": "Commodity", "expected_return": 0.05, "volatility": 0.25},
            {"asset_code": "DBC", "name": "Invesco DB Commodity Index ETF (DBC)", "asset_class": "Commodity", "expected_return": 0.04, "volatility": 0.18},
            
            # REITs
            {"asset_code": "VNQ", "name": "Vanguard Real Estate ETF (VNQ)", "asset_class": "REIT", "expected_return": 0.06, "volatility": 0.22},
            {"asset_code": "IYR", "name": "iShares U.S. Real Estate ETF (IYR)", "asset_class": "REIT", "expected_return": 0.06, "volatility": 0.21},
            {"asset_code": "1343.T", "name": "NEXT FUNDS TSE REIT Index ETF (1343)", "asset_class": "REIT", "expected_return": 0.04, "volatility": 0.15},
            {"asset_code": "1555.T", "name": "Listed Index Fund Australian REIT (1555)", "asset_class": "REIT", "expected_return": 0.05, "volatility": 0.18},
            
            # Crypto
            {"asset_code": "BTC-USD", "name": "Bitcoin USD (BTC-USD)", "asset_class": "Crypto", "expected_return": 0.15, "volatility": 0.60},
            {"asset_code": "ETH-USD", "name": "Ethereum USD (ETH-USD)", "asset_class": "Crypto", "expected_return": 0.18, "volatility": 0.70},
        ]

        for asset_data in assets:
            # Set default empty correlation matrix
            if "correlation_matrix" not in asset_data:
                asset_data["correlation_matrix"] = {}
            
            db_asset = models.AssetData(**asset_data)
            db.add(db_asset)
        
        db.commit()
        print(f"Successfully seeded {len(assets)} assets.")
    except Exception as e:
        print(f"Error seeding assets: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_assets()
