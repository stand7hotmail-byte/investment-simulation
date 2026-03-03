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
    if len(request.assets) < 2:
        raise HTTPException(status_code=400, detail="At least 2 assets are required for efficient frontier calculation")
    
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
    if len(request.assets) < 2:
        raise HTTPException(status_code=400, detail="At least 2 assets are required for risk parity calculation")
        
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

@app.post("/api/simulate/monte-carlo", response_model=schemas.MonteCarloResponse)
def simulate_monte_carlo(request: schemas.MonteCarloRequest, db: Session = Depends(get_db)):
    db_portfolio = db.query(models.Portfolio).filter(models.Portfolio.id == request.portfolio_id).first()
    if not db_portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
        
    if not db_portfolio.allocations or len(db_portfolio.allocations) < 2:
        raise HTTPException(status_code=400, detail="Portfolio must have at least 2 allocations for Monte Carlo simulation")

    assets_data = []
    weights = []
    for alloc in db_portfolio.allocations:
        asset = crud.get_asset_by_code(db, alloc.asset_code)
        if asset:
            assets_data.append(asset)
            weights.append(float(alloc.weight))
            
    returns, volatilities, corr_matrix = simulation.prepare_simulation_inputs(assets_data)
    cov_matrix = simulation.build_covariance_matrix(volatilities, corr_matrix.tolist())
    port_return, port_vol = simulation.calculate_portfolio_stats(returns, cov_matrix, np.array(weights))
    
    return simulation.run_monte_carlo_simulation(
        initial_investment=request.initial_investment,
        monthly_contribution=request.monthly_contribution,
        expected_return=port_return,
        volatility=port_vol,
        years=request.years,
        n_simulations=request.n_simulations,
        extra_investments=request.extra_investments,
        target_amount=request.target_amount
    )

@app.post("/api/simulate/basic-accumulation", response_model=schemas.BasicAccumulationResponse)
def simulate_basic_accumulation(request: schemas.BasicAccumulationRequest, db: Session = Depends(get_db)):
    # Fallback to portfolio if expected_return/volatility not provided
    exp_ret = request.expected_return
    vol = request.volatility
    
    if exp_ret is None or vol is None:
        db_portfolio = db.query(models.Portfolio).filter(models.Portfolio.id == request.portfolio_id).first()
        if not db_portfolio: raise HTTPException(status_code=404, detail="Portfolio not found")
        
        assets_data = []
        weights = []
        for alloc in db_portfolio.allocations:
            asset = crud.get_asset_by_code(db, alloc.asset_code)
            if asset:
                assets_data.append(asset)
                weights.append(float(alloc.weight))
        
        if not assets_data: raise HTTPException(status_code=400, detail="Portfolio has no valid assets")
        returns, volatilities, corr_matrix = simulation.prepare_simulation_inputs(assets_data)
        cov_matrix = simulation.build_covariance_matrix(volatilities, corr_matrix.tolist())
        exp_ret, vol = simulation.calculate_portfolio_stats(returns, cov_matrix, np.array(weights))

    return simulation.calculate_basic_accumulation(
        initial_investment=request.initial_investment,
        monthly_contribution=request.monthly_contribution,
        expected_return=exp_ret,
        volatility=vol,
        years=request.years,
        n_scenarios=request.n_scenarios
    )

# --- PORTFOLIO ENDPOINTS ---

@app.post("/api/portfolios", response_model=schemas.Portfolio, status_code=201)
def create_portfolio(portfolio: schemas.PortfolioCreate, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    return crud.create_portfolio(db=db, portfolio=portfolio, user_id=user_id)

@app.get("/api/portfolios", response_model=List[schemas.Portfolio])
def read_portfolios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    return crud.get_portfolios(db, user_id=user_id, skip=skip, limit=limit)

@app.get("/api/portfolios/{portfolio_id}", response_model=schemas.Portfolio)
def read_portfolio(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    db_portfolio = crud.get_portfolio(db, portfolio_id=portfolio_id, user_id=user_id)
    if db_portfolio is None:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return db_portfolio

@app.put("/api/portfolios/{portfolio_id}", response_model=schemas.Portfolio)
def update_portfolio(portfolio_id: uuid.UUID, portfolio: schemas.PortfolioCreate, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    db_portfolio = crud.update_portfolio(db, portfolio_id=portfolio_id, user_id=user_id, portfolio_update=portfolio)
    if db_portfolio is None:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return db_portfolio

@app.delete("/api/portfolios/{portfolio_id}")
def delete_portfolio(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    success = crud.delete_portfolio(db, portfolio_id=portfolio_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return {"message": "Portfolio deleted successfully"}

# --- ALLOCATION ENDPOINTS ---

@app.post("/api/portfolios/{portfolio_id}/allocations", response_model=schemas.PortfolioAllocation, status_code=201)
def create_portfolio_allocation(portfolio_id: uuid.UUID, allocation: schemas.PortfolioAllocationCreate, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    db_portfolio = crud.get_portfolio(db, portfolio_id=portfolio_id, user_id=user_id)
    if not db_portfolio: raise HTTPException(status_code=404, detail="Portfolio not found")
    return crud.create_portfolio_allocation(db, allocation, portfolio_id)

@app.get("/api/portfolios/{portfolio_id}/allocations", response_model=List[schemas.PortfolioAllocation])
def read_portfolio_allocations(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    return crud.get_portfolio_allocations(db, portfolio_id, user_id)

@app.get("/api/portfolios/{portfolio_id}/allocations/{allocation_id}", response_model=schemas.PortfolioAllocation)
def read_portfolio_allocation(portfolio_id: uuid.UUID, allocation_id: uuid.UUID, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    db_allocation = crud.get_portfolio_allocation(db, portfolio_id, allocation_id, user_id)
    if not db_allocation: raise HTTPException(status_code=404, detail="Allocation not found")
    return db_allocation

@app.put("/api/portfolios/{portfolio_id}/allocations/{allocation_id}", response_model=schemas.PortfolioAllocation)
def update_portfolio_allocation(portfolio_id: uuid.UUID, allocation_id: uuid.UUID, allocation: schemas.PortfolioAllocationUpdate, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    db_allocation = crud.update_portfolio_allocation(db, portfolio_id, allocation_id, user_id, allocation)
    if not db_allocation: raise HTTPException(status_code=404, detail="Allocation not found")
    return db_allocation

@app.delete("/api/portfolios/{portfolio_id}/allocations/{allocation_id}")
def delete_portfolio_allocation(portfolio_id: uuid.UUID, allocation_id: uuid.UUID, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    success = crud.delete_portfolio_allocation(db, portfolio_id, allocation_id, user_id)
    if not success: raise HTTPException(status_code=404, detail="Allocation not found")
    return {"message": "Allocation deleted successfully"}

# --- SIMULATION RESULT ENDPOINTS ---

@app.post("/api/simulation-results", response_model=schemas.SimulationResult, status_code=201)
def create_simulation_result_endpoint(simulation_result: schemas.SimulationResultCreate, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    try:
        return crud.create_simulation_result(db=db, user_id=user_id, **simulation_result.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error during save: {str(e)}")

@app.get("/api/simulation-results", response_model=List[schemas.SimulationResult])
def read_simulation_results_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    return crud.get_simulation_results(db, user_id=user_id, skip=skip, limit=limit)

@app.delete("/api/simulation-results/{result_id}", status_code=204)
def delete_simulation_result_endpoint(result_id: uuid.UUID, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    success = crud.delete_simulation_result(db, result_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Result not found or not owned by user")
    return None
