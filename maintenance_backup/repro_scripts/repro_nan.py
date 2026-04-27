
import numpy as np
import json
from decimal import Decimal

def test_json_nan():
    data = {
        "expected_return": Decimal("0.05"),
        "correlation_matrix": {"ABC": np.nan}
    }
    try:
        # Simulate FastAPI serialization (simplified)
        def custom_encoder(obj):
            if isinstance(obj, Decimal):
                return float(obj)
            raise TypeError
        
        json_str = json.dumps(data, default=custom_encoder)
        print(f"Serialized: {json_str}")
    except Exception as e:
        print(f"Serialization failed: {e}")

if __name__ == "__main__":
    test_json_nan()
