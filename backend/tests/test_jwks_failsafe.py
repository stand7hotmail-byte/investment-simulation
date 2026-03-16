import pytest
import jwt
import time
import json
import base64
from unittest.mock import MagicMock, patch
from jwt import PyJWKClient
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

def b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").replace("=", "")

def generate_mock_jwks(kid: str):
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()
    
    numbers = public_key.public_numbers()
    x = numbers.x.to_bytes(32, "big")
    y = numbers.y.to_bytes(32, "big")
    
    return {
        "keys": [
            {
                "kty": "EC",
                "crv": "P-256",
                "x": b64url_encode(x),
                "y": b64url_encode(y),
                "kid": kid,
                "alg": "ES256",
                "use": "sig"
            }
        ]
    }

class FailsafeJWKClient(PyJWKClient):
    """
    JWK client that implements a fail-safe mechanism: 
    If a fetch fails but we have stale keys in the cache, use the stale keys.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._last_successful_jwk_set = None

    def fetch_data(self):
        try:
            data = super().fetch_data()
            self._last_successful_jwk_set = data
            return data
        except Exception as e:
            if self._last_successful_jwk_set:
                print(f"JWKS fetch failed, using stale keys: {e}")
                return self._last_successful_jwk_set
            raise e

def test_jwks_failsafe_logic():
    mock_jwks = generate_mock_jwks("test-kid")
    
    url = "https://example.com/jwks.json"
    client = FailsafeJWKClient(url, cache_keys=True, lifespan=1) # Short lifespan for test
    
    with patch("jwt.PyJWKClient.fetch_data") as mock_fetch:
        # 1. First fetch succeeds
        mock_fetch.return_value = mock_jwks
        
        keys = client.get_signing_keys()
        assert len(keys) == 1
        # PyJWK doesn't have 'kid' attribute, check the internal data if needed or just skip
        assert mock_fetch.call_count == 1
        
        # 2. Wait for lifespan to expire
        time.sleep(1.1)
        
        # 3. Second fetch fails, but failsafe should return cached keys
        mock_fetch.side_effect = Exception("Network timeout")
        
        # This call should normally trigger a fresh fetch because lifespan expired.
        # But since fetch fails, our failsafe should kick in.
        keys = client.get_signing_keys()
        assert len(keys) == 1
        assert mock_fetch.call_count == 2 # Attempted to fetch but failed
