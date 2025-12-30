# AI Agent Management Platform

A full-stack platform for managing AI agents with support for multiple LLM providers (OpenAI, Google Gemini, Groq). Features real-time metrics streaming, chat interface, and comprehensive agent management.

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Setup (Local without Docker)](#setup-local-without-docker)
- [Setup (Docker)](#setup-docker)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)

## Project Overview

This platform allows you to:

- Create and manage AI agents with custom system prompts
- Chat with agents using multiple LLM providers (OpenAI, Google Gemini, Groq)
- Monitor real-time metrics (tokens, latency, message counts) via Server-Sent Events
- View analytics dashboards with historical data

## Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **React Router** for navigation
- **TanStack Query** for data fetching

### Backend

- **Node.js** with **Express 5**
- **TypeScript** for type safety
- **Prisma** ORM with PostgreSQL
- **Zod** for validation

### Database

- **PostgreSQL 16**

### LLM Providers

- **OpenAI** (GPT models)
- **Google Gemini** (Gemini models)
- **Groq** (Llama models)

## Architecture Overview

### LLM Orchestration

The platform supports multiple LLM providers through a unified service layer:

1. **Model Configuration**: Models are configured via `VITE_MODELS_JSON` environment variable in the frontend, containing API keys, names, descriptions, and provider information.

2. **Agent Model Storage**: When creating an agent, the selected model's API key is stored in the database (`agent.model` field).

3. **Provider Detection**: The backend automatically detects the provider by analyzing the API key prefix:

   - `gsk_` → Groq
   - `sk-` → OpenAI
   - `AIza` → Google

4. **LLM Service Layer**: The `llm.service.ts` handles:

   - Parsing agent model configuration
   - Routing to appropriate provider client
   - Building messages with system prompts
   - Handling provider-specific API formats
   - Error handling and fallbacks

5. **Response Processing**: Responses include:
   - Generated text
   - Token usage metrics
   - Latency measurements

### Real-Time Data Handling

The platform uses **Server-Sent Events (SSE)** for real-time metrics streaming:

1. **SSE Endpoint**: `/api/metrics/stream`

   - Establishes a persistent connection from frontend to backend
   - Sends metrics updates every 3 seconds
   - Supports filtering by `agentId` query parameter

2. **Frontend Integration**:

   - `useMetricsStream` hook manages SSE connection
   - Automatic reconnection on connection loss
   - Initial snapshot fetch via REST API for immediate data
   - Connection status indicators (connected/reconnecting/disconnected)

3. **Metrics Data**:

   - Messages count
   - Tokens processed
   - Average latency
   - Last response latency
   - Historical snapshots

4. **Connection Management**:
   - Automatic reconnection with exponential backoff
   - Connection status tracking
   - Cleanup on component unmount

## Setup (Local without Docker)

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL 16+
- LLM API keys (OpenAI, Google, or Groq)

### Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ai-agent-management-platform
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env and fill in your values
   ```

3. **Set up the database**

   ```bash
   # Create PostgreSQL database
   createdb ai_agent_db

   # Or using psql
   psql -U postgres
   CREATE DATABASE ai_agent_db;
   ```

4. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

5. **Set up Prisma**

   ```bash
   # Generate Prisma Client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate
   ```

6. **Start the backend**

   ```bash
   npm run dev
   # Backend runs on http://localhost:4000
   ```

7. **Install frontend dependencies** (in a new terminal)

   ```bash
   cd frontend
   npm install
   ```

8. **Start the frontend**

   ```bash
   npm run dev
   # Frontend runs on http://localhost:5173 (or port shown in terminal)
   ```

9. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000
   - Health check: http://localhost:4000/api/health

## Setup (Docker)

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

### Steps

1. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env and fill in your values
   ```

2. **Start all services**

   ```bash
   docker-compose up -d
   ```

3. **View logs**

   ```bash
   docker-compose logs -f
   ```

4. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:4000
   - Health check: http://localhost:4000/api/health

### Docker Services

- **postgres**: PostgreSQL database (port 5432)
- **backend**: Express API server (port 4000)
- **frontend**: Nginx serving React app (port 80, mapped to 8080)

### Database Migrations

Migrations run automatically on container startup via the backend service's startup command:

```bash
npx prisma migrate deploy && node dist/server.js
```

For development, you can run migrations manually:

```bash
docker-compose exec backend npx prisma migrate deploy
```

## Environment Variables

See `.env.example` for all required variables. Key variables:

### Database

- `DATABASE_URL`: PostgreSQL connection string
- `POSTGRES_USER`: Database user (default: postgres)
- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_DB`: Database name (default: ai_agent_db)

### Backend

- `PORT`: Backend server port (default: 4000)
- `NODE_ENV`: Environment (development/production)
- `CLIENT_ORIGIN`: Allowed CORS origins (comma-separated)

### LLM API Keys

- `OPENAI_API_KEY`: OpenAI API key (optional)
- `GOOGLE_API_KEY`: Google Gemini API key (optional)
- `GROQ_API_KEY`: Groq API key (optional)

### Frontend

- `VITE_API_URL`: Backend API URL (default: http://localhost:4000)
- `VITE_MODELS_JSON`: JSON array of model configurations (see .env.example)

### Important Notes

- **Never commit `.env` file** - it contains sensitive API keys
- Use `.env.example` as a template
- `VITE_MODELS_JSON` must be a valid JSON array string
- At least one LLM provider key is required for the platform to function

## API Endpoints

### Health

- `GET /api/health` - Health check endpoint
  - Response: `{ status: "ok", service: "agent-platform-backend", timestamp: string }`

### Agents

- `GET /api/agents` - List all agents

  - Response: `Agent[]`

- `GET /api/agents/:id` - Get agent by ID

  - Response: `Agent`

- `POST /api/agents` - Create new agent

  - Body: `{ name: string, systemPrompt: string, model: string }`
  - Response: `Agent`

- `PUT /api/agents/:id` - Update agent (full update)

  - Body: `{ name?: string, systemPrompt?: string, model?: string }`
  - Response: `Agent`

- `PATCH /api/agents/:id` - Update agent (partial update)

  - Body: `{ name?: string, systemPrompt?: string, model?: string }`
  - Response: `Agent`

- `DELETE /api/agents/:id` - Delete agent
  - Response: `204 No Content`

### Chat

- `GET /api/agents/:agentId/conversations` - List conversations for an agent

  - Response: `Conversation[]`

- `POST /api/agents/:agentId/conversations` - Create new conversation

  - Body: `{ title?: string }`
  - Response: `Conversation`

- `GET /api/conversations/:conversationId/messages` - List messages in a conversation

  - Response: `Message[]`

- `POST /api/conversations/:conversationId/messages` - Send a message

  - Body: `{ content: string }`
  - Response: `{ conversationId: string, userMessage: Message, assistantMessage: Message, meta: { latencyMs: number, tokensUsed: number | null } }`

- `POST /api/chat` - Direct chat endpoint
  - Body: `{ agentId: string, content: string, conversationId?: string }`
  - Response: `{ conversationId: string, userMessage: Message, assistantMessage: Message, meta: { latencyMs: number, tokensUsed: number | null } }`

### Metrics

- `GET /api/metrics` - Get metrics snapshot

  - Query: `?agentId=<id>` (optional, filters by agent)
  - Response: `{ current: MetricsSnapshot, history: MetricsSnapshot[] }`

- `GET /api/metrics/stream` - Server-Sent Events stream for real-time metrics
  - Query: `?agentId=<id>` (optional, filters by agent)
  - Response: SSE stream with `event: metrics` and `data: JSON`

### Capabilities

- `GET /api/capabilities` - Get platform capabilities
  - Response: Platform feature information

## Troubleshooting

### Port Conflicts

**Issue**: Port already in use

**Solutions**:

- Change port in `.env` file:
  - `PORT=4001` for backend
  - `VITE_PORT=8081` for frontend (Docker)
- Kill process using the port:

  ```bash
  # Windows
  netstat -ano | findstr :4000
  taskkill /PID <PID> /F

  # Linux/Mac
  lsof -ti:4000 | xargs kill
  ```

### Database Connection Issues

**Issue**: Cannot connect to database

**Solutions**:

- Verify `DATABASE_URL` in `.env` is correct
- Ensure PostgreSQL is running:

  ```bash
  # Check status
  pg_isready

  # Start PostgreSQL (varies by OS)
  # Windows: net start postgresql-x64-16
  # Linux: sudo systemctl start postgresql
  # Mac: brew services start postgresql
  ```

- For Docker: Ensure postgres service is healthy:
  ```bash
  docker-compose ps
  docker-compose logs postgres
  ```

### Prisma Migration Issues

**Issue**: Migration errors

**Solutions**:

- Reset database (⚠️ **WARNING**: Deletes all data):
  ```bash
  cd backend
  npx prisma migrate reset
  ```
- Check migration status:
  ```bash
  npm run prisma:status
  ```
- For Docker, ensure migrations run on startup (already configured)

### Environment Variables Not Loading

**Issue**: Environment variables not recognized

**Solutions**:

- Ensure `.env` file is in project root (not in frontend/backend folders)
- Restart the development server after changing `.env`
- For Vite (frontend), variables must start with `VITE_`
- Verify `.env` file syntax (no spaces around `=`)

### LLM API Errors

**Issue**: LLM calls failing

**Solutions**:

- Verify API keys are set correctly in `.env`
- Check API key format matches provider requirements
- Ensure API keys have sufficient credits/quota
- Check backend logs for detailed error messages:

  ```bash
  # Local
  npm run dev

  # Docker
  docker-compose logs backend
  ```

### Frontend Build Errors

**Issue**: Frontend build fails

**Solutions**:

- Clear node_modules and reinstall:
  ```bash
  cd frontend
  rm -rf node_modules package-lock.json
  npm install
  ```
- Verify `VITE_MODELS_JSON` is valid JSON:
  ```bash
  node -e "JSON.parse(process.env.VITE_MODELS_JSON)"
  ```
- Check TypeScript errors:
  ```bash
  npm run typecheck
  ```

### CORS Issues

**Issue**: CORS errors in browser console

**Solutions**:

- Verify `CLIENT_ORIGIN` in `.env` matches frontend URL
- For local development: `CLIENT_ORIGIN=http://localhost:5173`
- Multiple origins: `CLIENT_ORIGIN=http://localhost:5173,http://localhost:3000`

### SSE Connection Issues

**Issue**: Metrics stream not connecting

**Solutions**:

- Check browser console for SSE errors
- Verify backend is running and accessible
- Check network tab for `/api/metrics/stream` requests
- Ensure no proxy/firewall blocking SSE connections
- Verify `VITE_API_URL` points to correct backend URL

## Development

### Running Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test  # If tests are configured
```

### Type Checking

```bash
# Backend
cd backend
npm run typecheck

# Frontend
cd frontend
npm run typecheck
```

### Linting

```bash
# Backend
cd backend
npm run lint  # If configured

# Frontend
cd frontend
npm run lint
```

### Database Management

```bash
cd backend

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Check migration status
npm run prisma:status

# Create new migration
npm run prisma:migrate
```

## License

ISC
