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
    if engine is not None:
        try:
            models.Base.metadata.create_all(bind=engine)
        except Exception as e:
            print(f"Warning: Database table creation failed on startup: {e}")

    client = get_jwks_client()
    if client:
        try:
            client.get_signing_keys()
        except Exception:
            pass
    yield

import traceback
from fastapi.responses import JSONResponse

app = FastAPI(lifespan=lifespan)

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        print(f"Unhandled Exception: {e}")
        print(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"detail": str(e), "traceback": traceback.format_exc()},
        )

# --- MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
