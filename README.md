<div align="center">

<img src="https://img.shields.io/badge/DocIntel-AI%20Document%20Intelligence-6366f1?style=for-the-badge&logo=files&logoColor=white" alt="DocIntel" />

# DocIntel — AI-Powered Document Intelligence Platform

**Upload documents. Ask questions. Get answers. Secured with AES-256.**

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-Visit%20App-6366f1?style=for-the-badge)](https://ai-powered-document-intelligence-pl-beta.vercel.app/app)
[![GitHub Stars](https://img.shields.io/github/stars/pratham1max/AI-Powered-Document-Intelligence-Platform?style=for-the-badge&color=yellow)](https://github.com/pratham1max/AI-Powered-Document-Intelligence-Platform/stargazers)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://docker.com)
[![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![Deployed on Railway](https://img.shields.io/badge/Backend-Railway-0B0D0E?style=flat-square&logo=railway)](https://railway.app)

</div>

---

## 🌐 Live Demo

> **Try it now:** [https://ai-powered-document-intelligence-pl-beta.vercel.app/app](https://ai-powered-document-intelligence-pl-beta.vercel.app/app)

---

## 📖 Overview

DocIntel is a full-stack, production-ready document intelligence platform. Upload any document and instantly ask natural language questions, generate summaries, and extract insights — all powered by Google Gemini AI with enterprise-grade AES-256-GCM encryption.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Q&A** | Ask questions across documents using semantic search + Gemini 2.5 Flash |
| 📝 **Smart Summaries** | Short or detailed document summaries on demand |
| 🔐 **AES-256-GCM Encryption** | All files encrypted at rest with per-user PBKDF2-derived keys |
| 🔑 **Firebase Auth** | Email/Password + Google OAuth sign-in |
| 🛡️ **TOTP 2FA** | Google Authenticator / Authy support (backend-managed) |
| 📄 **File Operations** | Lock files with passwords, convert formats (PDF↔DOCX↔TXT) |
| 🔒 **Selective Encryption** | Encrypt specific text blocks within documents |
| 📦 **Secure ZIP Download** | AES-256 encrypted ZIP packaging |
| 📊 **Analytics Dashboard** | Upload counts, query history, trending documents |
| 🎨 **Multi-theme UI** | Dark, Light, and Midnight themes |
| 🐳 **Docker Ready** | Full Docker Compose setup for self-hosting |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite** — fast, modern UI
- **Tailwind CSS** — utility-first styling
- **React Query** — data fetching & caching
- **Zustand** — lightweight state management
- **Firebase SDK** — authentication

### Backend
- **Python 3.11** + **FastAPI** — async REST API
- **SQLAlchemy 2.0** async — ORM with PostgreSQL/SQLite
- **Celery** + **Redis** — async task queue
- **Firebase Admin** — token verification

### AI & Security
- **Google Gemini 2.5 Flash** — Q&A and summarization
- **Gemini Embedding 001** — 3072-dim vector embeddings
- **AES-256-GCM** — file encryption (cryptography library)
- **PBKDF2HMAC** — per-user key derivation
- **pyotp** — TOTP 2FA (Google Authenticator compatible)
- **PyPDF2** + **pyzipper** — PDF password protection & encrypted ZIP

### Infrastructure
- **PostgreSQL 15** + pgvector (production)
- **SQLite** (local development — zero config)
- **Docker** + **Docker Compose** — 7-service stack
- **Nginx** — frontend serving + API proxy
- **Vercel** — frontend deployment
- **Railway** — backend + database deployment

---

## 🏗️ Project Structure

```
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── routers/
│   │   ├── auth.py                # Authentication endpoints
│   │   ├── documents.py           # Document CRUD + upload
│   │   ├── query.py               # AI Q&A + summarization
│   │   ├── analytics.py           # Usage analytics
│   │   ├── twofa.py               # TOTP 2FA endpoints
│   │   └── fileops.py             # Encrypt, lock, convert files
│   ├── models/                    # SQLAlchemy models
│   ├── schemas/                   # Pydantic v2 schemas
│   ├── tasks/                     # Celery async tasks
│   └── utils/
│       ├── crypto.py              # AES-256-GCM encryption
│       ├── embeddings.py          # Gemini embeddings
│       ├── chunker.py             # Text chunking
│       ├── totp.py                # TOTP QR generation
│       └── file_ops.py            # File operations utilities
├── frontend/
│   └── src/
│       ├── pages/                 # Home, Dashboard, Library, Chat, Analytics
│       ├── components/            # Navbar, Footer, FileOpsPanel, DocumentViewer
│       ├── firebase/              # Firebase config + auth service
│       ├── store/                 # Zustand auth + theme stores
│       └── api/                   # Axios API client
├── postgres/
│   └── init.sql                   # pgvector extension setup
├── docker-compose.yml             # Full 7-service stack
└── .env.example                   # Environment variables template
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker (optional, for full stack)

### Local Development

**1. Clone the repository**
```bash
git clone https://github.com/pratham1max/AI-Powered-Document-Intelligence-Platform.git
cd AI-Powered-Document-Intelligence-Platform
```

**2. Configure environment**
```bash
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section)
```

**3. Start the backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**4. Start the frontend**
```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:5173** · API at **http://localhost:8000/docs**

### Docker (Full Stack)
```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Flower (Celery) | http://localhost:5555 |

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# AI
GEMINI_API_KEY=your-google-ai-studio-key

# Security
MASTER_SECRET=your-32-char-random-secret

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... (see .env.example for full list)

# Database (blank = SQLite for local dev)
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db

# Redis (optional for local dev)
REDIS_URL=redis://localhost:6379/0
```

---

## 🔐 Security Architecture

```
User Login (Firebase)
    ↓
Firebase ID Token (JWT, RS256)
    ↓
Backend verifies via Google JWKS (no service account needed)
    ↓
User upserted in DB by firebase_uid
    ↓
If 2FA enabled → TOTP challenge (/2fa/validate-login)
    ↓
Access granted

File Upload:
    File bytes → AES-256-GCM encrypt (per-user PBKDF2 key)
    → Stored as .enc file
    → AI processes decrypted text in memory only
    → .enc file never exposed
```

---

## 📡 API Reference

Full interactive docs: **http://localhost:8000/docs**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/me` | Current user info |
| `POST` | `/documents/upload` | Upload + encrypt + process |
| `GET` | `/documents` | List user's documents |
| `GET` | `/documents/{id}/download` | Decrypt and stream file |
| `POST` | `/query/query` | AI Q&A over documents |
| `POST` | `/query/summarize` | Generate document summary |
| `GET` | `/analytics/summary` | Usage statistics |
| `POST` | `/2fa/setup` | Generate TOTP QR code |
| `POST` | `/2fa/verify` | Enable 2FA |
| `POST` | `/fileops/lock/{id}` | Password-lock a document |
| `POST` | `/fileops/convert/{id}` | Convert file format |
| `POST` | `/fileops/download-zip` | Download as encrypted ZIP |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 👨‍💻 Developer

Built with ❤️ by **[pratham1max](https://github.com/pratham1max)**

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**⭐ If you find this project useful, please give it a star!**

[![Star this repo](https://img.shields.io/github/stars/pratham1max/AI-Powered-Document-Intelligence-Platform?style=social)](https://github.com/pratham1max/AI-Powered-Document-Intelligence-Platform/stargazers)

</div>
