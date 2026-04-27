from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import numpy as np
from decimal import Decimal
from .. import crud, schemas
from ..dependencies import get_db
from ..log_utils import logger

router = APIRouter(prefix="/api", tags=["assets"])

def _sanitize_asset(asset):
    if asset.expected_return is not None and (np.isnan(float(asset.expected_return)) or np.isinf(float(asset.expected_return))):
        asset.expected_return = Decimal("0.0")
    if asset.volatility is not None and (np.isnan(float(asset.volatility)) or np.isinf(float(asset.volatility))):
        asset.volatility = Decimal("0.0")
    if asset.dividend_yield is not None and (np.isnan(float(asset.dividend_yield)) or np.isinf(float(asset.dividend_yield))):
        asset.dividend_yield = Decimal("0.0")
    if hasattr(asset, "correlation_matrix") and asset.correlation_matrix:
        asset.correlation_matrix = {k: float(np.nan_to_num(v)) for k, v in asset.correlation_matrix.items()}
    return asset

@router.get("/assets", response_model=List[schemas.AssetData])
def read_assets(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    try:
        assets = crud.get_assets(db, skip=skip, limit=limit)
        return [_sanitize_asset(a) for a in assets]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Read assets failed: {e}")
        raise HTTPException(status_code=400, detail="Could not retrieve assets")

@router.get("/asset-classes", response_model=schemas.AssetClassesResponse)
def get_asset_classes_endpoint(db: Session = Depends(get_db)):
    asset_classes = crud.get_asset_classes(db)
    return {"asset_classes": asset_classes}

@router.get("/assets/{asset_code}", response_model=schemas.AssetData)
def read_asset(asset_code: str, db: Session = Depends(get_db)):
    try:
        db_asset = crud.get_asset_by_code(db, asset_code=asset_code)
        if db_asset is None: raise HTTPException(status_code=404, detail="Asset not found")
        return _sanitize_asset(db_asset)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Read asset {asset_code} failed: {e}")
        raise HTTPException(status_code=400, detail="Could not retrieve asset")

@router.get("/assets/{asset_code}/historical-data", response_model=schemas.HistoricalDataResponse)
def get_asset_historical_data(asset_code: str, db: Session = Depends(get_db)):
    db_asset = crud.get_asset_by_code(db, asset_code=asset_code)
    if db_asset is None: raise HTTPException(status_code=404, detail="Asset not found")
    try:
        return {
            "asset_code": db_asset.asset_code,
            "historical_prices": db_asset.historical_prices or []
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Read historical data for {asset_code} failed: {e}")
        raise HTTPException(status_code=400, detail="Could not retrieve historical data")
