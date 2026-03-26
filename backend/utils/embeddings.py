"""
Gemini embedding utility using google-genai SDK.
Model: gemini-embedding-001 (3072 dims)
"""
import os
import logging
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from google import genai

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
EMBEDDING_MODEL = "models/gemini-embedding-001"
EMBEDDING_DIM = 3072


@retry(
    wait=wait_exponential(multiplier=1, min=2, max=60),
    stop=stop_after_attempt(5),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
def get_embedding(text: str) -> list[float]:
    """Return a 3072-dim embedding vector for text using Gemini."""
    client = genai.Client(api_key=GEMINI_API_KEY)
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
    )
    return result.embeddings[0].values
