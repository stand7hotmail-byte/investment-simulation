import json
import sys
import numpy as np

def validate_weights(weights):
    """Checks if weights sum to 1.0."""
    total = sum(weights.values())
    if not np.isclose(total, 1.0, atol=1e-4):
        return False, f"Weights sum to {total}, expected 1.0"
    return True, "Weights sum to 1.0"

def validate_risk_parity(weights, cov_matrix):
    """Checks if risk contributions are approximately equal."""
    w = np.array(list(weights.values()))
    portfolio_vol = np.sqrt(w.T @ cov_matrix @ w)
    mrc = (cov_matrix @ w) / portfolio_vol
    rc = w * mrc
    
    # Check variance of risk contributions
    rc_var = np.var(rc)
    if rc_var > 1e-6:
        return False, f"Risk contributions variance too high: {rc_var}"
    return True, "Risk contributions are balanced (ERC)"

def main():
    if len(sys.argv) < 2:
        print("Usage: python validate_results.py <result_json_path>")
        sys.exit(1)
        
    try:
        with open(sys.argv[1], 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"[ERROR] Failed to read JSON: {e}")
        sys.exit(1)
        
    # Check for weights in different levels
    weights = None
    if 'weights' in data:
        weights = data['weights']
    elif 'results' in data and 'weights' in data['results']:
        weights = data['results']['weights']
    elif 'max_sharpe' in data and 'weights' in data['max_sharpe']:
        weights = data['max_sharpe']['weights']

    if weights:
        success, msg = validate_weights(weights)
        print(f"[{'SUCCESS' if success else 'FAILURE'}] {msg}")
    else:
        print("[SKIP] No weights found to validate.")
        
    print("Validation complete.")

if __name__ == "__main__":
    main()
