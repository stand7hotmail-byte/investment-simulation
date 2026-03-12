import pytest
import jwt
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from app.main import get_current_user_id

# Sample payload for testing
PAYLOAD = {
    "sub": "123e4567-e89b-12d3-a456-426614174000",
    "iat": 1516239022
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
    
    with patch("app.main.jwks_client") as mock_jwks:
        mock_jwks.get_signing_key_from_jwt.side_effect = Exception("Key not found")
        
        with pytest.raises(HTTPException) as excinfo:
            await get_current_user_id(credentials)
        
        assert excinfo.value.status_code == 401
        assert "ES256 verification failed (kid: test-kid): Key not found" in excinfo.value.detail

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
    
    with patch("app.main.jwks_client") as mock_jwks:
        # Simulate network error when fetching JWKS
        mock_jwks.get_signing_key_from_jwt.side_effect = jwt.PyJWKClientError("Network error")
        
        with pytest.raises(HTTPException) as excinfo:
            await get_current_user_id(credentials)
        
        assert excinfo.value.status_code == 401
        assert "ES256 JWKS error (kid: test-kid): Network error" in excinfo.value.detail

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
    
    # Create a valid token
    token = jwt.encode(PAYLOAD, private_pem, algorithm="ES256")
    credentials = MagicMock()
    credentials.credentials = token
    
    with patch("app.main.jwks_client") as mock_jwks:
        mock_signing_key = MagicMock()
        mock_signing_key.key = public_pem
        mock_jwks.get_signing_key_from_jwt.return_value = mock_signing_key
        
        result = await get_current_user_id(credentials)
        assert str(result) == PAYLOAD["sub"]
