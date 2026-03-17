import numpy as np
import cvxpy as cp
from typing import List, Dict, Any, Optional
from scipy.optimize import minimize

def calculate_risk_parity_weights(
    covariance_matrix: np.ndarray,
    bounds: List[tuple] = None
) -> np.ndarray:
    n = covariance_matrix.shape[0]
    if bounds is None:
        bounds = [(0, 1.0) for _ in range(n)]
    asset_volatilities = np.sqrt(np.diag(covariance_matrix))
    inverse_volatilities = 1.0 / (asset_volatilities + 1e-9)
    init_weights = inverse_volatilities / np.sum(inverse_volatilities)
    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0}]
    def objective(w):
        if np.any(w < 0): return np.inf
        portfolio_variance = w.T @ covariance_matrix @ w
        if portfolio_variance < 1e-10: return np.inf
        marginal_risk_contribution = (covariance_matrix @ w) / np.sqrt(portfolio_variance)
        risk_contributions = w * marginal_risk_contribution
        if np.any(risk_contributions <= 1e-10): return np.inf
        log_risk_contributions = np.log(risk_contributions)
        return np.var(log_risk_contributions)
    result = minimize(objective, init_weights, method='SLSQP', constraints=constraints, bounds=bounds, tol=1e-10, options={'maxiter': 1000})
    if not result.success: return init_weights
    return result.x

def calculate_efficient_frontier(expected_returns: np.ndarray, covariance_matrix: np.ndarray, asset_codes: List[str], n_points: int = 50) -> Dict[str, Any]:
    n_assets = len(expected_returns)
    if n_assets == 1:
        # Handle single asset case: return the asset's own return and volatility
        return {
            "frontier": [{
                "expected_return": float(expected_returns[0]),
                "volatility": float(np.sqrt(covariance_matrix[0, 0])),
                "weights": {asset_codes[0]: 1.0}
            }],
            "max_sharpe": {
                "expected_return": float(expected_returns[0]),
                "volatility": float(np.sqrt(covariance_matrix[0, 0])),
                "weights": {asset_codes[0]: 1.0}
            }
        }
    weights = cp.Variable(n_assets)
    constraints = [cp.sum(weights) == 1, weights >= 0]
    portfolio_return = expected_returns @ weights
    portfolio_variance = cp.quad_form(weights, covariance_matrix)
    min_var_problem = cp.Problem(cp.Minimize(portfolio_variance), constraints)
    min_var_problem.solve()
    min_return = portfolio_return.value
    max_return = np.max(expected_returns)
    target_returns = np.linspace(min_return, max_return, n_points)
    frontier_points = []
    for target in target_returns:
        ret_constraint = [portfolio_return >= target]
        prob = cp.Problem(cp.Minimize(portfolio_variance), constraints + ret_constraint)
        try:
            prob.solve()
            if prob.status == cp.OPTIMAL:
                frontier_points.append({
                    "expected_return": float(portfolio_return.value),
                    "volatility": float(np.sqrt(portfolio_variance.value)),
                    "weights": {asset_codes[i]: float(weights.value[i]) for i in range(n_assets)}
                })
        except Exception: continue
    max_sharpe_point = None
    if frontier_points:
        max_sharpe = -1
        for p in frontier_points:
            if p["volatility"] > 0:
                sr = p["expected_return"] / p["volatility"]
                if sr > max_sharpe:
                    max_sharpe = sr
                    max_sharpe_point = p
    return {"frontier": frontier_points, "max_sharpe": max_sharpe_point}

def calculate_portfolio_stats(expected_returns: np.ndarray, covariance_matrix: np.ndarray, weights: np.ndarray) -> tuple[float, float]:
    ret = expected_returns @ weights
    vol = np.sqrt(weights.T @ covariance_matrix @ weights)
    return float(ret), float(vol)

def get_asset_returns(historical_prices: List[Dict[str, Any]]) -> np.ndarray:
    prices = np.array([point['price'] for point in historical_prices])
    return (prices[1:] / prices[:-1]) - 1

def calculate_stats_from_historical_data(historical_prices_data: List[List[Dict[str, Any]]]) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    for p in historical_prices_data:
        if not p: raise ValueError("Historical prices data cannot be empty for an asset.")
    all_asset_returns = [get_asset_returns(p) for p in historical_prices_data]
    min_len = min(len(r) for r in all_asset_returns)
    
    if min_len < 1:
        raise ValueError("Insufficient historical data to calculate returns. At least 2 price points are required.")

    aligned_returns = np.array([r[-min_len:] for r in all_asset_returns]).T
    annualization_factor = 252 if min_len > 200 else 52
    annual_returns = np.mean(aligned_returns, axis=0) * annualization_factor
    
    # Handle cases with very few data points to avoid NaN in cov/corr
    if min_len < 2:
        # Fallback: Zero covariance, identity correlation, and zero volatility
        n_assets = len(historical_prices_data)
        covariance_matrix = np.eye(n_assets) * 1e-8
        correlation_matrix = np.eye(n_assets)
        annual_volatilities = np.zeros(n_assets)
        return annual_returns, annual_volatilities, correlation_matrix

    # Add small epsilon to diagonal for numerical stability (ensure positive-definite)
    covariance_matrix = np.cov(aligned_returns, rowvar=False) * annualization_factor + np.eye(len(historical_prices_data)) * 1e-8
    correlation_matrix = np.corrcoef(aligned_returns, rowvar=False)
    # Ensure correlation matrix doesn't have NaNs (can happen if volatility is 0)
    correlation_matrix = np.nan_to_num(correlation_matrix, nan=0.0, posinf=0.0, neginf=0.0)
    np.fill_diagonal(correlation_matrix, 1.0)

    annual_volatilities = np.std(aligned_returns, axis=0) * np.sqrt(annualization_factor)
    return annual_returns, annual_volatilities, correlation_matrix

def run_monte_carlo_simulation(
    initial_investment: float,
    monthly_contribution: float,
    expected_return: float = None,
    volatility: float = None,
    years: int = None,
    n_simulations: int = 10000,
    extra_investments: Optional[List[Any]] = None,
    target_amount: Optional[float] = None,
    mu: float = None,
    sigma: float = None
) -> Dict[str, Any]:
    mu_val = expected_return if expected_return is not None else mu
    sigma_val = volatility if volatility is not None else sigma
    
    # Use Geometric Brownian Motion logic for more realistic path simulation
    # S_t = S_{t-1} * exp((mu - 0.5 * sigma^2) * dt + sigma * sqrt(dt) * Z)
    # Since we use 1-year steps (dt = 1):
    dt = 1.0
    drift = (mu_val - 0.5 * sigma_val**2) * dt
    diffusion = sigma_val * np.sqrt(dt)
    
    # Generate log-returns (normal distribution)
    log_returns = np.random.normal(drift, diffusion, (years, n_simulations))
    # Convert log-returns to actual price multipliers: exp(log_return)
    multipliers = np.exp(log_returns)
    
    portfolio_values = np.zeros((years + 1, n_simulations))
    portfolio_values[0] = initial_investment
    
    extra_map = {}
    if extra_investments:
        for item in extra_investments:
            y = item.year if hasattr(item, 'year') else item.get("year")
            a = item.amount if hasattr(item, 'amount') else item.get("amount")
            extra_map[y] = a
    
    for t in range(1, years + 1):
        # Apply market returns
        portfolio_values[t] = portfolio_values[t-1] * multipliers[t-1]
        # Apply periodic contributions (simplified as end-of-year lump sum for dt=1)
        portfolio_values[t] += monthly_contribution * 12
        if t in extra_map: portfolio_values[t] += extra_map[t]
            
    final_values = portfolio_values[-1]
    percentiles = {str(p): float(np.percentile(final_values, p)) for p in [10, 25, 50, 75, 90]}
    
    # Calculate principal invested
    total_invested = initial_investment + (monthly_contribution * 12 * years) + sum(extra_map.values())
    prob_loss = float(np.mean(final_values < total_invested))
    prob_target = float(np.mean(final_values >= target_amount)) if target_amount else None
    
    history = []
    for t in range(years + 1):
        history.append({
            "year": t,
            "p10": float(np.percentile(portfolio_values[t], 10)),
            "p50": float(np.percentile(portfolio_values[t], 50)),
            "p90": float(np.percentile(portfolio_values[t], 90))
        })
    confidence_interval_95 = {"lower_bound": float(np.percentile(final_values, 2.5)), "upper_bound": float(np.percentile(final_values, 97.5))}
    return {"percentiles": percentiles, "元本割れ確率": prob_loss, "目標到達確率": prob_target, "history": history, "confidence_interval_95": confidence_interval_95}

monte_carlo_simulation = run_monte_carlo_simulation

def calculate_basic_accumulation(
    initial_investment: float,
    monthly_contribution: float,
    expected_return: float = None,
    volatility: float = None,
    years: int = None,
    n_scenarios: int = 1,
    mu: float = None
) -> Dict[str, Any]:
    exp_ret = expected_return if expected_return is not None else mu
    history = []
    current_value = initial_investment
    history.append({"year": 0, "value": float(current_value)})
    for t in range(1, years + 1):
        current_value = current_value * (1 + exp_ret) + (monthly_contribution * 12)
        history.append({"year": t, "value": float(current_value)})
    return {"final_value": float(current_value), "history": history}

def build_covariance_matrix(volatilities: List[float], correlation_matrix: List[List[float]]) -> np.ndarray:
    vols = np.array(volatilities)
    corrs = np.array(correlation_matrix)
    return np.outer(vols, vols) * corrs

def prepare_simulation_inputs(assets: List[Any]) -> tuple[np.ndarray, List[float], np.ndarray]:
    all_historical_prices_available = all(hasattr(a, 'historical_prices') and a.historical_prices for a in assets)
    if all_historical_prices_available:
        return calculate_stats_from_historical_data([a.historical_prices for a in assets])
    returns_array = np.array([float(a.expected_return) for a in assets])
    volatilities_list = [float(a.volatility) for a in assets]
    n = len(assets)
    correlation_matrix_array = np.eye(n)
    for i in range(n):
        for j in range(n):
            if i != j:
                target_code = assets[j].asset_code
                correlation_matrix_array[i, j] = assets[i].correlation_matrix.get(target_code, 0.0) if (hasattr(assets[i], 'correlation_matrix') and assets[i].correlation_matrix) else 0.0
    return returns_array, volatilities_list, correlation_matrix_array
