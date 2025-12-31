# AI Agent Management Platform

A full-stack platform for managing AI agents with **multiple LLM providers** (Google Gemini, OpenAI, Groq).  
It includes a **frontend + backend + PostgreSQL** and can be started with **one Docker Compose command**.

This repository is structured to match the assessment deliverables:
- ✅ Full source code (frontend + backend separated)
- ✅ Documentation (setup, architecture, API overview)
- ✅ Deployment & config (Docker + `.env.example` with placeholders)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Providers & Models Configuration](#providers--models-configuration)
- [Setup Local Without Docker](#setup-local-without-docker)
- [Setup With Docker](#setup-with-docker)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Verification Checklist](#verification-checklist)
- [Troubleshooting](#troubleshooting)

---

## Project Overview

This platform allows you to:

- Create and manage AI agents with custom system prompts
- Assign agents to **fixed, allowlisted LLM models** (no user-defined model injection)
- Chat with agents via a unified backend orchestration layer
- Track basic runtime metrics (latency, tokens when available)
- Run everything via root-level Docker config

---

## Repository Structure

```
.
├── backend/                 # Express + TypeScript + Prisma
├── frontend/                # React + TypeScript + Vite
├── docker-compose.yml       # Spins up DB + backend + frontend
├── Dockerfile               # Multi-stage build (frontend + backend)
├── providers.json           # Provider/model allowlist
├── .env.example             # Environment template (NO secrets)
└── README.md
```

---

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS (UI styling)
- Nginx (production serving + reverse proxy in Docker)

### Backend
- Node.js 20
- Express (ESM)
- Prisma ORM
- Zod (request validation)

### Database
- PostgreSQL 16

### LLM Providers
- Google Gemini
- OpenAI
- Groq

---

## Architecture Overview

### High-Level Flow

1. **Frontend** calls `/api/*`
2. **Nginx** (frontend container) proxies `/api` → backend container
3. **Backend**:
   - Loads provider/model allowlist from `providers.json`
   - Verifies the provider is enabled & the model is allowed
   - Uses the right SDK (OpenAI / Google / Groq) based on provider
   - Stores messages and response metadata (latency/tokens) in Postgres
4. Returns response to frontend

### Why `providers.json`?
- Prevents users from submitting arbitrary models
- Keeps model list consistent across UI & backend
- Makes enabling/disabling providers explicit

---

## Providers & Models Configuration

### File: `providers.json`

Example:
```json
[
  {
    "provider": "google",
    "enabled": true,
    "models": [
      { "id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "description": "Fast and balanced" }
    ]
  }
]
```

### Rules
- `provider` must be one of: `google | openai | groq`
- `enabled=false` disables the provider
- Models are fixed and allowlisted (users cannot add new models from the UI)

### How to change providers/models
1. Edit `providers.json` (enable/disable providers, add/remove allowlisted models)
2. If you changed anything, restart:
   - Docker: `docker-compose up -d --build`
   - Local: restart backend + frontend

> Note: A provider being `enabled: true` is not enough — it must also have its API key set in `.env`.

---

## Setup Local Without Docker

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- One or more provider API keys (optional but required to actually chat)

### Steps

1) **Clone and enter project**
```bash
git clone <repo-url>
cd <repo-folder>
```

2) **Create environment file**
```bash
cp .env.example .env
```
Fill in values (especially `DATABASE_URL` and any provider keys you want to use).

3) **Start Postgres (local)**
Create a database that matches your `DATABASE_URL`.
Example:
```bash
createdb ai_agent_db
```

4) **Backend setup**
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```
Backend should run on `http://localhost:4000`.

5) **Frontend setup (new terminal)**
```bash
cd frontend
npm install
npm run dev
```
Frontend usually runs on `http://localhost:5173`.

---

## Setup With Docker

### Prerequisites
- Docker
- Docker Compose

### Steps

1) **Create environment file**
```bash
cp .env.example .env
```
Fill in provider keys you want to use (do not commit `.env`).

2) **Start everything**
```bash
docker-compose up -d --build
```

3) **Check logs**
```bash
docker-compose logs -f
```

### Access
- Frontend: `http://localhost:8080`
- Backend: `http://localhost:4000`
- Health check: `http://localhost:4000/healthz`

### Notes
- Prisma migrations run automatically in Docker on backend startup:
  - `npx prisma generate`
  - `npx prisma migrate deploy`

---

## Environment Variables

Use `.env.example` as the template.

### Backend
- `PORT` (default 4000)
- `NODE_ENV` (production/development)
- `DATABASE_URL` (PostgreSQL connection string)
- `CLIENT_ORIGIN` (CORS allowed origin)

### Provider Keys (Backend Only)
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`

### Frontend
- `VITE_PORT` (docker-exposed port for frontend)
- `VITE_API_URL` (local dev only; in Docker it is proxied via nginx at `/api`)

### Providers File
- `PROVIDERS_FILE`
  - Local default can be `./providers.json` or `../providers.json` depending on backend implementation
  - In Docker, it is mounted as `/app/providers.json`

> Security note: Never store provider keys in frontend `VITE_*` variables.

---

## API Documentation

> Base path: `/api` (when called from the browser in Docker, use `/api/...`)

### Health
- `GET /healthz`  
  Returns `{ "status": "ok" }`

### Agents
- `GET /api/agents` — list agents
- `GET /api/agents/:id` — get agent
- `POST /api/agents` — create agent  
  Body: `{ "name": string, "systemPrompt": string, "model": string }`
- `PUT /api/agents/:id` — update agent
- `DELETE /api/agents/:id` — delete agent

### Conversations & Messages
- `GET /api/agents/:agentId/conversations` — list agent conversations
- `POST /api/agents/:agentId/conversations` — create conversation
- `GET /api/conversations/:conversationId/messages` — list messages
- `POST /api/conversations/:conversationId/messages` — send message  
  Body: `{ "content": string }`

### Chat (direct)
- `POST /api/chat`  
  Body: `{ "agentId": string, "content": string, "conversationId"?: string }`

### Metrics
- `GET /api/metrics?agentId=<optional>` — snapshot + history
- `GET /api/metrics/stream?agentId=<optional>` — SSE stream

---

## Verification Checklist

After starting (Docker or local), verify:

1) Backend health:
```bash
curl http://localhost:4000/healthz
```

2) Frontend loads:
- Docker: `http://localhost:8080`
- Local: `http://localhost:5173`

3) Provider setup:
- Ensure provider key exists in `.env`
- Ensure provider is `enabled: true` in `providers.json`

---

## Troubleshooting

### Provider not visible / not usable
- Confirm provider has:
  - `enabled: true` in `providers.json`
  - a non-empty API key in `.env`
- Restart containers after edits:
```bash
docker-compose up -d --build
```

### Backend can't read `providers.json`
- In Docker, verify volume mount:
  - `./providers.json:/app/providers.json:ro`
- Ensure backend env sets:
  - `PROVIDERS_FILE=/app/providers.json`

### Database connection errors
- Confirm `DATABASE_URL` is correct
- In Docker, the backend uses the service hostname `postgres`

### Port conflicts
Change ports in `.env`:
- `PORT=4001`
- `VITE_PORT=8081`

---

