"""
AES-256-GCM encryption/decryption with per-user PBKDF2 key derivation.
File format: [16-byte salt][12-byte nonce][16-byte tag][ciphertext]
"""
import os
import struct
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.exceptions import InvalidTag

MASTER_SECRET = os.getenv("MASTER_SECRET", "").encode()
ENCRYPTED_FILES_DIR = Path(os.getenv("ENCRYPTED_FILES_DIR", "/app/encrypted_files"))
PBKDF2_ITERATIONS = 100_000
KEY_LENGTH = 32  # 256-bit


def _derive_key(user_id: int, salt: bytes) -> bytes:
    """Derive a per-user AES-256 key using PBKDF2HMAC."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=KEY_LENGTH,
        salt=salt + str(user_id).encode(),
        iterations=PBKDF2_ITERATIONS,
    )
    return kdf.derive(MASTER_SECRET)


def encrypt_file(file_bytes: bytes, user_id: int, filename: str) -> Path:
    """
    Encrypt file_bytes with AES-256-GCM and save as .enc file.

    Returns the path to the encrypted file.
    Raises: ValueError if MASTER_SECRET is not set.
    """
    if not MASTER_SECRET:
        raise ValueError("MASTER_SECRET environment variable is not set")

    ENCRYPTED_FILES_DIR.mkdir(parents=True, exist_ok=True)

    salt = os.urandom(16)
    nonce = os.urandom(12)
    key = _derive_key(user_id, salt)

    aesgcm = AESGCM(key)
    # AESGCM.encrypt returns ciphertext + 16-byte tag appended
    ct_with_tag = aesgcm.encrypt(nonce, file_bytes, None)
    ciphertext = ct_with_tag[:-16]
    tag = ct_with_tag[-16:]

    enc_path = ENCRYPTED_FILES_DIR / f"{user_id}_{filename}.enc"
    with open(enc_path, "wb") as f:
        f.write(salt)       # 16 bytes
        f.write(nonce)      # 12 bytes
        f.write(tag)        # 16 bytes
        f.write(ciphertext) # variable

    return enc_path


def decrypt_file(enc_path: str | Path, user_id: int) -> bytes:
    """
    Decrypt an .enc file and return raw bytes.

    Raises:
        FileNotFoundError: if enc_path does not exist.
        InvalidTag: if file has been tampered with.
        ValueError: if file format is invalid.
    """
    enc_path = Path(enc_path)
    if not enc_path.exists():
        raise FileNotFoundError(f"Encrypted file not found: {enc_path}")

    with open(enc_path, "rb") as f:
        data = f.read()

    if len(data) < 44:  # 16 + 12 + 16 minimum
        raise ValueError("Invalid encrypted file format")

    salt = data[:16]
    nonce = data[16:28]
    tag = data[28:44]
    ciphertext = data[44:]

    key = _derive_key(user_id, salt)
    aesgcm = AESGCM(key)

    try:
        plaintext = aesgcm.decrypt(nonce, ciphertext + tag, None)
    except InvalidTag:
        raise InvalidTag("File integrity check failed — possible tampering detected")

    return plaintext
