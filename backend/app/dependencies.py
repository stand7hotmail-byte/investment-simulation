import uuid
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .database import SessionLocal
from .config import settings

# --- AUTHENTICATION HELPERS ---

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

# Shared JWKS client cache
_jwks_client: Optional[jwt.PyJWKClient] = None

class FailsafeJWKClient(jwt.PyJWKClient):
    """
    JWK client that implements a fail-safe mechanism: 
    If a fetch fails but we have stale keys in the cache, use the stale keys.
    """
    def __init__(self, *args, **kwargs):
        kwargs.pop("request_options", None)
        super().__init__(*args, **kwargs)
        self._last_successful_jwk_set = None

    def fetch_data(self):
        try:
            data = super().fetch_data()
            self._last_successful_jwk_set = data
            return data
        except Exception as e:
            if self._last_successful_jwk_set:
                return self._last_successful_jwk_set
            raise e

def get_jwks_client() -> Optional[jwt.PyJWKClient]:
    global _jwks_client
    if _jwks_client:
        return _jwks_client
    if settings.supabase_url:
        jwks_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/jwks"
        _jwks_client = FailsafeJWKClient(jwks_url, cache_keys=True, lifespan=86400)
        return _jwks_client
    return None

# --- DEPENDENCIES ---

def get_db():
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_optional_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security)
) -> Optional[uuid.UUID]:
    """Authenticates the user or returns None if missing/invalid."""
    if not credentials or not credentials.credentials:
        return None
        
    token = credentials.credentials
    if token in ("null", "undefined", "") or token.count('.') != 2:
        return None

    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
        
        if alg == "ES256":
            client = get_jwks_client()
            if not client: return None
            signing_key = client.get_signing_key_from_jwt(token)
            key = signing_key.key
            # Harden: Verify audience and issuer for ES256 (Supabase)
            expected_iss = f"{settings.supabase_url.rstrip('/')}/auth/v1" if settings.supabase_url else None
            options = {
                "verify_aud": True, 
                "verify_iss": True if expected_iss else False
            }
            payload = jwt.decode(
                token, 
                key, 
                algorithms=[alg], 
                audience="authenticated",
                issuer=expected_iss,
                options=options
            )
        else:
            key = (settings.supabase_jwt_secret or "").strip()
            if not key: return None
            # Harden: Verify audience for HS256
            options = {"verify_aud": True}
            payload = jwt.decode(
                token, 
                key, 
                algorithms=[alg], 
                audience="authenticated",
                options=options
            )
        user_id = payload.get("sub")
        return uuid.UUID(user_id) if user_id else None
    except Exception:
        return None

async def get_current_user_id(
    user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)
) -> uuid.UUID:
    """Strict authentication dependency."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id
