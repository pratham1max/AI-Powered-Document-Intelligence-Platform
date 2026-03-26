import uuid
import os
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import io

from models.database import get_db
from models.models import Document, User
from schemas.schemas import DocumentOut
from routers.deps import get_current_user
from utils.crypto import encrypt_file, decrypt_file

router = APIRouter()
logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


def _try_celery(doc_id: int, user_id: int, enc_path: str, mime_type: str) -> bool:
    """Try to dispatch via Celery. Returns True if dispatched, False if Redis unavailable."""
    try:
        from tasks.parse_tasks import task_parse_and_embed
        task_parse_and_embed.delay(doc_id, user_id, enc_path, mime_type)
        return True
    except Exception as e:
        logger.info("Celery unavailable (%s), using inline processing", e)
        return False


async def _process_inline(doc_id: int, user_id: int, enc_path: str, mime_type: str):
    """
    Inline async document processing — used when Celery/Redis is not running.
    Runs as a FastAPI BackgroundTask so it doesn't block the upload response.
    """
    from tasks.parse_tasks import extract_text
    from utils.chunker import chunk_text
    from utils.embeddings import get_embedding
    from models.database import AsyncSessionLocal
    from models.models import DocumentChunk

    async with AsyncSessionLocal() as session:
        doc = await session.get(Document, doc_id)
        if not doc:
            return
        try:
            doc.status = "processing"
            await session.commit()

            file_bytes = decrypt_file(enc_path, user_id)
            text = extract_text(file_bytes, mime_type)
            chunks = chunk_text(text)

            if not chunks:
                doc.status = "ready"
                await session.commit()
                return

            for i, chunk_content in enumerate(chunks):
                try:
                    embedding = get_embedding(chunk_content)
                except Exception as emb_err:
                    logger.warning("Embedding failed for chunk %d: %s", i, emb_err)
                    embedding = None

                session.add(DocumentChunk(
                    document_id=doc_id,
                    chunk_index=i,
                    content=chunk_content,
                    embedding=embedding,
                ))

            doc.status = "ready"
            await session.commit()
            logger.info("Document %d processed inline: %d chunks", doc_id, len(chunks))

        except Exception as exc:
            logger.error("Inline processing failed for doc %d: %s", doc_id, exc, exc_info=True)
            doc.status = "error"
            await session.commit()


@router.post("/upload", response_model=DocumentOut, status_code=201)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported file type")

    file_bytes = await file.read()
    safe_name = f"{uuid.uuid4().hex}_{file.filename}"
    enc_path = encrypt_file(file_bytes, current_user.id, safe_name)

    doc = Document(
        user_id=current_user.id,
        filename=safe_name,
        original_name=file.filename,
        enc_path=str(enc_path),
        mime_type=file.content_type,
        size_bytes=len(file_bytes),
        status="pending",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Try Celery first; fall back to FastAPI BackgroundTasks (no asyncio.run needed)
    dispatched = _try_celery(doc.id, current_user.id, str(enc_path), file.content_type)
    if not dispatched:
        background_tasks.add_task(
            _process_inline, doc.id, current_user.id, str(enc_path), file.content_type
        )

    result = await db.execute(
        select(Document).options(selectinload(Document.tags)).where(Document.id == doc.id)
    )
    return result.scalar_one()


@router.get("", response_model=list[DocumentOut])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Document)
        .options(selectinload(Document.tags))
        .where(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{doc_id}", response_model=DocumentOut)
async def get_document(
    doc_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Document)
        .options(selectinload(Document.tags))
        .where(Document.id == doc_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/{doc_id}/download")
async def download_document(
    doc_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    plaintext = decrypt_file(doc.enc_path, current_user.id)
    return StreamingResponse(
        io.BytesIO(plaintext),
        media_type=doc.mime_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{doc.original_name}"'},
    )


@router.delete("/{doc_id}", status_code=204)
async def delete_document(
    doc_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    from pathlib import Path
    enc = Path(doc.enc_path)
    if enc.exists():
        enc.unlink()

    await db.delete(doc)
    await db.commit()
