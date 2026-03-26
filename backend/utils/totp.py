"""
TOTP utility — generate secrets, QR codes, verify OTPs.
Secrets are AES-256-GCM encrypted before DB storage.
"""
import os
import base64
import pyotp
import qrcode
import io
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

MASTER_SECRET = os.getenv("MASTER_SECRET", "").encode()
ISSUER = "DocIntel"


# ── Encryption helpers ────────────────────────────────────────────────────────

def _totp_key() -> bytes:
    """Derive a 32-byte AES key from MASTER_SECRET for TOTP secrets."""
    import hashlib
    return hashlib.sha256(MASTER_SECRET + b":totp").digest()


def encrypt_secret(plain: str) -> str:
    """Encrypt a TOTP secret string → base64-encoded ciphertext."""
    key = _totp_key()
    nonce = os.urandom(12)
    ct = AESGCM(key).encrypt(nonce, plain.encode(), None)
    return base64.b64encode(nonce + ct).decode()


def decrypt_secret(enc: str) -> str:
    """Decrypt a base64-encoded TOTP secret back to plain string."""
    key = _totp_key()
    raw = base64.b64decode(enc)
    nonce, ct = raw[:12], raw[12:]
    return AESGCM(key).decrypt(nonce, ct, None).decode()


# ── TOTP helpers ──────────────────────────────────────────────────────────────

def generate_secret() -> str:
    """Generate a new random TOTP base32 secret."""
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str) -> str:
    """Build the otpauth:// URI for QR code generation."""
    return pyotp.totp.TOTP(secret).provisioning_uri(
        name=email,
        issuer_name=ISSUER,
    )


def generate_qr_base64(secret: str, email: str) -> str:
    """Generate a QR code PNG as a base64 data URI."""
    uri = get_totp_uri(secret, email)
    img = qrcode.make(uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/png;base64,{b64}"


def verify_otp(secret: str, otp: str) -> bool:
    """Verify a 6-digit OTP against the secret. Allows ±1 window for clock drift."""
    totp = pyotp.TOTP(secret)
    return totp.verify(otp, valid_window=1)
