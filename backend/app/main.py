import os
import uuid
from typing import List, Optional
from decimal import Decimal
import numpy as np

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt  # PyJWT
from sqlalchemy.orm import Session

from . import crud, models, schemas, simulation
from .database import SessionLocal, engine
from .config import settings

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- CORS CONFIG ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DEPENDENCIES ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

security = HTTPBearer()

async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> uuid.UUID:
    raw_secret = settings.supabase_jwt_secret
    secret = raw_secret.strip() if raw_secret else ""
    
    try:
        token = credentials.credentials
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
        
        # --- EMERGENCY AUTH BYPASS FOR ES256 ---
        if alg == "ES256":
            payload = jwt.decode(token, options={"verify_signature": False})
        else:
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256", "RS256"],
                options={"verify_aud": False}
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing sub")
            
        return uuid.UUID(user_id)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        err_msg = f"{type(e).__name__}: {str(e)} (Detected alg: {alg})"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Auth error: {err_msg}"
        )

# --- ROUTES ---

@app.get("/")
def read_root():
    return {"status": "ok", "ver": "pyjwt-v12-all-endpoints"}

@app.get("/api/assets", response_model=List[schemas.AssetData])
def read_assets(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    return crud.get_assets(db, skip=skip, limit=limit)

@app.get("/api/asset-classes", response_model=schemas.AssetClassesResponse)
def get_asset_classes_endpoint(db: Session = Depends(get_db)):
    asset_classes = crud.get_asset_classes(db)
    return {"asset_classes": asset_classes}

@app.get("/api/assets/{asset_code}", response_model=schemas.AssetData)
def read_asset(asset_code: str, db: Session = Depends(get_db)):
    db_asset = crud.get_asset_by_code(db, asset_code=asset_code)
    if db_asset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return db_asset

@app.get("/api/assets/{asset_code}/historical-data", response_model=schemas.HistoricalDataResponse)
def get_asset_historical_data(asset_code: str, db: Session = Depends(get_db)):
    db_asset = crud.get_asset_by_code(db, asset_code=asset_code)
    if db_asset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    
    if not db_asset.historical_prices:
        return schemas.HistoricalDataResponse(asset_code=asset_code, historical_prices=[])

    return schemas.HistoricalDataResponse(
        asset_code=asset_code,
        historical_prices=[
            schemas.HistoricalPricePoint(date=point['date'], price=Decimal(str(point['price'])))
            for point in db_asset.historical_prices
        ]
    )

@app.post("/api/simulate/efficient-frontier", response_model=schemas.EfficientFrontierResponse)
def simulate_efficient_frontier(request: schemas.EfficientFrontierRequest, db: Session = Depends(get_db)):
    assets_data = []
    for code in request.assets:
        asset = crud.get_asset_by_code(db, code)
        if not asset: raise HTTPException(status_code=404, detail=f"Asset {code} not found")
        assets_data.append(asset)
    
    returns, volatilities, corr_matrix = simulation.prepare_simulation_inputs(assets_data)
    cov_matrix = simulation.build_covariance_matrix(volatilities, corr_matrix.tolist())
    return simulation.calculate_efficient_frontier(returns, cov_matrix, request.assets, request.n_points)

@app.post("/api/simulate/risk-parity", response_model=schemas.RiskParityResponse)
def simulate_risk_parity(request: schemas.RiskParityRequest, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    parameters = request.model_dump()
    cached = crud.get_simulation_result(db, "risk_parity", parameters)
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
    
    result = {
        "expected_return": ret,
        "volatility": vol,
        "weights": {request.assets[i]: float(weights_array[i]) for i in range(len(request.assets))}
    }
    crud.create_simulation_result(db, user_id, "risk_parity", parameters, result)
    return result

# NEW: Basic Accumulation Simulation
@app.post("/api/simulate/basic-accumulation", response_model=schemas.BasicAccumulationResponse)
def simulate_basic_accumulation(request: schemas.BasicAccumulationRequest, db: Session = Depends(get_db)):
    return simulation.calculate_basic_accumulation(
        initial_investment=request.initial_investment,
        monthly_contribution=request.monthly_contribution,
        expected_return=request.expected_return,
        volatility=request.volatility,
        years=request.years,
        n_scenarios=request.n_scenarios
    )

@app.post("/api/portfolios", response_model=schemas.Portfolio, status_code=201)
def create_portfolio(portfolio: schemas.PortfolioCreate, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    return crud.create_portfolio(db=db, portfolio=portfolio, user_id=user_id)

@app.get("/api/portfolios", response_model=List[schemas.Portfolio])
def read_portfolios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    return crud.get_portfolios(db, user_id=user_id, skip=skip, limit=limit)

@app.post("/api/simulation-results", response_model=schemas.SimulationResult, status_code=201)
def create_simulation_result_endpoint(simulation_result: schemas.SimulationResultCreate, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    try:
        return crud.create_simulation_result(db=db, user_id=user_id, **simulation_result.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error during save: {str(e)}")

@app.get("/api/simulation-results", response_model=List[schemas.SimulationResult])
def read_simulation_results_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    return crud.get_simulation_results(db=db, user_id=user_id, skip=skip, limit=limit)

@app.delete("/api/simulation-results/{result_id}", status_code=204)
def delete_simulation_result_endpoint(result_id: uuid.UUID, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    success = crud.delete_simulation_result(db, result_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Result not found or not owned by user")
    return None
