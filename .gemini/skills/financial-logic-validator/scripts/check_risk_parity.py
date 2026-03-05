import numpy as np
import sys
import json

def validate_weights(weights):
    """Checks if weights sum to 1.0 and are non-negative."""
    total = sum(weights.values())
    is_valid = np.isclose(total, 1.0, atol=1e-4)
    all_positive = all(w >= -1e-6 for w in weights.values())
    return is_valid, all_positive, total

def check_risk_parity(weights_dict, cov_matrix_dict):
    """
    Verifies if risk contributions are equal.
    weights_dict: {asset_code: weight}
    cov_matrix_dict: {asset_code: {asset_code: value}}
    """
    assets = sorted(weights_dict.keys())
    w = np.array([weights_dict[a] for a in assets])
    
    # Reconstruct cov matrix as numpy array
    n = len(assets)
    sigma = np.zeros((n, n))
    for i, a1 in enumerate(assets):
        for j, a2 in enumerate(assets):
            sigma[i, j] = cov_matrix_dict[a1][a2]
            
    # Portfolio volatility
    portfolio_vol = np.sqrt(w.T @ sigma @ w)
    
    # Marginal Risk Contribution
    mrc = (sigma @ w) / portfolio_vol
    
    # Risk Contribution
    rc = w * mrc
    
    # Percentage Risk Contribution
    rc_pct = rc / portfolio_vol
    
    is_balanced = np.all(np.isclose(rc_pct, 1.0/n, atol=1e-2))
    
    return {
        "is_balanced": bool(is_balanced),
        "volatility": float(portfolio_vol),
        "risk_contributions": {assets[i]: float(rc_pct[i]) for i in range(n)}
    }

if __name__ == "__main__":
    # Example usage for CLI testing
    if len(sys.argv) > 1:
        data = json.loads(sys.argv[1])
        if "weights" in data and "cov" in data:
            result = check_risk_parity(data["weights"], data["cov"])
            print(json.dumps(result, indent=2))
