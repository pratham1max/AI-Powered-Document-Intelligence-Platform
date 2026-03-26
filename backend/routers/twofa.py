"""
TOTP 2FA router — backend-managed, no Firebase TOTP plan required.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from models.database import get_db
from models.models import User
from routers.deps import get_current_user
from utils.totp import (
    generate_secret, generate_qr_base64,
    encrypt_secret, decrypt_secret, verify_otp,
)

router = APIRouter()


class OtpBody(BaseModel):
    otp: str

class SetupResponse(BaseModel):
    qr_code: str
    secret: str

class StatusResponse(BaseModel):
    enabled: bool


@router.post("/setup", response_model=SetupResponse)
async def setup_2fa(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a new TOTP secret + QR. Does NOT enable 2FA until verified."""
    secret = generate_secret()
    qr = generate_qr_base64(secret, current_user.email or current_user.firebase_uid)

    current_user.totp_secret_enc = encrypt_secret(secret)
    current_user.totp_enabled = False
    await db.commit()

    return SetupResponse(qr_code=qr, secret=secret)


@router.post("/verify")
async def verify_2fa(
    request: Request,
    body: OtpBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Verify OTP and enable 2FA."""
    if not current_user.totp_secret_enc:
        raise HTTPException(status_code=400, detail="Run /2fa/setup first")

    secret = decrypt_secret(current_user.totp_secret_enc)
    if not verify_otp(secret, body.otp.strip()):
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    current_user.totp_enabled = True
    await db.commit()
    return {"message": "2FA enabled successfully"}


@router.post("/validate-login")
async def validate_login(
    request: Request,
    body: OtpBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Verify OTP during login flow."""
    if not current_user.totp_enabled or not current_user.totp_secret_enc:
        return {"required": False, "valid": True}

    secret = decrypt_secret(current_user.totp_secret_enc)
    if not verify_otp(secret, body.otp.strip()):
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    return {"required": True, "valid": True}


@router.post("/disable")
async def disable_2fa(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Disable 2FA and wipe the stored secret."""
    current_user.totp_enabled = False
    current_user.totp_secret_enc = None
    await db.commit()
    return {"message": "2FA disabled"}


@router.get("/status", response_model=StatusResponse)
async def get_2fa_status(
    current_user: User = Depends(get_current_user),
):
    return StatusResponse(enabled=bool(current_user.totp_enabled))
