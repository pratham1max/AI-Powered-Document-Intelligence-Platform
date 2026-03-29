from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

_env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(_env_path, override=True)

from routers import auth, documents, query, analytics
from routers import twofa, fileops
from sqlalchemy import text
from models.database import engine
from models import models


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        # Enable pgvector extension if available (PostgreSQL only)
        try:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        except Exception:
            pass  # SQLite or extension already exists
        await conn.run_sync(models.Base.metadata.create_all)
    yield


app = FastAPI(
    title="AI Document Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://ai-powered-document-intelligence-pl-beta.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(query.router, prefix="/query", tags=["query"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(twofa.router, prefix="/2fa", tags=["2fa"])
app.include_router(fileops.router, prefix="/fileops", tags=["fileops"])


@app.get("/health")
async def health():
    return {"status": "ok"}
