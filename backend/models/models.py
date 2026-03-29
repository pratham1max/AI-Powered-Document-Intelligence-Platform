from datetime import datetime
from sqlalchemy import String, Integer, BigInteger, Float, ForeignKey, Text, DateTime, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
import os

from models.database import Base, DATABASE_URL

# Only use pgvector if explicitly enabled via env var
# Railway's plain PostgreSQL doesn't have pgvector — use JSON instead
_use_pgvector = os.getenv("USE_PGVECTOR", "false").lower() == "true"

if _use_pgvector:
    from pgvector.sqlalchemy import Vector
    _EmbeddingCol = lambda: mapped_column(Vector(3072), nullable=True)
else:
    _EmbeddingCol = lambda: mapped_column(JSON, nullable=True)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    firebase_uid: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # TOTP 2FA (backend-managed, no Firebase TOTP plan needed)
    totp_secret_enc: Mapped[str] = mapped_column(Text, nullable=True)   # AES-encrypted secret
    totp_enabled: Mapped[bool] = mapped_column(default=False)

    documents: Mapped[list["Document"]] = relationship(back_populates="user")
    query_logs: Mapped[list["QueryLog"]] = relationship(back_populates="user")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    enc_path: Mapped[str] = mapped_column(String(512), nullable=True)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=True)
    size_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    # status: pending | processing | ready | error
    status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="documents")
    chunks: Mapped[list["DocumentChunk"]] = relationship(back_populates="document", cascade="all, delete-orphan")
    tags: Mapped[list["Tag"]] = relationship(back_populates="document", cascade="all, delete-orphan")
    query_logs: Mapped[list["QueryLog"]] = relationship(back_populates="document")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"), nullable=False, index=True)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float]] = _EmbeddingCol()

    document: Mapped["Document"] = relationship(back_populates="chunks")


class QueryLog(Base):
    __tablename__ = "query_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"), nullable=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="query_logs")
    document: Mapped["Document"] = relationship(back_populates="query_logs")


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)

    document: Mapped["Document"] = relationship(back_populates="tags")
