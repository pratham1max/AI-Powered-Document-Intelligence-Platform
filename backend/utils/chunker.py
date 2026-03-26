"""
Text chunking utility — splits on sentence boundaries where possible.
"""
import re


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Split text into overlapping chunks, preferring sentence boundaries.

    Args:
        text: Input text to chunk.
        chunk_size: Target character count per chunk.
        overlap: Number of characters to overlap between chunks.

    Returns:
        List of text chunks.
    """
    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []

    # Split into sentences
    sentences = re.split(r"(?<=[.!?])\s+", text)

    chunks: list[str] = []
    current = ""

    for sentence in sentences:
        if len(current) + len(sentence) + 1 <= chunk_size:
            current = f"{current} {sentence}".strip()
        else:
            if current:
                chunks.append(current)
            # If a single sentence exceeds chunk_size, hard-split it
            if len(sentence) > chunk_size:
                for i in range(0, len(sentence), chunk_size - overlap):
                    chunks.append(sentence[i : i + chunk_size])
                current = ""
            else:
                # Start new chunk with overlap from previous
                overlap_text = current[-overlap:] if current and overlap else ""
                current = f"{overlap_text} {sentence}".strip()

    if current:
        chunks.append(current)

    return chunks
