import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import io

from models.database import get_db
from models.models import Document, User
from schemas.schemas import DocumentOut
from routers.deps import get_current_user
from utils.crypto import encrypt_file, decrypt_file
from tasks.parse_tasks import task_parse_and_embed

router = APIRouter()

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


@router.post("/upload", response_model=DocumentOut, status_code=201)
async def upload_document(
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

    task_parse_and_embed.delay(doc.id, current_user.id, str(enc_path), file.content_type)

    return doc


@router.get("", response_model=list[DocumentOut])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Document).where(Document.user_id == current_user.id).order_by(Document.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{doc_id}", response_model=DocumentOut)
async def get_document(
    doc_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = await db.get(Document, doc_id)
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/{doc_id}/download")
async def download_document(
    doc_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = await db.get(Document, doc_id)
    if not doc or doc.user_id != current_user.id:
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
    doc = await db.get(Document, doc_id)
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    from pathlib import Path
    enc = Path(doc.enc_path)
    if enc.exists():
        enc.unlink()

    await db.delete(doc)
    await db.commit()
