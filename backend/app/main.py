from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uuid
import numpy as np
from typing import List, Optional

from . import crud, models, schemas, simulation
from .database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Placeholder for user authentication
def get_current_user_id():
    # Return a fixed UUID for development to ensure consistency between requests
    return uuid.UUID("00000000-0000-0000-0000-000000000001")

@app.post("/api/portfolios", response_model=schemas.Portfolio, status_code=status.HTTP_201_CREATED)
def create_portfolio(portfolio: schemas.PortfolioCreate, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    return crud.create_portfolio(db=db, portfolio=portfolio, user_id=user_id)

@app.get("/api/portfolios", response_model=List[schemas.Portfolio])
def read_portfolios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    portfolios = crud.get_portfolios(db, user_id=user_id, skip=skip, limit=limit)
    return portfolios

@app.get("/api/portfolios/{portfolio_id}", response_model=schemas.Portfolio)
def read_portfolio(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    db_portfolio = crud.get_portfolio(db, portfolio_id=portfolio_id, user_id=user_id)
    if db_portfolio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
    return db_portfolio

@app.put("/api/portfolios/{portfolio_id}", response_model=schemas.Portfolio)
def update_portfolio(portfolio_id: uuid.UUID, portfolio: schemas.PortfolioCreate, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    db_portfolio = crud.update_portfolio(db, portfolio_id=portfolio_id, user_id=user_id, portfolio_update=portfolio)
    if db_portfolio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found or not owned by user")
    return db_portfolio

@app.delete("/api/portfolios/{portfolio_id}", status_code=status.HTTP_200_OK)
def delete_portfolio(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    if not crud.delete_portfolio(db, portfolio_id=portfolio_id, user_id=user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found or not owned by user")
    return {"message": "Portfolio deleted successfully"}

@app.post("/api/portfolios/{portfolio_id}/allocations", response_model=schemas.PortfolioAllocation, status_code=status.HTTP_201_CREATED)
def create_portfolio_allocation(portfolio_id: uuid.UUID, allocation: schemas.PortfolioAllocationCreate, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    # Verify portfolio ownership before creating allocation
    db_portfolio = crud.get_portfolio(db, portfolio_id=portfolio_id, user_id=user_id)
    if db_portfolio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found or not owned by user")

    if allocation.portfolio_id != portfolio_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Portfolio ID in path and body must match")
    return crud.create_portfolio_allocation(db=db, allocation=allocation)

@app.get("/api/portfolios/{portfolio_id}/allocations", response_model=List[schemas.PortfolioAllocation])
def read_portfolio_allocations(portfolio_id: uuid.UUID, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    allocations = crud.get_portfolio_allocations(db, portfolio_id=portfolio_id, user_id=user_id, skip=skip, limit=limit)
    if not crud.get_portfolio(db, portfolio_id, user_id): # Check if portfolio exists and is owned by user
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found or not owned by user")
    return allocations

@app.get("/api/portfolios/{portfolio_id}/allocations/{allocation_id}", response_model=schemas.PortfolioAllocation)
def read_portfolio_allocation(portfolio_id: uuid.UUID, allocation_id: uuid.UUID, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    db_allocation = crud.get_portfolio_allocation(db, portfolio_id=portfolio_id, allocation_id=allocation_id, user_id=user_id)
    if db_allocation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation not found or not owned by user")
    return db_allocation

@app.put("/api/portfolios/{portfolio_id}/allocations/{allocation_id}", response_model=schemas.PortfolioAllocation)
def update_portfolio_allocation(portfolio_id: uuid.UUID, allocation_id: uuid.UUID, allocation: schemas.PortfolioAllocationUpdate, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    db_allocation = crud.update_portfolio_allocation(db, portfolio_id=portfolio_id, allocation_id=allocation_id, user_id=user_id, allocation_update=allocation)
    if db_allocation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation not found or not owned by user")
    return db_allocation

@app.delete("/api/portfolios/{portfolio_id}/allocations/{allocation_id}", status_code=status.HTTP_200_OK)
def delete_portfolio_allocation(portfolio_id: uuid.UUID, allocation_id: uuid.UUID, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    if not crud.delete_portfolio_allocation(db, portfolio_id=portfolio_id, allocation_id=allocation_id, user_id=user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation not found or not owned by user")
    return {"message": "Allocation deleted successfully"}

@app.get("/api/assets", response_model=List[schemas.AssetData])
def read_assets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    assets = crud.get_assets(db, skip=skip, limit=limit)
    return assets

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
            schemas.HistoricalPricePoint(date=point['date'], price=point['price'])
            for point in db_asset.historical_prices
        ]
    )

@app.post("/api/simulate/efficient-frontier", response_model=schemas.EfficientFrontierResponse)
def simulate_efficient_frontier(request: schemas.EfficientFrontierRequest, db: Session = Depends(get_db)):
    assets_data = []
    for code in request.assets:
        asset = crud.get_asset_by_code(db, code)
        if not asset:
            raise HTTPException(status_code=404, detail=f"Asset {code} not found")
        assets_data.append(asset)
    
    if len(assets_data) < 2:
        raise HTTPException(status_code=400, detail="At least two assets are required for efficient frontier calculation")
    
    # 計算データの準備を委譲
    returns, volatilities, corr_matrix = simulation.prepare_simulation_inputs(assets_data)
    cov_matrix = simulation.build_covariance_matrix(volatilities, corr_matrix.tolist())
    
    # 計算実行
    result = simulation.calculate_efficient_frontier(
        returns, 
        cov_matrix, 
        request.assets, 
        request.n_points
    )
    
    return result

@app.post("/api/simulate/risk-parity", response_model=schemas.RiskParityResponse)
def simulate_risk_parity(request: schemas.RiskParityRequest, db: Session = Depends(get_db)):
    # キャッシュのチェック (Side effect - separate)
    parameters = request.model_dump()
    cached_result = crud.get_simulation_result(db, "risk_parity", parameters)
    if cached_result:
        return cached_result.results

    assets_data = []
    for code in request.assets:
        asset = crud.get_asset_by_code(db, code)
        if not asset:
            raise HTTPException(status_code=404, detail=f"Asset {code} not found")
        assets_data.append(asset)
    
    if len(assets_data) < 2:
        raise HTTPException(status_code=400, detail="At least two assets are required for risk parity calculation")
    
    # 計算データの準備を委譲
    returns, volatilities, corr_matrix = simulation.prepare_simulation_inputs(assets_data)
    cov_matrix = simulation.build_covariance_matrix(volatilities, corr_matrix.tolist())
    
    # 配分制限の準備
    bounds = None
    if request.bounds:
        bounds = []
        for code in request.assets:
            if code in request.bounds:
                bounds.append(tuple(request.bounds[code]))
            else:
                bounds.append((0.0, 1.0))
    
    # 計算実行
    weights_array = simulation.calculate_risk_parity_weights(cov_matrix, bounds=bounds)
    
    # 結果の集計
    ret, vol = simulation.calculate_portfolio_stats(returns, cov_matrix, weights_array)
    
    result = {
        "expected_return": ret,
        "volatility": vol,
        "weights": {request.assets[i]: float(weights_array[i]) for i in range(len(request.assets))}
    }

    # キャッシュに保存 (Side effect)
    crud.create_simulation_result(db, "risk_parity", parameters, result)
    
    return result

@app.post("/api/simulate/monte-carlo", response_model=schemas.MonteCarloResponse)
def simulate_monte_carlo(request: schemas.MonteCarloRequest, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    # 1. ポートフォリオの存在と所有権を確認
    db_portfolio = crud.get_portfolio(db, portfolio_id=request.portfolio_id, user_id=user_id)
    if db_portfolio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found or not owned by user")
    
    # 2. 資産配分を取得
    allocations = crud.get_portfolio_allocations(db, portfolio_id=request.portfolio_id, user_id=user_id)
    if not allocations:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Portfolio has no allocations")
    
    # 3. 各資産の統計データを取得
    asset_codes = [a.asset_code for a in allocations]
    weights = np.array([float(a.weight) for a in allocations])
    
    assets_stats = []
    for code in asset_codes:
        stats = crud.get_asset_by_code(db, code)
        if not stats:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Asset data for {code} not found")
        assets_stats.append(stats)
        
    # 4. ポートフォリオ全体の期待リターンとリスクを算出
    returns, volatilities, corr_matrix = simulation.prepare_simulation_inputs(assets_stats)
    cov_matrix = simulation.build_covariance_matrix(volatilities, corr_matrix.tolist())
    
    mu, sigma = simulation.calculate_portfolio_stats(returns, cov_matrix, weights)
    
    # 5. モンテカルロシミュレーションの実行
    extra_investments = [inv.model_dump() for inv in request.extra_investments] if request.extra_investments else None
    
    result = simulation.monte_carlo_simulation(
        mu=mu,
        sigma=sigma,
        initial_investment=request.initial_investment,
        monthly_contribution=request.monthly_contribution,
        years=request.years,
        n_simulations=request.n_simulations,
        extra_investments=extra_investments,
        target_amount=request.target_amount
    )
    
    return result

@app.get("/")
def read_root():
    return {"Hello": "World"}
