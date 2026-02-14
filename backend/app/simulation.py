import numpy as np
import cvxpy as cp
from typing import List, Dict, Any
from scipy.optimize import minimize

def calculate_risk_parity_weights(
    covariance_matrix: np.ndarray,
    bounds: List[tuple] = None
) -> np.ndarray:
    """
    各資産のリスク寄与度が均等になるリスクパリティ（ERC）配分を計算します。
    """
    n = covariance_matrix.shape[0]
    if bounds is None:
        bounds = [(0, 1.0) for _ in range(n)]
    
    # 初期値: 均等配分
    init_weights = np.array([1.0 / n] * n)
    
    # 制約: 重みの合計が1
    constraints = [
        {'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0}
    ]
    
    def objective(w):
        # 非常に小さい重みによるゼロ除算を避けるための微小値
        eps = 1e-12
        portfolio_var = w.T @ covariance_matrix @ w
        portfolio_vol = np.sqrt(max(portfolio_var, eps))
        
        # 限界リスク寄与度 (MRC)
        marginal_risk_contribution = (covariance_matrix @ w) / portfolio_vol
        
        # 各資産のリスク寄与度 (RC)
        risk_contributions = w * marginal_risk_contribution
        
        # 目標となるリスク寄与度 (全体の 1/n)
        target_rc = portfolio_vol / n
        
        # 目標との二乗誤差和を最小化
        return np.sum((risk_contributions - target_rc)**2)

    result = minimize(
        objective,
        init_weights,
        method='SLSQP',
        constraints=constraints,
        bounds=bounds,
        tol=1e-10,
        options={'maxiter': 1000}
    )
    
    if not result.success:
        # 最適化に失敗した場合は均等配分を返すか、エラーを投げる
        # ここではフォールバックとして均等配分を返しつつログを出す（実運用ではより詳細な対応が必要）
        return init_weights
        
    return result.x

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

def calculate_portfolio_stats(expected_returns: np.ndarray, covariance_matrix: np.ndarray, weights: np.ndarray) -> tuple[float, float]:
    """
    ポートフォリオの期待リターンとボラティリティを算出します。
    """
    ret = expected_returns @ weights
    vol = np.sqrt(weights.T @ covariance_matrix @ weights)
    return float(ret), float(vol)

def get_asset_returns(historical_prices: List[Dict[str, Any]]) -> np.ndarray:
    """
    Given a list of historical price points for a single asset,
    calculates the daily/weekly returns.
    """
    prices = np.array([point['price'] for point in historical_prices])
    # Calculate daily/weekly returns (percentage change)
    returns = (prices[1:] / prices[:-1]) - 1
    return returns

def calculate_stats_from_historical_data(historical_prices_data: List[List[Dict[str, Any]]]) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    複数の資産の過去価格データから、年間リターン、年間ボラティリティ、相関行列を計算します。
    """
    num_assets = len(historical_prices_data)
    
    # 全ての資産の日次/週次リターンを格納
    all_asset_returns = []
    
    for asset_prices in historical_prices_data:
        if not asset_prices:
            # データがない場合はスキップするか、エラーを出すか、ゼロを埋めるか
            # ここではエラーを出す（またはより適切なハンドリング）
            raise ValueError("Historical prices data cannot be empty for an asset.")
        all_asset_returns.append(get_asset_returns(asset_prices))

    # リターン期間を合わせるために、最短の履歴を持つ資産に合わせる
    min_len = min(len(returns) for returns in all_asset_returns)
    aligned_returns = np.array([returns[-min_len:] for returns in all_asset_returns]).T # (timesteps, num_assets)
    
    # 年率換算係数 (例: 日次リターンなら252, 週次なら52)
    # yfinance.downloadでinterval="1d"を使用しているため、日次リターンを想定
    # （ただし、取得されるデータは営業日のみのため、厳密には252日ではない場合がある）
    annualization_factor = 252 # Assumes daily data
    if min_len < 200: # Heuristic for weekly data if less than ~200 data points over a year
        annualization_factor = 52 # Assumes weekly data

    # 期待リターン (年率)
    annual_returns = np.mean(aligned_returns, axis=0) * annualization_factor

    # 共分散行列 (年率)
    covariance_matrix = np.cov(aligned_returns, rowvar=False) * annualization_factor

    # 相関行列
    correlation_matrix = np.corrcoef(aligned_returns, rowvar=False)
    
    # ボラティリティ (年率)
    annual_volatilities = np.std(aligned_returns, axis=0) * np.sqrt(annualization_factor)

    return annual_returns, annual_volatilities, correlation_matrix

def monte_carlo_simulation(
    mu: float,
    sigma: float,
    initial_investment: float,
    monthly_contribution: float,
    years: int,
    n_simulations: int = 10000,
    extra_investments: List[Dict[str, Any]] = None,
    target_amount: float = None
) -> Dict[str, Any]:
    """
    幾何ブラウン運動を用いたモンテカルロシミュレーションを実行します。
    """
    # 年間のリターン行列を生成 (years, n_simulations)
    # 幾何ブラウン運動: S_t = S_{t-1} * exp((mu - 0.5 * sigma^2) + sigma * epsilon)
    # 簡略化のため、(1 + r) の形式で計算する (離散ステップ)
    # r ~ N(mu, sigma^2)
    daily_returns = np.random.normal(mu, sigma, (years, n_simulations))
    
    # シミュレーション結果の推移を保持
    # (years + 1, n_simulations)
    portfolio_values = np.zeros((years + 1, n_simulations))
    portfolio_values[0] = initial_investment
    
    extra_map = {item["year"]: item["amount"] for item in (extra_investments or [])}
    
    for t in range(1, years + 1):
        # 前年の値にリターンを適用
        portfolio_values[t] = portfolio_values[t-1] * (1 + daily_returns[t-1])
        
        # 毎月の積み立てを加算 (年額換算)
        portfolio_values[t] += monthly_contribution * 12
        
        # 任意の追加投資を加算
        if t in extra_map:
            portfolio_values[t] += extra_map[t]
            
    # 最終的な結果の統計
    final_values = portfolio_values[-1]
    
    # タイル
    percentiles = {
        "10": float(np.percentile(final_values, 10)),
        "25": float(np.percentile(final_values, 25)),
        "50": float(np.percentile(final_values, 50)),
        "75": float(np.percentile(final_values, 75)),
        "90": float(np.percentile(final_values, 90))
    }
    
    # 元本割れ確率 (初期投資 + 積み立て累計 + 追加投資累計)
    total_invested = initial_investment + (monthly_contribution * 12 * years) + sum(extra_map.values())
    prob_loss = float(np.mean(final_values < total_invested))
    
    # 目標到達確率
    prob_target = None
    if target_amount:
        prob_target = float(np.mean(final_values >= target_amount))
        
    # チャート用の推移データ (10, 50, 90タイルを抽出)
    history = []
    for t in range(years + 1):
        history.append({
            "year": t,
            "p10": float(np.percentile(portfolio_values[t], 10)),
            "p50": float(np.percentile(portfolio_values[t], 50)),
            "p90": float(np.percentile(portfolio_values[t], 90))
        })
        
    return {
        "percentiles": percentiles,
        "元本割れ確率": prob_loss,
        "目標到達確率": prob_target,
        "history": history
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

def prepare_simulation_inputs(assets: List[Any]) -> tuple[np.ndarray, List[float], np.ndarray]:
    """
    資産データのリストから、期待リターン、ボラティリティ、相関行列を抽出します。
    historical_pricesが利用可能な場合はそれを使用し、そうでない場合は事前に定義された属性を使用します。
    """
    # historical_pricesが全ての資産で利用可能かチェック
    all_historical_prices_available = all(hasattr(a, 'historical_prices') and a.historical_prices for a in assets)

    if all_historical_prices_available:
        historical_data_for_calculation = [a.historical_prices for a in assets]
        returns_array, volatilities_list, correlation_matrix_array = calculate_stats_from_historical_data(historical_data_for_calculation)
    else:
        # 既存のロジック: 事前に定義された期待リターン、ボラティリティ、相関行列を使用
        returns_array = np.array([float(a.expected_return) for a in assets])
        volatilities_list = [float(a.volatility) for a in assets]
        
        n = len(assets)
        correlation_matrix_array = np.eye(n)
        for i in range(n):
            for j in range(n):
                if i != j:
                    target_code = assets[j].asset_code
                    correlation_matrix_array[i, j] = assets[i].correlation_matrix.get(target_code, 0.0)
                
    return returns_array, volatilities_list, correlation_matrix_array
