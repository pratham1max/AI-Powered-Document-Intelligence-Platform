import logging
import json
import math
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import google.generativeai as genai
import os

from models.database import get_db, DATABASE_URL
from models.models import Document, DocumentChunk, QueryLog, User
from schemas.schemas import QueryRequest, QueryResponse, SourceChunk, SummarizeRequest, SummarizeResponse
from routers.deps import get_current_user
from utils.embeddings import get_embedding

router = APIRouter()
logger = logging.getLogger(__name__)

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
gemini = genai.GenerativeModel("gemini-1.5-flash")

TOP_K = 5
_use_pgvector = "postgresql" in DATABASE_URL


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    return dot / (mag_a * mag_b) if mag_a and mag_b else 0.0


@router.post("/query", response_model=QueryResponse)
async def query_documents(
    body: QueryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for doc_id in body.document_ids:
        doc = await db.get(Document, doc_id)
        if not doc or doc.user_id != current_user.id:
            raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")

    query_embedding = get_embedding(body.question)

    # Fetch chunks and rank by cosine similarity in Python (works for both SQLite and pgvector)
    result = await db.execute(
        select(DocumentChunk).where(DocumentChunk.document_id.in_(body.document_ids))
    )
    all_chunks = result.scalars().all()

    if not all_chunks:
        raise HTTPException(status_code=404, detail="No content found in selected documents")

    scored = []
    for chunk in all_chunks:
        emb = chunk.embedding
        if emb is None:
            continue
        if isinstance(emb, str):
            emb = json.loads(emb)
        score = _cosine_similarity(query_embedding, emb)
        scored.append((score, chunk))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_chunks = [c for _, c in scored[:TOP_K]] if scored else all_chunks[:TOP_K]

    context = "\n\n".join(f"[Chunk {c.chunk_index}]: {c.content}" for c in top_chunks)
    prompt = (
        f"Answer the following question based only on the provided context.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {body.question}\n\nAnswer:"
    )

    response = gemini.generate_content(prompt)
    answer = response.text

    log = QueryLog(
        user_id=current_user.id,
        document_id=body.document_ids[0] if len(body.document_ids) == 1 else None,
        question=body.question,
        answer=answer,
    )
    db.add(log)
    await db.commit()

    sources = [SourceChunk(document_id=c.document_id, chunk_index=c.chunk_index, content=c.content) for c in top_chunks]
    return QueryResponse(answer=answer, sources=sources)


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_document(
    body: SummarizeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = await db.get(Document, body.document_id)
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    result = await db.execute(
        select(DocumentChunk.content)
        .where(DocumentChunk.document_id == body.document_id)
        .order_by(DocumentChunk.chunk_index)
    )
    chunks = result.scalars().all()
    if not chunks:
        raise HTTPException(status_code=404, detail="No content available for this document")

    full_text = " ".join(chunks)
    content = full_text[:3000] if body.length == "short" else full_text[:12000]
    style = "in 2-3 sentences" if body.length == "short" else "in detail with key points"
    prompt = f"Summarize the following document {style}:\n\n{content}"

    response = gemini.generate_content(prompt)
    return SummarizeResponse(summary=response.text)
