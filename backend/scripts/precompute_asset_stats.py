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
    # 投資信託 (Proxyには米国ETFを使用してyfinanceの分割未調整バグを回避)
    {"asset_code": "EMAXIS-ALC", "proxy_ticker": "ACWI", "name": "eMAXIS Slim 全世界株式(オール・カントリー)", "asset_class": "Stock", "default_ret": 0.06, "default_vol": 0.16},
    {"asset_code": "EMAXIS-SP5", "proxy_ticker": "VOO", "name": "eMAXIS Slim 米国株式(S&P500)", "asset_class": "Stock", "default_ret": 0.07, "default_vol": 0.16},
    {"asset_code": "SBIV-SP5", "proxy_ticker": "VOO", "name": "SBI・V・S&P500インデックス・ファンド", "asset_class": "Stock", "default_ret": 0.07, "default_vol": 0.16},
    {"asset_code": "EMAXIS-JAP", "proxy_ticker": "EWJ", "name": "eMAXIS Slim 国内株式(TOPIX)", "asset_class": "Stock", "default_ret": 0.05, "default_vol": 0.17},

    # 国内ETF (同様にProxyを設定)
    {"asset_code": "1306.T", "proxy_ticker": "EWJ", "name": "NEXT FUNDS TOPIX連動型ETF (1306)", "asset_class": "Stock", "default_ret": 0.05, "default_vol": 0.17},
    {"asset_code": "1321.T", "proxy_ticker": "EWJ", "name": "NEXT FUNDS 日経225連動型ETF (1321)", "asset_class": "Stock", "default_ret": 0.05, "default_vol": 0.18},
    {"asset_code": "1489.T", "proxy_ticker": "DXJ", "name": "NEXT FUNDS 日経平均高配当株50 ETF (1489)", "asset_class": "Stock", "default_ret": 0.05, "default_vol": 0.16},
    {"asset_code": "2558.T", "proxy_ticker": "VOO", "name": "MAXIS 米国株式(S&P500)ETF (2558)", "asset_class": "Stock", "default_ret": 0.07, "default_vol": 0.16},
    {"asset_code": "2621.T", "proxy_ticker": "TLT", "name": "iシェアーズ 米国債20年超 ETF(為替ヘッジあり) (2621)", "asset_class": "Bond", "default_ret": 0.02, "default_vol": 0.15},
    {"asset_code": "2510.T", "proxy_ticker": "IGOV", "name": "NEXT FUNDS Japan Govt Bond ETF (2510)", "asset_class": "Bond", "default_ret": 0.01, "default_vol": 0.03},
    {"asset_code": "2511.T", "proxy_ticker": "BNDX", "name": "NEXT FUNDS Foreign Govt Bond ETF (2511)", "asset_class": "Bond", "default_ret": 0.02, "default_vol": 0.06},
    {"asset_code": "1343.T", "proxy_ticker": "VNQ", "name": "NEXT FUNDS TSE REIT Index ETF (1343)", "asset_class": "REIT", "default_ret": 0.04, "default_vol": 0.15},
    {"asset_code": "1555.T", "proxy_ticker": "VNQ", "name": "Listed Index Fund Australian REIT (1555)", "asset_class": "REIT", "default_ret": 0.05, "default_vol": 0.18},

    # 米国ETF等
    {"asset_code": "SPY", "name": "S&P 500 ETF (SPY)", "asset_class": "Stock", "default_ret": 0.07, "default_vol": 0.16},
    {"asset_code": "QQQ", "name": "Nasdaq 100 ETF (QQQ)", "asset_class": "Stock", "default_ret": 0.08, "default_vol": 0.20},
    {"asset_code": "VTI", "name": "Vanguard Total Stock Market ETF (VTI)", "asset_class": "Stock", "default_ret": 0.07, "default_vol": 0.16},
    {"asset_code": "VOO", "name": "Vanguard S&P 500 ETF (VOO)", "asset_class": "Stock", "default_ret": 0.07, "default_vol": 0.16},
    {"asset_code": "VYM", "name": "Vanguard High Dividend Yield ETF (VYM)", "asset_class": "Stock", "default_ret": 0.06, "default_vol": 0.14},
    {"asset_code": "DIA", "name": "SPDR Dow Jones Industrial Average ETF (DIA)", "asset_class": "Stock", "default_ret": 0.06, "default_vol": 0.15},
    {"asset_code": "1557.T", "proxy_ticker": "SPY", "name": "SPDR S&P 500 ETF (1557)", "asset_class": "Stock", "default_ret": 0.07, "default_vol": 0.16},
    {"asset_code": "BND", "name": "Vanguard Total Bond Market ETF (BND)", "asset_class": "Bond", "default_ret": 0.03, "default_vol": 0.05},
    {"asset_code": "AGG", "name": "iShares Core U.S. Aggregate Bond ETF (AGG)", "asset_class": "Bond", "default_ret": 0.03, "default_vol": 0.05},
    {"asset_code": "TLT", "name": "iShares 20+ Year Treasury Bond ETF (TLT)", "asset_class": "Bond", "default_ret": 0.04, "default_vol": 0.12},
    {"asset_code": "GLD", "name": "SPDR Gold Shares (GLD)", "asset_class": "Commodity", "default_ret": 0.04, "default_vol": 0.15},
    {"asset_code": "SLV", "name": "iShares Silver Trust (SLV)", "asset_class": "Commodity", "default_ret": 0.05, "default_vol": 0.25},
    {"asset_code": "DBC", "name": "Invesco DB Commodity Index ETF (DBC)", "asset_class": "Commodity", "default_ret": 0.04, "default_vol": 0.18},
    {"asset_code": "VNQ", "name": "Vanguard Real Estate ETF (VNQ)", "asset_class": "REIT", "default_ret": 0.06, "default_vol": 0.22},
    {"asset_code": "IYR", "name": "iShares U.S. Real Estate ETF (IYR)", "asset_class": "REIT", "default_ret": 0.06, "default_vol": 0.21},
    {"asset_code": "BTC-USD", "name": "Bitcoin USD (BTC-USD)", "asset_class": "Crypto", "default_ret": 0.15, "default_vol": 0.60},
    {"asset_code": "ETH-USD", "name": "Ethereum USD (ETH-USD)", "asset_class": "Crypto", "default_ret": 0.18, "default_vol": 0.70},
]

def precompute():
    print(f"Precomputing stats for {len(ASSETS_LIST)} assets...")
    end_date = datetime.now(UTC)
    start_date = end_date - timedelta(days=365 * 10) # 10 years for stable stats
    
    # 取得が必要な一意のティッカーリストを作成 (proxyがある場合はproxyを使用)
    download_tickers = list(set([a.get("proxy_ticker", a["asset_code"]) for a in ASSETS_LIST]))
    
    print(f"Downloading historical data for {len(download_tickers)} unique tickers from Yahoo Finance...")
    data = yf.download(download_tickers, start=start_date, end=end_date, auto_adjust=True)['Close']
    
    # Calculate returns
    returns = data.pct_change().dropna(how='all')
    
    results = []
    
    # 相関行列の計算前に、各アセット用の時系列データをマッピングして作成する
    mapped_returns = pd.DataFrame()
    for asset in ASSETS_LIST:
        code = asset["asset_code"]
        target_ticker = asset.get("proxy_ticker", code)
        mapped_returns[code] = returns[target_ticker]

    # Calculate correlation matrix for mapped assets
    corr_matrix = mapped_returns.corr().to_dict()
    
    for asset in ASSETS_LIST:
        code = asset["asset_code"]
        target_ticker = asset.get("proxy_ticker", code)
        print(f"Processing {code} (data from {target_ticker})...")
        
        asset_rets = returns[target_ticker].dropna()
        
        if len(asset_rets) > 252: # At least 1 year of data
            # Geometric mean annual return
            g_mean_daily = gmean(1 + asset_rets)
            ann_ret = float(np.power(g_mean_daily, 252) - 1)
            
            # Annualized volatility
            ann_vol = float(asset_rets.std() * np.sqrt(252))
            
            # 異常なマイナス値（分割調整バグなど）の検出フォールバック
            if ann_ret < -0.15:
                print(f"  Anomaly detected for {code} (ann_ret {ann_ret}), using defaults.")
                ann_ret = asset["default_ret"]
                ann_vol = asset["default_vol"]
            else:
                # Capping for sanity
                ann_ret = max(-0.2, min(0.5, ann_ret))
                ann_vol = max(0.01, min(1.0, ann_vol))
        else:
            print(f"  Insufficient data for {code}, using defaults.")
            ann_ret = asset["default_ret"]
            ann_vol = asset["default_vol"]
            
        # Get correlations for this asset using the mapped correlation matrix
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
