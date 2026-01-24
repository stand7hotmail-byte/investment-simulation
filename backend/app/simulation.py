import numpy as np
import cvxpy as cp
from typing import List, Dict, Any

def calculate_efficient_frontier(
    expected_returns: np.ndarray,
    covariance_matrix: np.ndarray,
    asset_codes: List[str],
    n_points: int = 50
) -> Dict[str, Any]:
    """
    平均分散最適化を使用して効率的フロンティアを計算します。
    """
    n_assets = len(expected_returns)
    weights = cp.Variable(n_assets)
    
    # 基本的な制約: 重みの合計 = 1, 各重み >= 0
    constraints = [cp.sum(weights) == 1, weights >= 0]
    
    # 期待リターンとリスク（分散）の定義
    portfolio_return = expected_returns @ weights
    portfolio_variance = cp.quad_form(weights, covariance_matrix)
    
    # フロンティアの範囲を決定するために、最小リターンと最大リターンを求める
    # 最小リターンは最小分散ポートフォリオのリターンとする
    min_var_problem = cp.Problem(cp.Minimize(portfolio_variance), constraints)
    min_var_problem.solve()
    min_return = portfolio_return.value
    
    max_return = np.max(expected_returns)
    
    # リターンターゲットの範囲を作成
    target_returns = np.linspace(min_return, max_return, n_points)
    
    frontier_points = []
    
    for target in target_returns:
        # 特定のリターンターゲットに対する最小リスク問題を解く
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
        except Exception:
            continue
            
    # シャープレシオ最大化ポートフォリオも計算（無リスク資産リターンを0と仮定）
    # シャープレシオ最大化は非線形なので、リスク回避度パラメータをスキャンするか
    # または各ポイントから最大値を抽出する
    max_sharpe_point = None
    if frontier_points:
        max_sharpe = -1
        for p in frontier_points:
            if p["volatility"] > 0:
                sr = p["expected_return"] / p["volatility"]
                if sr > max_sharpe:
                    max_sharpe = sr
                    max_sharpe_point = p
                    
    return {
        "frontier": frontier_points,
        "max_sharpe": max_sharpe_point
    }

def build_covariance_matrix(volatilities: List[float], correlation_matrix: List[List[float]]) -> np.ndarray:
    """
    ボラティリティと相関係数行列から共分散行列を作成します。
    """
    vols = np.array(volatilities)
    corrs = np.array(correlation_matrix)
    # Cov = Diag(vols) * Corr * Diag(vols)
    cov = np.outer(vols, vols) * corrs
    return cov
