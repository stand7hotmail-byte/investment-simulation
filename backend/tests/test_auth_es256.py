import pytest
import jwt
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from app.dependencies import get_current_user_id, get_optional_user_id

# Sample payload for testing
PAYLOAD = {
    "sub": "123e4567-e89b-12d3-a456-426614174000",
    "iat": 1516239022,
    "aud": "authenticated"
}

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest.mark.anyio
async def test_auth_es256_unauthorized_due_to_unknown_key():
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    
    private_key = ec.generate_private_key(ec.SECP256R1())
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    # Create token with kid in header
    token = jwt.encode(PAYLOAD, private_pem, algorithm="ES256", headers={"kid": "test-kid"})
    credentials = MagicMock()
    credentials.credentials = token
    
    with patch("app.dependencies._jwks_client") as mock_jwks:
        mock_jwks.get_signing_key_from_jwt.side_effect = Exception("Key not found")
        
        # get_optional_user_id should return None on failure
        result = await get_optional_user_id(credentials)
        assert result is None
        
        # get_current_user_id should raise 401 if it gets None
        with pytest.raises(HTTPException) as excinfo:
            await get_current_user_id(None)
        
        assert excinfo.value.status_code == 401

@pytest.mark.anyio
async def test_auth_es256_jwks_fetch_failure():
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    
    private_key = ec.generate_private_key(ec.SECP256R1())
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    token = jwt.encode(PAYLOAD, private_pem, algorithm="ES256", headers={"kid": "test-kid"})
    credentials = MagicMock()
    credentials.credentials = token
    
    with patch("app.dependencies._jwks_client") as mock_jwks:
        # Simulate network error when fetching JWKS
        mock_jwks.get_signing_key_from_jwt.side_effect = jwt.PyJWKClientError("Network error")
        
        # Should return None instead of raising
        result = await get_optional_user_id(credentials)
        assert result is None
        
        with pytest.raises(HTTPException) as excinfo:
            await get_current_user_id(None)
        
        assert excinfo.value.status_code == 401

@pytest.mark.anyio
async def test_auth_es256_success():
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    
    # Generate a real ES256 key pair
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()
    
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    # Define expected issuer based on settings
    test_url = "https://test.supabase.co"
    expected_iss = f"{test_url}/auth/v1"
    
    # Create a valid token with matching issuer
    payload = PAYLOAD.copy()
    payload["iss"] = expected_iss
    token = jwt.encode(payload, private_pem, algorithm="ES256")
    
    credentials = MagicMock()
    credentials.credentials = token
    
    with patch("app.dependencies._jwks_client") as mock_jwks, \
         patch("app.dependencies.settings.supabase_url", test_url):
        mock_signing_key = MagicMock()
        mock_signing_key.key = public_pem
        mock_jwks.get_signing_key_from_jwt.return_value = mock_signing_key
        
        result = await get_optional_user_id(credentials)
        assert str(result) == PAYLOAD["sub"]
        
        # Also check current_user_id wrapper
        wrapped_result = await get_current_user_id(result)
        assert wrapped_result == result
