# AI Agent Management Platform

A full-stack platform for managing AI agents with **multiple LLM providers** (Google Gemini, OpenAI, Groq), built with a **root-level Docker & environment setup** and a **file-based provider configuration**.

This README reflects the **current, correct architecture** based on the latest Docker, `.env`, and `providers.json` configuration.

---

## Table of Contents

- Project Overview
- Key Design Decisions
- Tech Stack
- Architecture Overview
- Providers & Models Configuration
- Environment Variables
- Setup (Docker – Recommended)
- Setup (Local without Docker)
- API Overview
- Health & Verification
- Troubleshooting
- Notes & Best Practices

---

## Project Overview

This platform allows you to:

- Create and manage AI agents with custom system prompts
- Assign agents to **fixed, pre-approved LLM models**
- Chat with agents using Google Gemini, OpenAI, or Groq
- Track latency and token usage
- Run everything from **a single root-level Docker setup**

---

## Key Design Decisions (Important)

### 1. Root-Level Configuration
- `.env`, `docker-compose.yml`, `Dockerfile`, and `providers.json` all live in the **project root**
- No duplicated env files inside frontend or backend

### 2. Backend-Only API Keys (Security)
- LLM API keys are **never exposed to the frontend**
- Frontend only consumes metadata from the backend
- Backend reads API keys from `.env`

### 3. Fixed Models (No User Injection)
- Available models are **defined only in `providers.json`**
- Users cannot add or modify models
- Each agent stores:
  - provider
  - model id
  - system prompt

### 4. Provider Enablement
- A provider is usable **only if**:
  - `enabled: true` in `providers.json`
  - AND the corresponding API key exists in `.env`

---

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Served via **Nginx (Docker)**

### Backend
- Node.js 20
- Express (ESM)
- Prisma ORM
- Zod validation

### Database
- PostgreSQL 16

### LLM Providers
- Google Gemini
- OpenAI
- Groq

---

## Architecture Overview

```
Root
│
├── docker-compose.yml
├── Dockerfile
├── .env
├── providers.json
│
├── backend/
│   ├── prisma/
│   ├── src/
│   └── dist/
│
└── frontend/
    └── dist/
```

### Runtime Flow

1. Frontend calls `/api/*`
2. Nginx proxies `/api` → backend container
3. Backend:
   - Reads `providers.json`
   - Validates provider + model
   - Calls correct LLM SDK
4. Response + metrics returned

---

## Providers & Models Configuration

### `providers.json`

```json
[
  {
    "provider": "google",
    "enabled": true,
    "models": [
      { "id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash" }
    ]
  }
]
```

### Rules
- `provider` must be one of: `google | openai | groq`
- `enabled=false` hides provider entirely
- Backend validates model existence before calling LLM

---

## Environment Variables (`.env`)

### Backend Core

```
PORT=4000
NODE_ENV=production
DATABASE_URL=postgresql://postgres:159753@localhost:5432/ai_agent?schema=public
CLIENT_ORIGIN=http://localhost:8080
```

### Provider API Keys (Backend Only)

```
OPENAI_API_KEY=
GOOGLE_API_KEY=AIza...
GROQ_API_KEY=gsk_...
```

### Frontend

```
VITE_PORT=8080
VITE_API_URL=http://localhost:4000
```

### Providers Config Path

```
PROVIDERS_FILE=../providers.json
```

> ⚠️ Never commit `.env` to source control

---

## Setup (Docker – Recommended)

### Prerequisites
- Docker
- Docker Compose

### Steps

```bash
docker-compose up -d
```

### Access
- Frontend: http://localhost:8080
- Backend API: http://localhost:4000
- Health check: http://localhost:4000/healthz

### Containers
- postgres
- backend
- frontend (nginx)

### Migrations
Run automatically on backend startup:

```bash
npx prisma generate
npx prisma migrate deploy
```

---

## Setup (Local without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 16+

### Steps

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

```bash
# Frontend
cd frontend
npm install
npm run dev
```

---

## API Overview (High Level)

### Agents
- `GET /api/agents`
- `POST /api/agents`
- `PUT /api/agents/:id`
- `DELETE /api/agents/:id`

### Chat
- `POST /api/chat`
- `GET /api/agents/:agentId/conversations`
- `POST /api/conversations/:id/messages`

### Metrics
- `GET /api/metrics`
- `GET /api/metrics/stream` (SSE)

### Health
- `GET /healthz`

---

## Health & Verification

```bash
curl http://localhost:4000/healthz
```

Expected:
```json
{ "status": "ok" }
```

---

## Troubleshooting

### Backend can’t read providers.json
- Ensure volume is mounted:
  ```
  ./providers.json:/app/providers.json:ro
  ```
- Check `PROVIDERS_FILE=/app/providers.json` inside container

### Provider not visible in UI
- `enabled` must be `true`
- API key must exist in `.env`
- Restart containers after changing `.env`

### Prisma issues
```bash
docker-compose exec backend npx prisma migrate status
```

### Port conflicts
Change:
```
PORT=4001
VITE_PORT=8081
```

---

## Notes & Best Practices

- Do NOT expose API keys to frontend
- Do NOT allow dynamic user-defined models
- Restart Docker after changing `.env` or `providers.json`
- Treat `providers.json` as a controlled allowlist

---

## License

ISC
