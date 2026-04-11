import os
import uuid
from typing import List, Optional
from decimal import Decimal
from contextlib import asynccontextmanager
import numpy as np

from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, models, schemas, simulation
from .database import engine
from .config import settings
from .dependencies import get_db, get_optional_user_id, get_current_user_id, get_jwks_client

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan events.
    Ensures database tables exist and pre-fetches JWKS keys on startup.
    """
    # Create database tables within lifespan to handle potential connection errors gracefully
    if engine is not None:
        try:
            models.Base.metadata.create_all(bind=engine)
        except Exception as e:
            print(f"Warning: Database table creation failed on startup: {e}")
    else:
        print("Warning: Skipping table creation because database engine is not initialized.")

    client = get_jwks_client()
    if client:
        try:
            client.get_signing_keys()
        except Exception:
            pass
    yield

app = FastAPI(lifespan=lifespan)

# --- MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/test-static")
def test_static():
    return {"status": "ok", "message": "Static response without DB"}

# --- ROUTES ---

@app.get("/")
def read_root():
    return {"status": "ok", "ver": "affiliate-stability-v1.0"}

@app.get("/api/assets", response_model=List[schemas.AssetData])
def read_assets(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    assets = crud.get_assets(db, skip=skip, limit=limit)
    for asset in assets:
        if asset.expected_return is not None and (np.isnan(float(asset.expected_return)) or np.isinf(float(asset.expected_return))):
            asset.expected_return = Decimal("0.0")
        if asset.volatility is not None and (np.isnan(float(asset.volatility)) or np.isinf(float(asset.volatility))):
            asset.volatility = Decimal("0.0")
        if asset.dividend_yield is not None and (np.isnan(float(asset.dividend_yield)) or np.isinf(float(asset.dividend_yield))):
            asset.dividend_yield = Decimal("0.0")
    return assets

@app.get("/api/assets/{asset_code}", response_model=schemas.AssetData)
def read_asset(asset_code: str, db: Session = Depends(get_db)):
    db_asset = crud.get_asset_by_code(db, asset_code=asset_code)
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    if db_asset.expected_return is not None and (np.isnan(float(db_asset.expected_return)) or np.isinf(float(db_asset.expected_return))):
        db_asset.expected_return = Decimal("0.0")
    if db_asset.volatility is not None and (np.isnan(float(db_asset.volatility)) or np.isinf(float(db_asset.volatility))):
        db_asset.volatility = Decimal("0.0")
    if db_asset.dividend_yield is not None and (np.isnan(float(db_asset.dividend_yield)) or np.isinf(float(db_asset.dividend_yield))):
        db_asset.dividend_yield = Decimal("0.0")
    return db_asset

@app.get("/api/assets/{asset_code}/historical-data", response_model=schemas.HistoricalDataResponse)
def get_asset_historical_data(asset_code: str, db: Session = Depends(get_db)):
    db_asset = crud.get_asset_by_code(db, asset_code=asset_code)
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    if not db_asset.historical_prices:
        return schemas.HistoricalDataResponse(asset_code=asset_code, historical_prices=[])
    
    limit_days = 252 * 10 
    prices = db_asset.historical_prices[-limit_days:] if len(db_asset.historical_prices) > limit_days else db_asset.historical_prices

    return schemas.HistoricalDataResponse(
        asset_code=asset_code,
        historical_prices=[
            schemas.HistoricalPricePoint(date=point['date'], price=Decimal(str(point['price'])))
            for point in prices
        ]
    )

@app.post("/api/simulate/efficient-frontier", response_model=schemas.EfficientFrontierResponse)
def simulate_efficient_frontier(request: schemas.EfficientFrontierRequest, db: Session = Depends(get_db)):
    if len(request.assets) < 2:
        raise HTTPException(status_code=400, detail="At least 2 assets are required")
    assets_data = []
    for code in request.assets:
        asset = crud.get_asset_by_code(db, code)
        if not asset: raise HTTPException(status_code=404, detail=f"Asset {code} not found")
        assets_data.append(asset)
    returns, volatilities, corr_matrix = simulation.prepare_simulation_inputs(assets_data)
    cov_matrix = simulation.build_covariance_matrix(volatilities, corr_matrix.tolist())
    return simulation.calculate_efficient_frontier(returns, cov_matrix, request.assets, request.n_points)

@app.post("/api/portfolios", response_model=schemas.Portfolio, status_code=201)
def create_portfolio(portfolio: schemas.PortfolioCreate, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or uuid.UUID("00000000-0000-0000-0000-000000000001")
    return crud.create_portfolio(db=db, portfolio=portfolio, user_id=effective_user_id)

@app.get("/api/portfolios", response_model=List[schemas.Portfolio])
def read_portfolios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    return crud.get_portfolios(db, user_id=user_id, skip=skip, limit=limit) if user_id else []
