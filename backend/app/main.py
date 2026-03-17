import os
import uuid
from typing import List, Optional
from decimal import Decimal
from contextlib import asynccontextmanager
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

# Supabase JWKS client for ES256 verification
class FailsafeJWKClient(jwt.PyJWKClient):
    """
    JWK client that implements a fail-safe mechanism: 
    If a fetch fails but we have stale keys in the cache, use the stale keys.
    """
    def __init__(self, *args, **kwargs):
        # Default timeout to 30 seconds
        if "timeout" not in kwargs:
            kwargs["timeout"] = 30
        super().__init__(*args, **kwargs)
        self._last_successful_jwk_set = None

    def fetch_data(self):
        try:
            data = super().fetch_data()
            self._last_successful_jwk_set = data
            return data
        except Exception as e:
            if self._last_successful_jwk_set:
                print(f"JWKS fetch failed, using stale keys: {e}")
                return self._last_successful_jwk_set
            raise e

def get_jwks_client() -> Optional[jwt.PyJWKClient]:
    """Initializes and returns the Supabase JWKS client for ES256 verification."""
    if settings.supabase_url:
        jwks_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/jwks"
        # Increase lifespan to 24 hours to reduce network calls
        return FailsafeJWKClient(jwks_url, cache_keys=True, lifespan=86400)
    return None

jwks_client = get_jwks_client()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan events.
    Pre-fetches JWKS keys on startup to avoid delay on first request.
    """
    global jwks_client
    if jwks_client:
        try:
            # Warm up the cache by fetching keys on startup
            print("Warming up JWKS cache...")
            jwks_client.get_signing_keys()
            print("JWKS cache warmed up successfully.")
        except Exception as e:
            print(f"Failed to warm up JWKS cache on startup: {e}")
    yield

app = FastAPI(lifespan=lifespan)

# --- MIDDLEWARE ---
origins = settings.allowed_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DEPENDENCIES ---
security = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> uuid.UUID:
    """
    Authenticates the user using a Supabase JWT.
    Supports both ES256 (via JWKS) and HS256 (via secret) algorithms.
    
    Args:
        credentials: The HTTP Bearer credentials.
        
    Returns:
        The authenticated user's UUID.
        
    Raises:
        HTTPException: If authentication fails or the token is invalid.
    """
    token = credentials.credentials
    alg = "Unknown"
    kid = "None"
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
        kid = header.get("kid", "None")
        
        if alg == "ES256":
            # Ensure jwks_client is available
            global jwks_client
            if not jwks_client:
                jwks_client = get_jwks_client()
            
            if not jwks_client:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                    detail="JWKS client not initialized. Check SUPABASE_URL environment variable."
                )
            
            try:
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["ES256"],
                    options={
                        "verify_aud": False,
                        "verify_iss": False, 
                    }
                )
            except jwt.PyJWKClientError as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"ES256 JWKS error (kid: {kid}): {str(e)}"
                )
            except jwt.InvalidTokenError as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"ES256 invalid token: {str(e)}"
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"ES256 verification failed (kid: {kid}): {str(e)}"
                )
        else:
            raw_secret = settings.supabase_jwt_secret
            secret = raw_secret.strip() if raw_secret else ""
            if not secret:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Supabase JWT secret not configured."
                )
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
        
        user_id = payload.get("sub")
        if not user_id: 
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing 'sub' claim")
        
        try:
            return uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid user ID format: {user_id}")

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed (Algorithm: {alg}, kid: {kid}): {str(e)}"
        )

# --- ROUTES ---

@app.get("/")
def read_root():
    return {"status": "ok", "ver": "pyjwt-v1.3-es256-verified"}

@app.get("/api/assets", response_model=List[schemas.AssetData])
def read_assets(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    return crud.get_assets(db, skip=skip, limit=limit)

@app.get("/api/asset-classes", response_model=schemas.AssetClassesResponse)
def get_asset_classes_endpoint(db: Session = Depends(get_db)):
    asset_classes = crud.get_asset_classes(db)
    return {"asset_classes": asset_classes}

@app.get("/api/market-summary", response_model=schemas.MarketSummaryResponse)
def get_market_summary_endpoint(db: Session = Depends(get_db)):
    # Representative assets for dashboard
    target_assets = ["SPY", "1321.T", "BTC-USD", "GLD", "TLT"]
    items = crud.get_market_summary(db, target_assets)
    return {"items": items}

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

@app.post("/api/simulate/custom-portfolio", response_model=schemas.PortfolioPointResponse)
def simulate_custom_portfolio(request: schemas.CustomPortfolioRequest, db: Session = Depends(get_db)):
    assets_data = []
    weights = []
    for code in request.assets:
        asset = crud.get_asset_by_code(db, code)
        if not asset: raise HTTPException(status_code=404, detail=f"Asset {code} not found")
        assets_data.append(asset)
        weights.append(float(request.weights.get(code, 0.0)))
    if sum(weights) < 0.0001:
        raise HTTPException(status_code=400, detail="Total weights must be greater than zero")
    returns, volatilities, corr_matrix = simulation.prepare_simulation_inputs(assets_data)
    cov_matrix = simulation.build_covariance_matrix(volatilities, corr_matrix.tolist())
    exp_ret, vol = simulation.calculate_portfolio_stats(returns, cov_matrix, np.array(weights))
    return {"expected_return": exp_ret, "volatility": vol, "weights": request.weights}

@app.post("/api/simulate/monte-carlo", response_model=schemas.MonteCarloResponse)
def simulate_monte_carlo(request: schemas.MonteCarloRequest, db: Session = Depends(get_db)):
    db_portfolio = db.query(models.Portfolio).filter(models.Portfolio.id == request.portfolio_id).first()
    if not db_portfolio: raise HTTPException(status_code=404, detail="Portfolio not found")
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
    exp_ret, vol = request.expected_return, request.volatility
    if exp_ret is None or vol is None:
        db_portfolio = db.query(models.Portfolio).filter(models.Portfolio.id == request.portfolio_id).first()
        if not db_portfolio: raise HTTPException(status_code=404, detail="Portfolio not found")
        assets_data, weights = [], []
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
    if db_portfolio is None: raise HTTPException(status_code=404, detail="Portfolio not found")
    return db_portfolio

@app.put("/api/portfolios/{portfolio_id}", response_model=schemas.Portfolio)
def update_portfolio(portfolio_id: uuid.UUID, portfolio: schemas.PortfolioCreate, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    db_portfolio = crud.update_portfolio(db, portfolio_id=portfolio_id, user_id=user_id, portfolio_update=portfolio)
    if db_portfolio is None: raise HTTPException(status_code=404, detail="Portfolio not found")
    return db_portfolio

@app.delete("/api/portfolios/{portfolio_id}")
def delete_portfolio(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    success = crud.delete_portfolio(db, portfolio_id=portfolio_id, user_id=user_id)
    if not success: raise HTTPException(status_code=404, detail="Portfolio not found")
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
