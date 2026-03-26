"""
Celery tasks for the 'crypto' queue — encrypt and decrypt document files.
"""
from celery_app import app
from utils.crypto import encrypt_file, decrypt_file
from cryptography.exceptions import InvalidTag
import logging

logger = logging.getLogger(__name__)


@app.task(bind=True, queue="crypto", max_retries=3, default_retry_delay=5)
def task_encrypt_file(self, file_bytes_hex: str, user_id: int, filename: str) -> str:
    """
    Encrypt a file and return the path to the .enc file.

    Args:
        file_bytes_hex: Hex-encoded file bytes (JSON-serializable).
        user_id: Owner's user ID for key derivation.
        filename: Original filename (used in .enc path).

    Returns:
        String path to the encrypted file.
    """
    try:
        file_bytes = bytes.fromhex(file_bytes_hex)
        enc_path = encrypt_file(file_bytes, user_id, filename)
        logger.info("Encrypted file for user %s: %s", user_id, enc_path)
        return str(enc_path)
    except Exception as exc:
        logger.error("Encryption failed for user %s: %s", user_id, exc)
        raise self.retry(exc=exc)


@app.task(bind=True, queue="crypto", max_retries=3, default_retry_delay=5)
def task_decrypt_file(self, enc_path: str, user_id: int) -> str:
    """
    Decrypt a file and return hex-encoded plaintext bytes.

    Args:
        enc_path: Path to the .enc file.
        user_id: Owner's user ID for key derivation.

    Returns:
        Hex-encoded decrypted bytes.
    """
    try:
        plaintext = decrypt_file(enc_path, user_id)
        return plaintext.hex()
    except (FileNotFoundError, InvalidTag) as exc:
        logger.error("Decryption failed for %s: %s", enc_path, exc)
        raise  # Don't retry on integrity/not-found errors
    except Exception as exc:
        logger.error("Unexpected decryption error: %s", exc)
        raise self.retry(exc=exc)
