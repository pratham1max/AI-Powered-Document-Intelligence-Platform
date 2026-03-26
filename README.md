# DocIntel — AI-Powered Document Intelligence Platform

> Upload documents. Ask questions. Get answers. Secured with AES-256.

![Tech Stack](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase)
![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?style=flat-square&logo=google)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## Overview

DocIntel is a full-stack document intelligence platform that lets users upload files, ask natural language questions, and get AI-generated answers — all with end-to-end encryption and multi-factor authentication.

## Features

- **AI Q&A** — Ask questions across one or multiple documents using semantic search + Gemini
- **Smart Summaries** — Short or detailed document summaries on demand
- **AES-256-GCM Encryption** — All files encrypted at rest with per-user keys derived via PBKDF2
- **Firebase Authentication** — Email/Password + Google OAuth
- **TOTP 2FA** — Google Authenticator / Authy support (backend-managed, no Firebase plan required)
- **Multi-theme UI** — Dark, Light, Midnight themes
- **Analytics Dashboard** — Upload counts, query history, trending documents
- **Docker-ready** — Full Docker Compose setup for production deployment

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Python 3.11 + FastAPI + Celery |
| Database | PostgreSQL 15 + pgvector (SQLite for local dev) |
| AI Engine | Google Gemini (gemini-2.0-flash + gemini-embedding-001) |
| Auth | Firebase Authentication |
| 2FA | TOTP via pyotp (Google Authenticator compatible) |
| Encryption | AES-256-GCM + PBKDF2 key derivation |
| Broker | Redis (Celery task queue) |
| Deployment | Docker + Docker Compose |

## Project Structure

```
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── routers/                # auth, documents, query, analytics, 2fa
│   ├── models/                 # SQLAlchemy models + database config
│   ├── schemas/                # Pydantic v2 schemas
│   ├── tasks/                  # Celery tasks (parse, embed, crypto)
│   ├── utils/                  # crypto, embeddings, chunker, totp
│   └── celery_app.py
├── frontend/
│   ├── src/
│   │   ├── pages/              # Home, Login, Register, Library, Chat, Analytics
│   │   ├── components/         # Navbar, Footer, Layout, ProfileModal, PreferencesModal
│   │   ├── firebase/           # Firebase config + auth service
│   │   ├── store/              # Zustand stores (auth, theme)
│   │   └── api/                # Axios API client
│   └── nginx.conf
├── postgres/
│   └── init.sql                # pgvector extension setup
├── docker-compose.yml
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker + Docker Compose (for production)

### Local Development

**1. Clone and configure**

```bash
git clone https://github.com/pratham1max/AI-Powered-Document-Intelligence-Platform.git
cd AI-Powered-Document-Intelligence-Platform
cp .env.example .env
# Fill in your credentials in .env
```

**2. Backend**

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**3. Frontend**

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`, API at `http://localhost:8000`.

### Docker (Production)

```bash
docker compose up --build
```

Services: frontend (3000), API (8000), Flower (5555)

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google AI Studio API key |
| `MASTER_SECRET` | 32+ char random secret for AES key derivation |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `DATABASE_URL` | PostgreSQL connection string (blank = SQLite) |
| `REDIS_URL` | Redis broker URL |

See `.env.example` for the full list.

## Authentication Flow

```
User → Firebase (Email/Password or Google OAuth)
     → Backend verifies Firebase ID token via Google JWKS
     → User upserted in DB by firebase_uid
     → If 2FA enabled → TOTP challenge via /2fa/validate-login
     → Access granted
```

## Encryption Design

- Master secret lives in `.env` only — never stored in DB
- Per-user AES-256 keys derived via PBKDF2HMAC (SHA-256, 100k iterations)
- Files saved as `.enc` — nonce + tag + ciphertext in binary format
- AI engine receives decrypted text in memory only

## API Reference

Full interactive docs available at `http://localhost:8000/docs`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/me` | Current user info |
| POST | `/documents/upload` | Upload + encrypt + process document |
| GET | `/documents` | List user's documents |
| GET | `/documents/{id}/download` | Decrypt and stream file |
| POST | `/query/query` | AI Q&A over documents |
| POST | `/query/summarize` | Generate document summary |
| GET | `/analytics/summary` | Usage statistics |
| POST | `/2fa/setup` | Generate TOTP QR code |
| POST | `/2fa/verify` | Enable 2FA |
| POST | `/2fa/validate-login` | Verify OTP during login |

## License

MIT
