from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from typing import List, Optional
import numpy as np
from .. import crud, schemas, models, simulation
from ..dependencies import get_db, get_optional_user_id
from ..log_utils import logger

router = APIRouter(prefix="/api", tags=["simulation"])

GUEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

@router.post("/simulate/efficient-frontier", response_model=schemas.EfficientFrontierResponse)
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Simulation failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/simulate/risk-parity", response_model=schemas.RiskParityResponse)
def simulate_risk_parity(request: schemas.RiskParityRequest, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    if len(request.assets) < 2: raise HTTPException(status_code=400, detail="At least 2 assets required")
    try:
        effective_user_id = user_id or GUEST_USER_ID
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Risk parity failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/simulate/monte-carlo", response_model=schemas.MonteCarloResponse)
def simulate_monte_carlo(request: schemas.MonteCarloRequest, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or GUEST_USER_ID
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Monte Carlo failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/simulate/basic-accumulation", response_model=schemas.BasicAccumulationResponse)
def simulate_basic_accumulation(request: schemas.BasicAccumulationRequest, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    exp_ret, vol = request.expected_return, request.volatility
    effective_user_id = user_id or GUEST_USER_ID
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Basic accumulation failed: {e}")
        raise HTTPException(status_code=400, detail=f"Simulation failed: {str(e)}")

@router.post("/simulate/custom-portfolio", response_model=schemas.PortfolioPointResponse)  
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Custom portfolio failed: {e}")
        raise HTTPException(status_code=400, detail=f"Simulation failed: {str(e)}")

@router.get("/simulation-results", response_model=List[schemas.SimulationResult])
def read_simulation_results(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or GUEST_USER_ID
    try:
        return crud.get_simulation_results(db, user_id=effective_user_id, skip=skip, limit=limit)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Read results failed: {e}")
        raise HTTPException(status_code=400, detail="Could not retrieve results")

@router.post("/simulation-results", response_model=schemas.SimulationResult, status_code=201)
def create_simulation_result_endpoint(result: schemas.SimulationResultCreate, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    try:
        effective_user_id = user_id or GUEST_USER_ID
        if result.portfolio_id:
            db_portfolio = db.query(models.Portfolio).filter(models.Portfolio.id == result.portfolio_id, models.Portfolio.user_id == effective_user_id).first()
            if not db_portfolio: raise HTTPException(status_code=404, detail="Linked portfolio not found")
        
        def sanitize_recursive(obj):
            if isinstance(obj, dict): return {k: sanitize_recursive(v) for k, v in obj.items()}
            if isinstance(obj, list): return [sanitize_recursive(v) for v in obj]
            if isinstance(obj, (float, int)): return float(np.nan_to_num(obj))
            return obj
            
        sanitized_results = sanitize_recursive(result.results)
        return crud.create_simulation_result(db=db, user_id=effective_user_id, simulation_type=result.simulation_type, parameters=result.parameters, results=sanitized_results, portfolio_id=result.portfolio_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create result failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to save result")

@router.get("/simulation-results/{result_id}", response_model=schemas.SimulationResult)
def read_simulation_result(result_id: uuid.UUID, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or GUEST_USER_ID
    db_result = db.query(models.SimulationResult).filter(models.SimulationResult.id == result_id, models.SimulationResult.user_id == effective_user_id).first()
    if db_result is None: raise HTTPException(status_code=404, detail="Result not found")
    return db_result

@router.delete("/simulation-results/{result_id}")
def delete_simulation_result(result_id: uuid.UUID, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or GUEST_USER_ID
    if not crud.delete_simulation_result(db, result_id=result_id, user_id=effective_user_id):
        raise HTTPException(status_code=404, detail="Result not found")
    return {"message": "Result deleted successfully"}
