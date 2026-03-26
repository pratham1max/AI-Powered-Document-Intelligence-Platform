from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# --- Auth ---
class UserOut(BaseModel):
    id: int
    email: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- Documents ---
class TagOut(BaseModel):
    label: str
    confidence: float

    model_config = {"from_attributes": True}


class DocumentOut(BaseModel):
    id: int
    filename: str
    original_name: str
    mime_type: Optional[str]
    size_bytes: int
    status: str
    created_at: datetime
    tags: list[TagOut] = []

    model_config = {"from_attributes": True}


# --- Query ---
class QueryRequest(BaseModel):
    document_ids: list[int]
    question: str


class SourceChunk(BaseModel):
    document_id: int
    chunk_index: int
    content: str


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]


class SummarizeRequest(BaseModel):
    document_id: int
    length: str = "short"  # "short" | "detailed"


class SummarizeResponse(BaseModel):
    summary: str


# --- Analytics ---
class AnalyticsSummary(BaseModel):
    total_documents: int
    total_queries: int
    storage_bytes: int


class TrendingDoc(BaseModel):
    document_id: int
    original_name: str
    query_count: int
