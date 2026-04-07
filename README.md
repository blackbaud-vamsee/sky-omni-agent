# SKY-Omni Agent

> **OTG Hackathon D538** — Intelligent Engineering Partner for SKY UX Development

SKY-Omni is an AI agent that acts as a senior SKY UX engineer available 24/7. It has two modes:

| Mode | Input | Output |
|---|---|---|
| **🏗️ The Architect** | Natural language UI requirement | Production-ready Angular + SKY UX component code |
| **🩺 The Medic** | Raw error log (Luminate, RE NXT, SKY API) | Root cause analysis + immediate code fix |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21 · Spring Boot 3.5 · Virtual Threads |
| AI Orchestration | LangChain4j 1.12.x · GitHub Models API (GPT-4o) via Copilot access |
| RAG (Embeddings) | BGE-Small-EN-v1.5 Quantized (local ONNX, no API key) |
| Vector Store | LangChain4j InMemoryEmbeddingStore |
| Frontend | Angular 18 · Standalone Components · SCSS |
| Streaming | Server-Sent Events (POST via `@microsoft/fetch-event-source`) |

---

## Prerequisites

- Java 21+
- Maven 3.9+
- Node 20+
- Angular CLI 18 (`npm install -g @angular/cli@18`)
- An Anthropic API key (see below)

---

## Setup & Run

### 1. Add your GitHub Token

You already have GitHub Copilot access — just generate a PAT:
1. Go to **github.com → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)**
2. Create a token with scope: **`models:read`**
3. Set it as an env var:

**Option A — Environment variable (recommended):**
```bash
export GITHUB_TOKEN=github_pat_...
```

**Option B — bai-genai service** (if your org provides the endpoint + key):  
Edit `application.properties` and replace `base-url` + `api-key` + `model-name` with your internal values.

**Option C — Edit directly** (do NOT commit):  
Replace `REPLACE_WITH_YOUR_GITHUB_PAT` in `application.properties`.

### 2. Drop in your SKY UX documentation

Place your internal SKY UX `.md` or `.txt` files in:
```
backend/src/main/resources/docs/skyux/
```
Three synthetic files are already included as a starting point.

### 3. Start the backend
```bash
cd backend
mvn spring-boot:run
```
Look for these log lines to confirm RAG is working:
```
Ingesting 3 SKY UX documentation files into embedding store...
SKY UX RAG pipeline ready.
Ingesting 3 error pattern files into embedding store...
Error patterns RAG pipeline ready.
```
Backend runs on **http://localhost:8080**

### 4. Start the frontend
```bash
cd frontend
npm install
npm start
```
Frontend runs on **http://localhost:4200**

---

## API Reference

### The Architect
```
POST /api/architect/generate
Content-Type: application/json

{ "prompt": "Create a donor list grid with search and pagination" }

→ text/event-stream  (token-by-token streaming)
```

### The Medic
```
POST /api/medic/diagnose
Content-Type: application/json

{ "log": "[ERROR] GiftProcessingService - NullPointerException..." }

→ text/event-stream  (token-by-token streaming)
```

---

## Architecture

```
Angular 18 Frontend
    │
    │  POST /api/architect/generate  (SSE)
    │  POST /api/medic/diagnose      (SSE)
    ▼
Spring Boot 3.5 Backend
    │
    ├── ArchitectAgent (@AiService)
    │       ├── Anthropic Claude 3.5 Sonnet  (streaming)
    │       └── RAG: SKY UX docs → BGE embeddings → InMemoryStore
    │
    └── MedicAgent (@AiService)
            ├── Anthropic Claude 3.5 Sonnet  (streaming)
            └── RAG: Error patterns → BGE embeddings → InMemoryStore
```

---

## What Was Built During the 48 Hours vs. What Existed Before

| Item | Status |
|---|---|
| Full Spring Boot + LangChain4j backend | ✅ Built during hackathon |
| Dual RAG pipeline (skyux + errors) | ✅ Built during hackathon |
| ArchitectAgent + MedicAgent @AiService | ✅ Built during hackathon |
| Angular 18 frontend with SSE streaming UI | ✅ Built during hackathon |
| Synthetic error pattern knowledge base | ✅ Built during hackathon |
| SKY UX documentation (internal) | Existing internal docs dropped in |

---

## Known Limitations & Next Steps

### Limitations
- Knowledge base is in-memory — restarts lose no index but has no persistence across deployments
- No conversation memory / chat history (single-turn only in this POC)
- SKY UX docs are placeholder — accuracy improves significantly with real internal docs
- No authentication on the API endpoints (internal-only tool)

### Next Steps
- Add `ChatMemory` for multi-turn conversations
- Replace `InMemoryEmbeddingStore` with a persistent vector DB (pgvector or Chroma)
- Expand the knowledge base to cover Financial Edge and YourCause components
- Add a `@Tool` for live SKY UX Storybook API lookups
- Integrate with Blackbaud's internal developer portal

---

## Data & Compliance Notes

- No customer or constituent data is processed. All demo logs are synthetic.
- The only external API call is to Anthropic Claude. No data is persisted by the LLM.
- Embeddings are computed locally via ONNX runtime — no user data leaves the machine.

## AI Usage Disclosure

- **GitHub Copilot** (Claude Sonnet 4.6): Used to scaffold boilerplate code and generate initial class structures
- **Anthropic Claude 3.5 Sonnet** (via direct API): The runtime LLM powering both agent modes
- All generated code was reviewed and validated by the team before inclusion
