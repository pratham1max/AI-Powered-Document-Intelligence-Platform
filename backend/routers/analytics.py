from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from datetime import datetime, timedelta

from models.database import get_db
from models.models import Document, QueryLog, User
from schemas.schemas import AnalyticsSummary, TrendingDoc
from routers.deps import get_current_user

router = APIRouter()


@router.get("/summary", response_model=AnalyticsSummary)
async def analytics_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_docs = await db.scalar(
        select(func.count()).where(Document.user_id == current_user.id)
    )
    total_queries = await db.scalar(
        select(func.count()).where(QueryLog.user_id == current_user.id)
    )
    storage = await db.scalar(
        select(func.coalesce(func.sum(Document.size_bytes), 0)).where(Document.user_id == current_user.id)
    )
    return AnalyticsSummary(
        total_documents=total_docs or 0,
        total_queries=total_queries or 0,
        storage_bytes=storage or 0,
    )


@router.get("/trending", response_model=list[TrendingDoc])
async def trending_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = datetime.utcnow() - timedelta(days=7)
    result = await db.execute(
        select(Document.id, Document.original_name, func.count(QueryLog.id).label("query_count"))
        .join(QueryLog, QueryLog.document_id == Document.id, isouter=True)
        .where(Document.user_id == current_user.id)
        .where(QueryLog.created_at >= since)
        .group_by(Document.id, Document.original_name)
        .order_by(func.count(QueryLog.id).desc())
        .limit(10)
    )
    rows = result.fetchall()
    return [TrendingDoc(document_id=r.id, original_name=r.original_name, query_count=r.query_count) for r in rows]
