"""
Firebase ID token verification without a service account.
Uses Firebase's public JWKS endpoint to verify tokens locally — no ADC needed.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os, json, time
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"), override=True)

import httpx
from jose import jwt, JWTError
from jose.backends import RSAKey

from models.database import get_db
from models.models import User

bearer = HTTPBearer()

FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")
JWKS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"

# Simple in-process cache for public keys (refreshed when expired)
_jwks_cache: dict = {}
_jwks_fetched_at: float = 0
_JWKS_TTL = 3600  # 1 hour


def _get_public_keys() -> dict:
    global _jwks_cache, _jwks_fetched_at
    if _jwks_cache and (time.time() - _jwks_fetched_at) < _JWKS_TTL:
        return _jwks_cache
    resp = httpx.get(JWKS_URL, timeout=10)
    resp.raise_for_status()
    _jwks_cache = resp.json()  # {kid: x509_cert_pem}
    _jwks_fetched_at = time.time()
    return _jwks_cache


def _verify_firebase_token(id_token: str) -> dict:
    """Verify a Firebase ID token using Google's public keys. No service account needed."""
    if not FIREBASE_PROJECT_ID:
        raise ValueError("FIREBASE_PROJECT_ID not set in .env")

    # Decode header to get kid
    header = jwt.get_unverified_header(id_token)
    kid = header.get("kid")
    if not kid:
        raise JWTError("Missing kid in token header")

    keys = _get_public_keys()
    if kid not in keys:
        # Force refresh and retry once
        global _jwks_fetched_at
        _jwks_fetched_at = 0
        keys = _get_public_keys()
    if kid not in keys:
        raise JWTError(f"Unknown kid: {kid}")

    cert_pem = keys[kid]

    payload = jwt.decode(
        id_token,
        cert_pem,
        algorithms=["RS256"],
        audience=FIREBASE_PROJECT_ID,
        issuer=f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}",
        options={"verify_exp": True},
    )
    return payload


async def get_current_user(
    credentials_: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        decoded = _verify_firebase_token(credentials_.credentials)
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}")
    except Exception as e:
        import logging
        logging.getLogger(__name__).error("Auth failed: %s | project_id=%s", e, FIREBASE_PROJECT_ID)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Auth failed: {e}")

    firebase_uid: str = decoded["sub"]
    email: str = decoded.get("email", "")

    # Upsert user keyed on firebase_uid
    user = await db.scalar(select(User).where(User.firebase_uid == firebase_uid))
    if not user:
        user = User(firebase_uid=firebase_uid, email=email)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    elif user.email != email and email:
        user.email = email
        await db.commit()

    return user
