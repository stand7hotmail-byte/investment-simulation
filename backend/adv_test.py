import numpy as np
import logging
from app import simulation

def test_risk_parity_high_correlation():
    # Highly correlated assets (correlation = 1.0 - EPSILON)
    # This often causes the covariance matrix to be near-singular
    vols = np.array([0.2, 0.2])
    corr = 0.999999
    cov = np.array([
        [vols[0]**2, vols[0]*vols[1]*corr],
        [vols[0]*vols[1]*corr, vols[1]**2]
    ])
    
    print("\nTesting high correlation...")
    weights = simulation.calculate_risk_parity_weights(cov)
    print(f"Weights: {weights}")
    assert not np.any(np.isnan(weights))
    assert np.isclose(np.sum(weights), 1.0)

def test_risk_parity_zero_vol():
    # One asset has zero volatility
    cov = np.array([
        [0.0, 0.0],
        [0.0, 0.04]
    ])
    print("\nTesting zero volatility...")
    weights = simulation.calculate_risk_parity_weights(cov)
    print(f"Weights: {weights}")
    assert not np.any(np.isnan(weights))
    assert np.isclose(np.sum(weights), 1.0)

def test_risk_parity_singular_matrix():
    # Singular covariance matrix
    cov = np.array([
        [0.04, 0.04],
        [0.04, 0.04]
    ])
    print("\nTesting singular matrix...")
    weights = simulation.calculate_risk_parity_weights(cov)
    print(f"Weights: {weights}")
    assert not np.any(np.isnan(weights))
    assert np.isclose(np.sum(weights), 1.0)

if __name__ == "__main__":
    try:
        test_risk_parity_high_correlation()
        test_risk_parity_zero_vol()
        test_risk_parity_singular_matrix()
        print("\nAll adversarial tests passed!")
    except Exception as e:
        print(f"\nAdversarial test FAILED: {e}")
        import traceback
        traceback.print_exc()
