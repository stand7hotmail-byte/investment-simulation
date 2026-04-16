
import numpy as np
from backend.app.simulation import calculate_risk_parity_weights

# Case: Highly correlated assets (Singular matrix)
cov = np.array([
    [0.04, 0.0399999, 0.02],
    [0.0399999, 0.04, 0.02],
    [0.02, 0.02, 0.09]
])

print("Attempting Risk Parity with nearly singular matrix...")
weights = calculate_risk_parity_weights(cov)
print(f"Weights: {weights}")

# Risk Contribution Check
port_var = weights.T @ cov @ weights
mrc = (cov @ weights) / np.sqrt(port_var)
rc = weights * mrc
print(f"Risk Contributions: {rc}")
print(f"RC Variance (Ideal is 0): {np.var(rc)}")

# Case: Zero volatility asset (Mathematical breakdown)
cov_zero = np.array([
    [0.04, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.09]
])
print("\nAttempting Risk Parity with zero volatility asset...")
weights_zero = calculate_risk_parity_weights(cov_zero)
print(f"Weights for Zero Volatility Asset: {weights_zero}")
