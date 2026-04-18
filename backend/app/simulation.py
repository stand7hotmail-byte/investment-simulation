import numpy as np
import cvxpy as cp
import logging
from typing import List, Dict, Any, Optional, Tuple
from scipy.optimize import minimize
from scipy.stats import gmean
from .log_utils import logger

# Standard constant for numerical stability across all financial calculations
EPSILON = 1e-9

def annualize_returns(
    geometric_mean_daily_multiplier: np.ndarray, 
    factor: int = 252,
    min_ret: float = -0.95,
    max_ret: float = 5.0
) -> np.ndarray:
    """
    Annualizes geometric mean returns and applies safety caps.
    (1 + daily_ret)^factor - 1
    """
    annual_returns = np.power(np.maximum(0, geometric_mean_daily_multiplier), factor) - 1
    return np.clip(annual_returns, min_ret, max_ret)

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
    sigma: float = None,
    dividend_yield: float = 0.0,
    reinvest_dividends: bool = True
) -> Dict[str, Any]:
    """
    Runs a Monte Carlo simulation using Geometric Brownian Motion,
    accounting for dividend yield and optional reinvestment.
    """
    mu_val = expected_return if expected_return is not None else mu
    sigma_val = volatility if volatility is not None else sigma
    
    # Calculate price-only drift (mu_total = mu_price + dividend_yield)
    # Since our expected_return is usually total return from Adj Close:
    price_mu = mu_val - dividend_yield
    
    dt = 1.0
    drift = (price_mu - 0.5 * sigma_val**2) * dt
    diffusion = sigma_val * np.sqrt(dt)
    
    # Generate log-returns (normal distribution) for price changes
    log_returns = np.random.normal(drift, diffusion, (years, n_simulations))
    multipliers = np.exp(log_returns)
    
    portfolio_values = np.zeros((years + 1, n_simulations))
    cumulative_dividends = np.zeros((years + 1, n_simulations))
    annual_dividends = np.zeros((years + 1, n_simulations))
    
    portfolio_values[0] = initial_investment
    
    extra_map = {}
    if extra_investments:
        for item in extra_investments:
            y = item.year if hasattr(item, 'year') else item.get("year")
            a = item.amount if hasattr(item, 'amount') else item.get("amount")
            extra_map[y] = a
    
    for t in range(1, years + 1):
        # 1. Market Price Change
        portfolio_values[t] = portfolio_values[t-1] * multipliers[t-1]
        
        # 2. Calculate Dividend Income (based on current market value)
        current_divs = portfolio_values[t] * dividend_yield
        annual_dividends[t] = current_divs
        cumulative_dividends[t] = cumulative_dividends[t-1] + current_divs
        
        # 3. Apply Reinvestment
        if reinvest_dividends:
            portfolio_values[t] += current_divs
            
        # 4. Apply Periodic contributions & extra investments
        portfolio_values[t] += monthly_contribution * 12
        if t in extra_map: 
            portfolio_values[t] += extra_map[t]
            
    final_values = portfolio_values[-1]
    
    history = []
    for t in range(years + 1):
        # Sanitize for JSON compatibility (NaN/Inf to 0.0)
        history.append({
            "year": t,
            "p10": float(np.nan_to_num(np.percentile(portfolio_values[t], 10))),
            "p50": float(np.nan_to_num(np.percentile(portfolio_values[t], 50))),
            "p90": float(np.nan_to_num(np.percentile(portfolio_values[t], 90))),
            "p50_dividend": float(np.nan_to_num(np.percentile(annual_dividends[t], 50))),
            "p50_cumulative_dividend": float(np.nan_to_num(np.percentile(cumulative_dividends[t], 50)))
        })
    
    total_invested = initial_investment + (monthly_contribution * 12 * years) + sum(extra_map.values())
    prob_loss = float(np.mean(final_values < total_invested))
    prob_target = float(np.mean(final_values >= target_amount)) if target_amount else None
    
    confidence_interval_95 = {
        "lower_bound": float(np.nan_to_num(np.percentile(final_values, 2.5))), 
        "upper_bound": float(np.nan_to_num(np.percentile(final_values, 97.5)))
    }
    
    return {
        "percentiles": {str(p): float(np.nan_to_num(np.percentile(final_values, p))) for p in [10, 25, 50, 75, 90]}, 
        "元本割れ確率": float(np.nan_to_num(prob_loss)), 
        "目標到達確率": float(np.nan_to_num(prob_target)) if prob_target is not None else None, 
        "history": history, 
        "confidence_interval_95": confidence_interval_95,
        "total_dividends_p50": float(np.nan_to_num(np.percentile(cumulative_dividends[-1], 50)))
    }

monte_carlo_simulation = run_monte_carlo_simulation

def calculate_risk_parity_weights(
    covariance_matrix: np.ndarray,
    bounds: List[tuple] = None
) -> np.ndarray:
    """
    Calculates Equal Risk Contribution (ERC) weights for a given covariance matrix.
    """
    n = covariance_matrix.shape[0]
    if bounds is None:
        bounds = [(0, 1.0) for _ in range(n)]
        
    asset_volatilities = np.sqrt(np.diag(covariance_matrix))
    # Harden: Prevent division by zero if an asset has 0 volatility
    # Use a small floor (EPSILON) to ensure stability
    safe_vols = np.maximum(asset_volatilities, EPSILON)
    inverse_volatilities = 1.0 / safe_vols
    init_weights = inverse_volatilities / np.sum(inverse_volatilities)
    
    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0}]
    
    def objective(w):
        if np.any(w < 0): return np.inf
        portfolio_variance = w.T @ covariance_matrix @ w
        if portfolio_variance < EPSILON: return np.inf
        marginal_risk_contribution = (covariance_matrix @ w) / np.sqrt(portfolio_variance)
        risk_contributions = w * marginal_risk_contribution
        if np.any(risk_contributions <= EPSILON): return np.inf
        log_risk_contributions = np.log(risk_contributions)
        return np.var(log_risk_contributions)
        
    result = minimize(objective, init_weights, method='SLSQP', constraints=constraints, bounds=bounds, tol=1e-10, options={'maxiter': 1000})
    return result.x if result.success else init_weights

def calculate_efficient_frontier(
    expected_returns: np.ndarray, 
    covariance_matrix: np.ndarray, 
    asset_codes: List[str], 
    n_points: int = 50
) -> Dict[str, Any]:
    """
    Calculates the efficient frontier using mean-variance optimization.
    """
    n_assets = len(expected_returns)
    if n_assets == 1:
        stat = {
            "expected_return": float(expected_returns[0]),
            "volatility": float(np.sqrt(covariance_matrix[0, 0])),
            "weights": {asset_codes[0]: 1.0}
        }
        return {"frontier": [stat], "max_sharpe": stat}
        
    weights = cp.Variable(n_assets)
    constraints = [cp.sum(weights) == 1, weights >= 0]
    portfolio_return = expected_returns @ weights
    portfolio_variance = cp.quad_form(weights, covariance_matrix)
    
    # Find minimum variance return
    min_var_problem = cp.Problem(cp.Minimize(portfolio_variance), constraints)
    try:
        min_var_problem.solve()
        if min_var_problem.status != cp.OPTIMAL or portfolio_return.value is None:
            raise ValueError("Could not find optimal minimum variance portfolio")
        min_return = portfolio_return.value
    except Exception as e:
        logger.error(f"Min variance solver failed: {e}")
        # Fallback: use the return of the asset with minimum return
        min_return = np.min(expected_returns)
    
    max_return = np.max(expected_returns)
    # Ensure range is valid for linspace
    if min_return >= max_return:
        target_returns = [min_return]
    else:
        target_returns = np.linspace(min_return, max_return, n_points)
    
    frontier_points = []
    for target in target_returns:
        ret_constraint = [portfolio_return >= target]
        prob = cp.Problem(cp.Minimize(portfolio_variance), constraints + ret_constraint)
        try:
            prob.solve()
            if prob.status == cp.OPTIMAL and weights.value is not None:
                # Double check for NaN in weights
                w_val = np.nan_to_num(weights.value, nan=0.0)
                # Re-normalize just in case
                if np.sum(w_val) > 0:
                    w_val = w_val / np.sum(w_val)
                
                frontier_points.append({
                    "expected_return": float(portfolio_return.value),
                    "volatility": float(np.sqrt(portfolio_variance.value)),
                    "weights": {asset_codes[i]: float(w_val[i]) for i in range(n_assets)}
                })
        except Exception: 
            continue
            
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

def calculate_portfolio_stats(expected_returns: np.ndarray, covariance_matrix: np.ndarray, weights: np.ndarray) -> Tuple[float, float]:
    """Calculates expected return and volatility for a given set of weights."""
    ret = expected_returns @ weights
    variance = weights.T @ covariance_matrix @ weights
    # Safety floor for variance to prevent sqrt of negative number due to float noise
    vol = np.sqrt(np.maximum(0.0, variance))
    return float(ret), float(vol)

def get_asset_returns(historical_prices: List[Dict[str, Any]]) -> np.ndarray:
    """Calculates daily returns from a list of price points."""
    prices = np.array([point['price'] for point in historical_prices])
    return (prices[1:] / prices[:-1]) - 1

def calculate_stats_from_historical_data(
    historical_prices_data: List[List[Dict[str, Any]]]
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Computes annualized returns, volatilities, and correlation matrix from raw historical price data.
    """
    for p in historical_prices_data:
        if not p: raise ValueError("Historical prices data cannot be empty for an asset.")
        
    all_asset_returns = [get_asset_returns(p) for p in historical_prices_data]
    min_len = min(len(r) for r in all_asset_returns)
    
    if min_len < 1:
        raise ValueError("Insufficient historical data to calculate returns. At least 2 price points are required.")

    aligned_returns = np.array([r[-min_len:] for r in all_asset_returns]).T
    annualization_factor = 252
    
    # Calculate geometric mean of (1 + daily returns)
    gmean_input = 1 + aligned_returns
    geometric_mean_daily_multiplier = gmean(gmean_input, axis=0)
    
    # Annualize the geometric mean with safety caps
    annual_returns = annualize_returns(geometric_mean_daily_multiplier, factor=annualization_factor)
    
    # Numerical stability: add small epsilon to diagonal
    covariance_matrix = np.cov(aligned_returns, rowvar=False) * annualization_factor + np.eye(len(historical_prices_data)) * EPSILON
    correlation_matrix = np.corrcoef(aligned_returns, rowvar=False)
    
    # Clean up correlation matrix
    correlation_matrix = np.nan_to_num(correlation_matrix, nan=0.0, posinf=0.0, neginf=0.0)
    np.fill_diagonal(correlation_matrix, 1.0)

    annual_volatilities = np.std(aligned_returns, axis=0) * np.sqrt(annualization_factor)
    return annual_returns, annual_volatilities, correlation_matrix

def calculate_basic_accumulation(
    initial_investment: float,
    monthly_contribution: float,
    expected_return: float = None,
    volatility: float = None,
    years: int = None,
    mu: float = None
) -> Dict[str, Any]:
    """Calculates a simple deterministic accumulation path."""
    exp_ret = expected_return if expected_return is not None else mu
    history = []
    current_value = initial_investment
    history.append({"year": 0, "value": float(current_value)})
    for t in range(1, years + 1):
        current_value = current_value * (1 + exp_ret) + (monthly_contribution * 12)
        history.append({"year": t, "value": float(current_value)})
    return {"final_value": float(current_value), "history": history}

def build_covariance_matrix(volatilities: List[float], correlation_matrix: List[List[float]]) -> np.ndarray:
    """Builds a covariance matrix from standard deviations and a correlation matrix."""
    vols = np.array(volatilities)
    corrs = np.array(correlation_matrix)
    return np.outer(vols, vols) * corrs

def prepare_simulation_inputs(assets: List[Any]) -> Tuple[np.ndarray, List[float], np.ndarray]:
    """
    Prepares inputs for simulation. 
    Prioritizes precomputed stats from the database for stability.
    """
    # Use precomputed master data from AssetData table as the primary source
    returns_array = np.array([float(a.expected_return) for a in assets])
    volatilities_list = [float(a.volatility) for a in assets]
    n = len(assets)
    
    correlation_matrix_array = np.eye(n)
    for i in range(n):
        for j in range(n):
            if i != j:
                target_code = assets[j].asset_code
                corr = 0.0
                if hasattr(assets[i], 'correlation_matrix') and assets[i].correlation_matrix:
                    corr = assets[i].correlation_matrix.get(target_code, 0.0)
                correlation_matrix_array[i, j] = corr
                
    return returns_array, volatilities_list, correlation_matrix_array

def calculate_stress_test_performance(
    historical_prices_data: List[List[Dict[str, Any]]],
    weights: List[float],
    start_date: str,
    end_date: str
) -> Dict[str, Any]:
    """
    Calculates the performance of a portfolio during a specific historical period.
    Returns cumulative returns and max drawdown.
    """
    weights = np.array(weights)
    # Find all common dates within the range
    all_dates = sorted(list(set(p['date'] for sublist in historical_prices_data for p in sublist if start_date <= p['date'] <= end_date)))
    
    if not all_dates:
        return {"history": [], "max_drawdown": 0.0}

    # Align prices
    aligned_prices = []
    for prices in historical_prices_data:
        price_map = {p['date']: float(p['price']) for p in prices}
        # Forward fill missing prices
        last_known_price = 0.0
        # Find first non-zero price to start with if necessary
        for d in sorted(price_map.keys()):
            if price_map[d] > 0:
                last_known_price = price_map[d]
                break
                
        asset_prices = []
        for d in all_dates:
            price = price_map.get(d, last_known_price)
            asset_prices.append(price)
            if price > 0:
                last_known_price = price
        aligned_prices.append(asset_prices)
    
    aligned_prices = np.array(aligned_prices) # (n_assets, n_dates)
    
    # Normalize to 1.0 at start
    initial_prices = aligned_prices[:, 0][:, np.newaxis]
    initial_prices[initial_prices == 0] = EPSILON
    normalized_prices = aligned_prices / initial_prices
    
    # Portfolio value over time
    portfolio_history = weights @ normalized_prices # (n_dates,)
    cumulative_returns = portfolio_history - 1.0
    
    # Max Drawdown
    running_max = np.maximum.accumulate(portfolio_history)
    drawdowns = (portfolio_history - running_max) / running_max
    # Fill NaNs in drawdowns (can happen if running_max is 0)
    drawdowns = np.nan_to_num(drawdowns, nan=0.0)
    max_drawdown = np.abs(np.min(drawdowns)) if len(drawdowns) > 0 else 0.0
    
    history = []
    for i, d in enumerate(all_dates):
        history.append({
            "date": d,
            "cumulative_return": float(cumulative_returns[i])
        })
        
    return {
        "history": history,
        "max_drawdown": float(max_drawdown)
    }

def calculate_rebalancing_diff(
    current_allocations: Dict[str, float],
    target_allocations: Dict[str, float]
) -> Dict[str, float]:
    """
    Calculates the difference between current and target allocations.
    Positive means buy, negative means sell.
    """
    all_codes = set(current_allocations.keys()) | set(target_allocations.keys())
    diffs = {}
    for code in all_codes:
        current = current_allocations.get(code, 0.0)
        target = target_allocations.get(code, 0.0)
        diffs[code] = target - current
    return diffs

