import os
import uuid
from typing import List, Optional
from decimal import Decimal
from contextlib import asynccontextmanager
import asyncio
import numpy as np
import time
import traceback

from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from . import crud, models, schemas, simulation
from .database import get_engine, get_session_local
from .config import settings
from .dependencies import get_db, get_optional_user_id, get_current_user_id, get_jwks_client
from .log_utils import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = get_engine()
    if engine is not None:
        try:
            models.Base.metadata.create_all(bind=engine)
        except Exception as e:
            logger.warning(f"Database table creation failed on startup: {e}")
    client = get_jwks_client()
    if client:
        try: client.get_signing_keys()
        except Exception: pass
    yield

app = FastAPI(lifespan=lifespan)

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        logger.exception(f"Unhandled Exception: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "request_id": str(uuid.uuid4())},
        )

# --- MIDDLEWARE ---
logger.info("Setting up robust CORS middleware...")
default_origins = ["http://localhost:3000", "http://127.0.0.1:3000", "https://investment-sim-frontend.vercel.app"]
allowed_origins_env = os.getenv("CORS_ALLOWED_ORIGINS", "")
if allowed_origins_env:
    app.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in allowed_origins_env.split(",")], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
else:
    app.add_middleware(CORSMiddleware, allow_origins=default_origins, allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|investment-sim-frontend.*\.vercel\.app|.*\.up\.railway\.app)(:\d+)?", allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- ROUTES ---

@app.get("/")
def read_root(): return {"status": "ok", "ver": "portfolio-stability-v1.3"}

@app.get("/api/assets", response_model=List[schemas.AssetData])
def read_assets(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    try:
        assets = crud.get_assets(db, skip=skip, limit=limit)
        for asset in assets:
            if asset.expected_return is not None and (np.isnan(float(asset.expected_return)) or np.isinf(float(asset.expected_return))): asset.expected_return = Decimal("0.0")
            if asset.volatility is not None and (np.isnan(float(asset.volatility)) or np.isinf(float(asset.volatility))): asset.volatility = Decimal("0.0")
            if asset.dividend_yield is not None and (np.isnan(float(asset.dividend_yield)) or np.isinf(float(asset.dividend_yield))): asset.dividend_yield = Decimal("0.0")
            if hasattr(asset, "correlation_matrix") and asset.correlation_matrix:
                asset.correlation_matrix = {k: float(np.nan_to_num(v)) for k, v in asset.correlation_matrix.items()}
        return assets
    except Exception as e:
        logger.error(f"Read assets failed: {e}")
        raise HTTPException(status_code=400, detail="Could not retrieve assets")

@app.get("/api/asset-classes", response_model=schemas.AssetClassesResponse)
def get_asset_classes_endpoint(db: Session = Depends(get_db)):
    asset_classes = crud.get_asset_classes(db)
    return {"asset_classes": asset_classes}

@app.get("/api/assets/{asset_code}", response_model=schemas.AssetData)
def read_asset(asset_code: str, db: Session = Depends(get_db)):
    try:
        db_asset = crud.get_asset_by_code(db, asset_code=asset_code)
        if db_asset is None: raise HTTPException(status_code=404, detail="Asset not found")
        if db_asset.expected_return is not None and (np.isnan(float(db_asset.expected_return)) or np.isinf(float(db_asset.expected_return))): db_asset.expected_return = Decimal("0.0")
        if db_asset.volatility is not None and (np.isnan(float(db_asset.volatility)) or np.isinf(float(db_asset.volatility))): db_asset.volatility = Decimal("0.0")
        if db_asset.dividend_yield is not None and (np.isnan(float(db_asset.dividend_yield)) or np.isinf(float(db_asset.dividend_yield))): db_asset.dividend_yield = Decimal("0.0")
        if hasattr(db_asset, "correlation_matrix") and db_asset.correlation_matrix:
            db_asset.correlation_matrix = {k: float(np.nan_to_num(v)) for k, v in db_asset.correlation_matrix.items()}
        return db_asset
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Read asset {asset_code} failed: {e}")
        raise HTTPException(status_code=400, detail="Could not retrieve asset")

@app.get("/api/assets/{asset_code}/historical-data", response_model=schemas.HistoricalDataResponse)
def get_asset_historical_data(asset_code: str, db: Session = Depends(get_db)):
    db_asset = crud.get_asset_by_code(db, asset_code=asset_code)
    if db_asset is None: raise HTTPException(status_code=404, detail="Asset not found")
    try:
        # Match schemas.HistoricalDataResponse
        return {
            "asset_code": db_asset.asset_code,
            "historical_prices": db_asset.historical_prices or []
        }
    except Exception as e:
        logger.error(f"Read historical data for {asset_code} failed: {e}")
        raise HTTPException(status_code=400, detail="Could not retrieve historical data")

@app.post("/api/simulate/efficient-frontier", response_model=schemas.EfficientFrontierResponse)
def simulate_efficient_frontier(request: schemas.EfficientFrontierRequest, db: Session = Depends(get_db)):
    if len(request.assets) < 2: raise HTTPException(status_code=400, detail="At least 2 assets required")
    try:
        assets_data = []
        for code in request.assets:
            asset = crud.get_asset_by_code(db, code)
            if not asset: raise HTTPException(status_code=404, detail=f"Asset {code} not found")
            assets_data.append(asset)
        returns, volatilities, corr_matrix = simulation.prepare_simulation_inputs(assets_data)
        cov_matrix = simulation.build_covariance_matrix(volatilities, corr_matrix.tolist())
        result = simulation.calculate_efficient_frontier(returns, cov_matrix, request.assets, request.n_points)
        for point in result.get("frontier", []):
            point["expected_return"] = float(np.nan_to_num(point["expected_return"]))
            point["volatility"] = float(np.nan_to_num(point["volatility"]))
            point["weights"] = {k: float(np.nan_to_num(v)) for k, v in point["weights"].items()}
        if result.get("max_sharpe"):
            ms = result["max_sharpe"]
            ms["expected_return"] = float(np.nan_to_num(ms["expected_return"]))
            ms["volatility"] = float(np.nan_to_num(ms["volatility"]))
            ms["weights"] = {k: float(np.nan_to_num(v)) for k, v in ms["weights"].items()}
        return result
    except Exception as e:
        logger.error(f"Simulation failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/simulate/risk-parity", response_model=schemas.RiskParityResponse)
def simulate_risk_parity(request: schemas.RiskParityRequest, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    if len(request.assets) < 2: raise HTTPException(status_code=400, detail="At least 2 assets required")
    try:
        effective_user_id = user_id or uuid.UUID("00000000-0000-0000-0000-000000000001")
        cached = crud.get_simulation_result(db, effective_user_id, "risk_parity", request.model_dump())
        if cached: return cached.results
        assets_data = []
        for code in request.assets:
            asset = crud.get_asset_by_code(db, code)
            if not asset: raise HTTPException(status_code=404, detail=f"Asset {code} not found")
            assets_data.append(asset)
        returns, volatilities, corr_matrix = simulation.prepare_simulation_inputs(assets_data)
        cov_matrix = simulation.build_covariance_matrix(volatilities, corr_matrix.tolist())
        bounds = [tuple(request.bounds.get(code, (0.0, 1.0))) for code in request.assets] if request.bounds else None
        weights_array = simulation.calculate_risk_parity_weights(cov_matrix, bounds=bounds)
        ret, vol = simulation.calculate_portfolio_stats(returns, cov_matrix, weights_array)
        result = {"expected_return": float(np.nan_to_num(ret)), "volatility": float(np.nan_to_num(vol)), "weights": {request.assets[i]: float(np.nan_to_num(weights_array[i])) for i in range(len(request.assets))}}
        crud.create_simulation_result(db, effective_user_id, "risk_parity", request.model_dump(), result)
        return result
    except Exception as e:
        logger.error(f"Risk parity failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/simulate/monte-carlo", response_model=schemas.MonteCarloResponse)
def simulate_monte_carlo(request: schemas.MonteCarloRequest, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or uuid.UUID("00000000-0000-0000-0000-000000000001")
    try:
        db_portfolio = db.query(models.Portfolio).filter(models.Portfolio.id == request.portfolio_id, models.Portfolio.user_id == effective_user_id).first()
        if not db_portfolio: raise HTTPException(status_code=404, detail="Portfolio not found")
        assets_data, weights = [], []
        div_yield_sum = 0.0
        for alloc in db_portfolio.allocations:
            asset = crud.get_asset_by_code(db, alloc.asset_code)
            if asset:
                assets_data.append(asset)
                w = float(alloc.weight); weights.append(w)
                if asset.dividend_yield: div_yield_sum += float(asset.dividend_yield) * w
        final_div_yield = request.dividend_yield if request.dividend_yield is not None else div_yield_sum
        returns, volatilities, corr_matrix = simulation.prepare_simulation_inputs(assets_data)
        cov_matrix = simulation.build_covariance_matrix(volatilities, corr_matrix.tolist())
        ret, vol = simulation.calculate_portfolio_stats(returns, cov_matrix, np.array(weights))
        result = simulation.run_monte_carlo_simulation(initial_investment=request.initial_investment, monthly_contribution=request.monthly_contribution, expected_return=ret, volatility=vol, years=request.years, n_simulations=request.n_simulations, extra_investments=request.extra_investments, target_amount=request.target_amount, dividend_yield=final_div_yield, reinvest_dividends=request.reinvest_dividends)
        for h in result.get("history", []):
            for key in ["p10", "p50", "p90", "p50_dividend", "p50_cumulative_dividend"]: h[key] = float(np.nan_to_num(h[key]))
        result["percentiles"] = {k: float(np.nan_to_num(v)) for k, v in result["percentiles"].items()}
        result["confidence_interval_95"] = {k: float(np.nan_to_num(v)) for k, v in result["confidence_interval_95"].items()}
        return result
    except Exception as e:
        logger.error(f"Monte Carlo failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/simulate/basic-accumulation", response_model=schemas.BasicAccumulationResponse)
def simulate_basic_accumulation(request: schemas.BasicAccumulationRequest, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    exp_ret, vol = request.expected_return, request.volatility
    effective_user_id = user_id or uuid.UUID("00000000-0000-0000-0000-000000000001")        
    try:
        if exp_ret is None or vol is None:
            db_portfolio = db.query(models.Portfolio).filter(models.Portfolio.id == request.portfolio_id, models.Portfolio.user_id == effective_user_id).first()
            if not db_portfolio: raise HTTPException(status_code=404, detail="Portfolio not found or unauthorized")
            assets_data, weights = [], []
            for alloc in db_portfolio.allocations:
                asset = crud.get_asset_by_code(db, alloc.asset_code)
                if asset:
                    assets_data.append(asset)
                    weights.append(float(alloc.weight))
            if not assets_data: raise HTTPException(status_code=400, detail="Portfolio has no assets")
            returns, volatilities, corr_matrix = simulation.prepare_simulation_inputs(assets_data)
            cov_matrix = simulation.build_covariance_matrix(volatilities, corr_matrix.tolist())
            exp_ret, vol = simulation.calculate_portfolio_stats(returns, cov_matrix, np.array(weights))
        result = simulation.calculate_basic_accumulation(initial_investment=request.initial_investment, monthly_contribution=request.monthly_contribution, expected_return=exp_ret, volatility=vol, years=request.years)
        result["final_value"] = float(np.nan_to_num(result["final_value"]))
        for h in result["history"]: h["value"] = float(np.nan_to_num(h["value"]))
        return result
    except Exception as e:
        logger.error(f"Basic accumulation failed: {e}")
        raise HTTPException(status_code=400, detail=f"Simulation failed: {str(e)}")

@app.post("/api/simulate/custom-portfolio", response_model=schemas.PortfolioPointResponse)  
def simulate_custom_portfolio(request: schemas.CustomPortfolioRequest, db: Session = Depends(get_db)):
    if not request.assets: raise HTTPException(status_code=400, detail="At least 1 asset is required")
    try:
        total_weight = sum(request.weights.get(code, 0.0) for code in request.assets)       
        if total_weight <= 0: raise HTTPException(status_code=400, detail="Total weight must be positive")
        sanitized_weights = {code: (request.weights.get(code, 0.0) / total_weight) for code in request.assets}
        assets_data, weights = [], []
        for code in request.assets:
            asset = crud.get_asset_by_code(db, code)
            if not asset: raise HTTPException(status_code=404, detail=f"Asset {code} not found")      
            assets_data.append(asset)
            weights.append(sanitized_weights[code])
        returns, volatilities, corr_matrix = simulation.prepare_simulation_inputs(assets_data)
        cov_matrix = simulation.build_covariance_matrix(volatilities, corr_matrix.tolist()) 
        ret, vol = simulation.calculate_portfolio_stats(returns, cov_matrix, np.array(weights))
        return {"expected_return": float(np.nan_to_num(ret)), "volatility": float(np.nan_to_num(vol)), "weights": {k: float(np.nan_to_num(v)) for k, v in sanitized_weights.items()}}
    except Exception as e:
        logger.error(f"Custom portfolio failed: {e}")
        raise HTTPException(status_code=400, detail=f"Simulation failed: {str(e)}")

@app.post("/api/portfolios", response_model=schemas.Portfolio, status_code=201)
def create_portfolio(portfolio: schemas.PortfolioCreate, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or uuid.UUID("00000000-0000-0000-0000-000000000001")
    try:
        return crud.create_portfolio(db=db, portfolio=portfolio, user_id=effective_user_id)
    except ValueError as e: raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Portfolio creation failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to create portfolio")

@app.get("/api/portfolios", response_model=List[schemas.Portfolio])
def read_portfolios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or uuid.UUID("00000000-0000-0000-0000-000000000001")
    try:
        portfolios = crud.get_portfolios(db, user_id=effective_user_id, skip=skip, limit=limit)
        for p in portfolios:
            for a in p.allocations: a.weight = Decimal(str(np.nan_to_num(float(a.weight))))
        return portfolios
    except Exception as e:
        logger.error(f"Read portfolios failed: {e}")
        raise HTTPException(status_code=400, detail="Could not retrieve portfolios")

@app.get("/api/portfolios/{portfolio_id}", response_model=schemas.Portfolio)
def read_portfolio(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or uuid.UUID("00000000-0000-0000-0000-000000000001")
    try:
        db_portfolio = crud.get_portfolio(db, portfolio_id=portfolio_id, user_id=effective_user_id)
        if db_portfolio is None: raise HTTPException(status_code=404, detail="Portfolio not found")
        for a in db_portfolio.allocations: a.weight = Decimal(str(np.nan_to_num(float(a.weight))))
        return db_portfolio
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Read portfolio failed: {e}")
        raise HTTPException(status_code=400, detail="Could not retrieve portfolio")

@app.put("/api/portfolios/{portfolio_id}", response_model=schemas.Portfolio)
def update_portfolio(portfolio_id: uuid.UUID, portfolio: schemas.PortfolioCreate, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or uuid.UUID("00000000-0000-0000-0000-000000000001")
    try:
        db_portfolio = crud.update_portfolio(db, portfolio_id=portfolio_id, user_id=effective_user_id, portfolio_update=portfolio)
        if db_portfolio is None: raise HTTPException(status_code=404, detail="Portfolio not found")
        return db_portfolio
    except ValueError as e: raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Update portfolio failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to update portfolio")

@app.delete("/api/portfolios/{portfolio_id}")
def delete_portfolio(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or uuid.UUID("00000000-0000-0000-0000-000000000001")
    try:
        if not crud.delete_portfolio(db, portfolio_id=portfolio_id, user_id=effective_user_id): raise HTTPException(status_code=404, detail="Portfolio not found")
        return {"message": "Portfolio deleted successfully"}
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Delete portfolio failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to delete portfolio")

# --- ALLOCATION ROUTES ---

# Global lock and cache for market summary (Single-flight pattern)
market_summary_lock = asyncio.Lock()
market_summary_cache = {"data": None, "timestamp": 0, "last_error": None, "error_timestamp": 0}

@app.get("/api/market-summary")
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
            # Use real historical data from CRUD
            items_models = crud.get_market_summary(db, asset_codes=asset_codes)
            
            # Convert models to dicts for consistent caching and ensure we have some data
            items = [item.model_dump() for item in items_models]
            
            # If CRUD returned fewer items than requested, or no items, we could supplement 
            # with mock data if needed, but current_price MUST NOT be accessed as an attribute.
            if not items and assets:
                for a in assets:
                    # Fallback values using available attributes
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
        except Exception as e:
            msg = "Service temporarily unavailable"
            market_summary_cache.update({"last_error": msg, "error_timestamp": time.time()})
            logger.error(f"Market summary failed: {e}")
            raise HTTPException(status_code=500, detail=msg)

@app.post("/api/portfolios/{portfolio_id}/allocations", response_model=schemas.PortfolioAllocation, status_code=201)
def create_portfolio_allocation(portfolio_id: uuid.UUID, allocation: schemas.PortfolioAllocationCreate, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or uuid.UUID("00000000-0000-0000-0000-000000000001")
    try:
        portfolio = crud.get_portfolio(db, portfolio_id=portfolio_id, user_id=effective_user_id)
        if not portfolio: raise HTTPException(status_code=404, detail="Portfolio not found")
        return crud.create_portfolio_allocation(db, allocation=allocation, portfolio_id=portfolio_id)
    except Exception as e:
        logger.error(f"Create allocation failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to create allocation")

@app.get("/api/portfolios/{portfolio_id}/allocations", response_model=List[schemas.PortfolioAllocation])
def read_portfolio_allocations(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or uuid.UUID("00000000-0000-0000-0000-000000000001")
    try:
        return crud.get_portfolio_allocations(db, portfolio_id=portfolio_id, user_id=effective_user_id)
    except Exception as e:
        logger.error(f"Read allocations failed: {e}")
        raise HTTPException(status_code=400, detail="Could not retrieve allocations")

@app.get("/api/portfolios/{portfolio_id}/allocations/{allocation_id}", response_model=schemas.PortfolioAllocation)
def read_portfolio_allocation(portfolio_id: uuid.UUID, allocation_id: uuid.UUID, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or uuid.UUID("00000000-0000-0000-0000-000000000001")
    try:
        db_allocation = crud.get_portfolio_allocation(db, portfolio_id=portfolio_id, allocation_id=allocation_id, user_id=effective_user_id)
        if db_allocation is None: raise HTTPException(status_code=404, detail="Allocation not found")
        return db_allocation
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Read allocation failed: {e}")
        raise HTTPException(status_code=400, detail="Could not retrieve allocation")

@app.put("/api/portfolios/{portfolio_id}/allocations/{allocation_id}", response_model=schemas.PortfolioAllocation)
def update_portfolio_allocation(portfolio_id: uuid.UUID, allocation_id: uuid.UUID, allocation: schemas.PortfolioAllocationUpdate, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or uuid.UUID("00000000-0000-0000-0000-000000000001")
    try:
        db_allocation = crud.update_portfolio_allocation(db, portfolio_id=portfolio_id, allocation_id=allocation_id, user_id=effective_user_id, allocation_update=allocation)
        if db_allocation is None: raise HTTPException(status_code=404, detail="Allocation not found")
        return db_allocation
    except Exception as e:
        logger.error(f"Update allocation failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to update allocation")

@app.delete("/api/portfolios/{portfolio_id}/allocations/{allocation_id}")
def delete_portfolio_allocation(portfolio_id: uuid.UUID, allocation_id: uuid.UUID, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or uuid.UUID("00000000-0000-0000-0000-000000000001")
    try:
        if not crud.delete_portfolio_allocation(db, portfolio_id=portfolio_id, allocation_id=allocation_id, user_id=effective_user_id): raise HTTPException(status_code=404, detail="Allocation not found")
        return {"message": "Allocation deleted successfully"}
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Delete allocation failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to delete allocation")

@app.get("/api/simulation-results", response_model=List[schemas.SimulationResult])
def read_simulation_results(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or uuid.UUID("00000000-0000-0000-0000-000000000001")
    try:
        return crud.get_simulation_results(db, user_id=effective_user_id, skip=skip, limit=limit)
    except Exception as e:
        logger.error(f"Read results failed: {e}")
        raise HTTPException(status_code=400, detail="Could not retrieve results")

@app.post("/api/simulation-results", response_model=schemas.SimulationResult, status_code=201)
def create_simulation_result_endpoint(result: schemas.SimulationResultCreate, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    try:
        effective_user_id = user_id or uuid.UUID("00000000-0000-0000-0000-000000000001")
        if result.portfolio_id:
            db_portfolio = db.query(models.Portfolio).filter(models.Portfolio.id == result.portfolio_id, models.Portfolio.user_id == effective_user_id).first()
            if not db_portfolio: raise HTTPException(status_code=404, detail="Linked portfolio not found")
        
        # Sanitize results before saving to prevent NaN/Inf in DB
        def sanitize_recursive(obj):
            if isinstance(obj, dict): return {k: sanitize_recursive(v) for k, v in obj.items()}
            if isinstance(obj, list): return [sanitize_recursive(v) for v in obj]
            if isinstance(obj, (float, int)): return float(np.nan_to_num(obj))
            return obj
            
        sanitized_results = sanitize_recursive(result.results)
        return crud.create_simulation_result(db=db, user_id=effective_user_id, simulation_type=result.simulation_type, parameters=result.parameters, results=sanitized_results, portfolio_id=result.portfolio_id)
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Create result failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to save result")

@app.get("/api/simulation-results/{result_id}", response_model=schemas.SimulationResult)
def read_simulation_result(result_id: uuid.UUID, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or uuid.UUID("00000000-0000-0000-0000-000000000001")
    db_result = db.query(models.SimulationResult).filter(models.SimulationResult.id == result_id, models.SimulationResult.user_id == effective_user_id).first()
    if db_result is None: raise HTTPException(status_code=404, detail="Result not found")
    return db_result

@app.delete("/api/simulation-results/{result_id}")
def delete_simulation_result(result_id: uuid.UUID, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or uuid.UUID("00000000-0000-0000-0000-000000000001")
    if not crud.delete_simulation_result(db, result_id=result_id, user_id=effective_user_id):
        raise HTTPException(status_code=404, detail="Result not found")
    return {"message": "Result deleted successfully"}

@app.get("/api/portfolios/{portfolio_id}/analytics/stress-test")
def get_portfolio_stress_test(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or uuid.UUID("00000000-0000-0000-0000-000000000001")
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
    except Exception as e:
        logger.error(f"Stress test failed: {e}")
        raise HTTPException(status_code=400, detail=f"Analytics failed: {str(e)}")

@app.post("/api/portfolios/{portfolio_id}/analytics/rebalance", response_model=schemas.RebalanceResponse)
def post_portfolio_rebalance(portfolio_id: uuid.UUID, request: schemas.RebalanceRequest, db: Session = Depends(get_db)):
    db_portfolio = db.query(models.Portfolio).filter(models.Portfolio.id == portfolio_id).first()
    if not db_portfolio: raise HTTPException(status_code=404, detail="Portfolio not found") 
    try:
        current_allocations = {a.asset_code: float(a.weight) for a in db_portfolio.allocations}
        diff = simulation.calculate_rebalancing_diff(current_allocations, request.target_weights)
        return {"diff": {k: float(np.nan_to_num(v)) for k, v in diff.items()}}
    except Exception as e:
        logger.error(f"Rebalance failed: {e}")
        raise HTTPException(status_code=400, detail=f"Analytics failed: {str(e)}")

@app.get("/api/affiliates/recommendations", response_model=List[schemas.AffiliateBrokerRead])
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
    except Exception as e:
        logger.error(f"Affiliate recommendation failed: {e}")
        return []
