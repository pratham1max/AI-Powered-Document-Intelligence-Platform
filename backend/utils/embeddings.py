"""
Gemini embedding utility with exponential backoff for free-tier rate limits.
"""
import os
import time
import logging
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

import google.generativeai as genai

logger = logging.getLogger(__name__)

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

EMBEDDING_MODEL = "models/embedding-001"
EMBEDDING_DIM = 768


@retry(
    wait=wait_exponential(multiplier=1, min=2, max=60),
    stop=stop_after_attempt(5),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
def get_embedding(text: str) -> list[float]:
    """
    Get a 768-dimension embedding vector for the given text using Gemini.
    Retries with exponential backoff on rate limit errors.
    """
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_document",
    )
    return result["embedding"]
