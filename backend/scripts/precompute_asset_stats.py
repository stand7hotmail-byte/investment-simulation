import sys
import os
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, UTC
import yfinance as yf
from scipy.stats import gmean

# 資産リスト
ASSETS_LIST = [
    {"asset_code": "SPY", "name": "S&P 500 ETF (SPY)", "asset_class": "Stock", "default_ret": 0.07, "default_vol": 0.16},
    {"asset_code": "QQQ", "name": "Nasdaq 100 ETF (QQQ)", "asset_class": "Stock", "default_ret": 0.08, "default_vol": 0.20},
    {"asset_code": "VTI", "name": "Vanguard Total Stock Market ETF (VTI)", "asset_class": "Stock", "default_ret": 0.07, "default_vol": 0.16},
    {"asset_code": "VOO", "name": "Vanguard S&P 500 ETF (VOO)", "asset_class": "Stock", "default_ret": 0.07, "default_vol": 0.16},
    {"asset_code": "VYM", "name": "Vanguard High Dividend Yield ETF (VYM)", "asset_class": "Stock", "default_ret": 0.06, "default_vol": 0.14},
    {"asset_code": "DIA", "name": "SPDR Dow Jones Industrial Average ETF (DIA)", "asset_class": "Stock", "default_ret": 0.06, "default_vol": 0.15},
    {"asset_code": "1306.T", "name": "NEXT FUNDS TOPIX ETF (1306)", "asset_class": "Stock", "default_ret": 0.05, "default_vol": 0.17},
    {"asset_code": "1321.T", "name": "NEXT FUNDS Nikkei 225 ETF (1321)", "asset_class": "Stock", "default_ret": 0.05, "default_vol": 0.18},
    {"asset_code": "2558.T", "name": "MAXIS S&P 500 ETF (2558)", "asset_class": "Stock", "default_ret": 0.07, "default_vol": 0.16},
    {"asset_code": "1557.T", "name": "SPDR S&P 500 ETF (1557)", "asset_class": "Stock", "default_ret": 0.07, "default_vol": 0.16},
    {"asset_code": "BND", "name": "Vanguard Total Bond Market ETF (BND)", "asset_class": "Bond", "default_ret": 0.03, "default_vol": 0.05},
    {"asset_code": "AGG", "name": "iShares Core U.S. Aggregate Bond ETF (AGG)", "asset_class": "Bond", "default_ret": 0.03, "default_vol": 0.05},
    {"asset_code": "TLT", "name": "iShares 20+ Year Treasury Bond ETF (TLT)", "asset_class": "Bond", "default_ret": 0.04, "default_vol": 0.12},
    {"asset_code": "2510.T", "name": "NEXT FUNDS Japan Govt Bond ETF (2510)", "asset_class": "Bond", "default_ret": 0.01, "default_vol": 0.03},
    {"asset_code": "2511.T", "name": "NEXT FUNDS Foreign Govt Bond ETF (2511)", "asset_class": "Bond", "default_ret": 0.02, "default_vol": 0.06},
    {"asset_code": "GLD", "name": "SPDR Gold Shares (GLD)", "asset_class": "Commodity", "default_ret": 0.04, "default_vol": 0.15},
    {"asset_code": "SLV", "name": "iShares Silver Trust (SLV)", "asset_class": "Commodity", "default_ret": 0.05, "default_vol": 0.25},
    {"asset_code": "DBC", "name": "Invesco DB Commodity Index ETF (DBC)", "asset_class": "Commodity", "default_ret": 0.04, "default_vol": 0.18},
    {"asset_code": "VNQ", "name": "Vanguard Real Estate ETF (VNQ)", "asset_class": "REIT", "default_ret": 0.06, "default_vol": 0.22},
    {"asset_code": "IYR", "name": "iShares U.S. Real Estate ETF (IYR)", "asset_class": "REIT", "default_ret": 0.06, "default_vol": 0.21},
    {"asset_code": "1343.T", "name": "NEXT FUNDS TSE REIT Index ETF (1343)", "asset_class": "REIT", "default_ret": 0.04, "default_vol": 0.15},
    {"asset_code": "1555.T", "name": "Listed Index Fund Australian REIT (1555)", "asset_class": "REIT", "default_ret": 0.05, "default_vol": 0.18},
    {"asset_code": "BTC-USD", "name": "Bitcoin USD (BTC-USD)", "asset_class": "Crypto", "default_ret": 0.15, "default_vol": 0.60},
    {"asset_code": "ETH-USD", "name": "Ethereum USD (ETH-USD)", "asset_class": "Crypto", "default_ret": 0.18, "default_vol": 0.70},
]

def precompute():
    print(f"Precomputing stats for {len(ASSETS_LIST)} assets...")
    end_date = datetime.now(UTC)
    start_date = end_date - timedelta(days=365 * 10) # 10 years for stable stats
    
    codes = [a["asset_code"] for a in ASSETS_LIST]
    
    # Download data
    print("Downloading historical data from Yahoo Finance...")
    data = yf.download(codes, start=start_date, end=end_date, auto_adjust=True)['Close']
    
    # Calculate returns
    returns = data.pct_change().dropna(how='all')
    
    results = []
    
    # Calculate correlation matrix for all (using pairwise overlap)
    corr_matrix = returns.corr().to_dict()
    
    for asset in ASSETS_LIST:
        code = asset["asset_code"]
        print(f"Processing {code}...")
        
        asset_rets = returns[code].dropna()
        
        if len(asset_rets) > 252: # At least 1 year of data
            # Geometric mean annual return
            g_mean_daily = gmean(1 + asset_rets)
            ann_ret = float(np.power(g_mean_daily, 252) - 1)
            
            # Annualized volatility
            ann_vol = float(asset_rets.std() * np.sqrt(252))
            
            # Capping for sanity
            ann_ret = max(-0.2, min(0.5, ann_ret))
            ann_vol = max(0.01, min(1.0, ann_vol))
        else:
            print(f"  Insufficient data for {code}, using defaults.")
            ann_ret = asset["default_ret"]
            ann_vol = asset["default_vol"]
            
        # Get correlations for this asset
        asset_corrs = {other_code: float(val) for other_code, val in corr_matrix.get(code, {}).items() if not np.isnan(val)}
        
        results.append({
            "asset_code": code,
            "name": asset["name"],
            "asset_class": asset["asset_class"],
            "expected_return": ann_ret,
            "volatility": ann_vol,
            "correlation_matrix": asset_corrs
        })
        
    output_path = os.path.join(os.path.dirname(__file__), '..', 'app', 'precomputed_assets.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
        
    print(f"Precomputation complete. Saved to {output_path}")

if __name__ == "__main__":
    precompute()
