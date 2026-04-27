from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import uuid
import time
import asyncio
import numpy as np
from typing import List, Optional
from .. import crud, schemas, simulation, models
from ..dependencies import get_db, get_optional_user_id
from ..log_utils import logger

router = APIRouter(prefix="/api", tags=["analytics"])

GUEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

# Global lock and cache for market summary (Single-flight pattern)
market_summary_lock = asyncio.Lock()
market_summary_cache = {"data": None, "timestamp": 0, "last_error": None, "error_timestamp": 0}

@router.get("/market-summary")
async def get_market_summary(db: Session = Depends(get_db)):
    """
    Get current prices and 24h performance for major assets.
    Implements Single-flight (Request Coalescing) to prevent DB/API stampede.
    """
    current_time = time.time()
    if market_summary_cache["data"] and (current_time - market_summary_cache["timestamp"] < 60):
        return market_summary_cache["data"]
    if market_summary_cache["last_error"] and (current_time - market_summary_cache["error_timestamp"] < 10):
        raise HTTPException(status_code=500, detail=market_summary_cache["last_error"])

    async with market_summary_lock:
        if market_summary_cache["data"] and (time.time() - market_summary_cache["timestamp"] < 60):
            return market_summary_cache["data"]
        if market_summary_cache["last_error"] and (time.time() - market_summary_cache["error_timestamp"] < 10):
            raise HTTPException(status_code=500, detail=market_summary_cache["last_error"])
        try:
            assets = crud.get_assets(db, limit=10)
            asset_codes = [a.asset_code for a in assets]
            items_models = crud.get_market_summary(db, asset_codes=asset_codes)
            items = [item.model_dump() for item in items_models]
            
            if not items and assets:
                for a in assets:
                    mock_price = 100.0
                    items.append({
                        "asset_code": a.asset_code, 
                        "name": a.name,
                        "current_price": mock_price,
                        "change_percentage": float(a.expected_return or 0.0) / 12.0,
                        "sparkline": [mock_price * (1 + np.random.normal(0, 0.01)) for _ in range(10)]
                    })
            
            result = {"items": items, "updated_at": time.time()}
            market_summary_cache.update({"data": result, "timestamp": time.time(), "last_error": None})
            return result
        except HTTPException:
            raise
        except Exception as e:
            msg = "Service temporarily unavailable"
            market_summary_cache.update({"last_error": msg, "error_timestamp": time.time()})
            logger.error(f"Market summary failed: {e}")
            raise HTTPException(status_code=500, detail=msg)

@router.get("/portfolios/{portfolio_id}/analytics/stress-test")
def get_portfolio_stress_test(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or GUEST_USER_ID
    db_portfolio = crud.get_portfolio(db, portfolio_id=portfolio_id, user_id=effective_user_id)
    if not db_portfolio: raise HTTPException(status_code=404, detail="Portfolio not found")
    if not db_portfolio.allocations: raise HTTPException(status_code=400, detail="Portfolio has no allocations")
    try:
        assets_data, weights = [], []
        for alloc in db_portfolio.allocations:
            asset = crud.get_asset_by_code(db, alloc.asset_code)
            if asset:
                assets_data.append(asset)
                weights.append(float(alloc.weight))
        if not assets_data: raise HTTPException(status_code=400, detail="Portfolio has no valid assets")
        hist_data_list = [a.historical_prices for a in assets_data]
        scenarios = {"lehman_shock": ("2008-09-01", "2009-03-31", "Lehman Shock"), "covid_crash": ("2020-02-01", "2020-04-30", "Covid Crash"), "dotcom_bubble": ("2000-03-01", "2002-10-31", "Dot-com Bubble")}
        results = {}
        for key, (start, end, name) in scenarios.items():
            perf = simulation.calculate_stress_test_performance(hist_data_list, weights, start, end)
            safe_history = [{"date": h["date"], "cumulative_return": float(np.nan_to_num(h["cumulative_return"]))} for h in perf["history"]]
            results[key] = {"name": name, "max_drawdown": float(np.nan_to_num(perf["max_drawdown"])), "history": safe_history}
        return results
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stress test failed: {e}")
        raise HTTPException(status_code=400, detail=f"Analytics failed: {str(e)}")

@router.post("/portfolios/{portfolio_id}/analytics/rebalance", response_model=schemas.RebalanceResponse)
def post_portfolio_rebalance(portfolio_id: uuid.UUID, request: schemas.RebalanceRequest, db: Session = Depends(get_db)):
    db_portfolio = db.query(models.Portfolio).filter(models.Portfolio.id == portfolio_id).first()
    if not db_portfolio: raise HTTPException(status_code=404, detail="Portfolio not found") 
    try:
        current_allocations = {a.asset_code: float(a.weight) for a in db_portfolio.allocations}
        diff = simulation.calculate_rebalancing_diff(current_allocations, request.target_weights)
        return {"diff": {k: float(np.nan_to_num(v)) for k, v in diff.items()}}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Rebalance failed: {e}")
        raise HTTPException(status_code=400, detail=f"Analytics failed: {str(e)}")

@router.get("/affiliates/recommendations", response_model=List[schemas.AffiliateBrokerRead])
def get_affiliate_recommendations(request: Request, db: Session = Depends(get_db)):
    try:
        client_ip = request.headers.get("X-Forwarded-For", request.client.host)
        if client_ip and "," in client_ip: client_ip = client_ip.split(",")[0].strip()
        country_code = request.headers.get("cf-ipcountry", request.headers.get("x-vercel-ip-country", "UNKNOWN")).upper()
        region = "JP" if country_code == "JP" else "GLOBAL"
        if country_code == "UNKNOWN" and client_ip in ("127.0.0.1", "localhost", "::1", "testclient"):
            override_region = request.query_params.get("region")
            if override_region: region = override_region.upper()
            else: region = "JP"
        return crud.get_active_affiliates_by_region(db, region=region)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Affiliate recommendation failed: {e}")
        return []
