# MindCare AI Backend

This is the production-ready FastAPI backend for MindCare AI, orchestrating mental health assessments, questionnaire processing, risk analysis, and structured logging.

---

## Project Architecture

The backend implements a decoupled, layered architecture:

```
Client
   │
   ▼
FastAPI Router / Middleware (CORS, Logging, unique Request IDs)
   │
   ▼
AssessmentService (Orchestrator)
   │
   ├────────► RiskEngine (Scoring algorithm)
   ├────────► AnalysisEngine (IBM Watsonx Granite AI orchestration)
   └────────► AssessmentRepository (MongoDB CRUD operations)
                  │
                  ▼
              MongoDB
```

### Key Components
1. **Core Settings**: Validated Pydantic models in `backend/core/config.py`. Fail-fast on startup if secrets are missing.
2. **Structured Logging**: Contextual Logger in `backend/core/logging.py` formatting standard logs with `Timestamp`, `Level`, `Logger Name`, `Request ID`, and custom masking to protect sensitive personal health information.
3. **Global Exception Handler**: Custom handler mapping standard HTTP, validation, and unexpected errors to consistent JSON payloads.
4. **Middlewares**: Base middleware generating unique request IDs (`X-Request-ID`), tracking latency (`X-Process-Time`), and logging one structural entry per request.

---

## Installation & Setup

1. **Clone & Setup Virtual Environment**:
   ```bash
   python -m venv venv
   .\venv\Scripts\Activate.ps1   # Windows PowerShell
   source venv/bin/activate       # Unix/macOS
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in the required IBM watsonx.ai and MongoDB connection parameters:
   ```bash
   cp .env.example .env
   ```

---

## Environment Variables

| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `MONGODB_URL` | MongoDB connection URL | Yes | `mongodb://localhost:27017` |
| `MONGODB_DB` | MongoDB Database Name | Yes | `mindcare_ai` |
| `IBM_API_KEY` | watsonx.ai cloud access key | Yes | - |
| `IBM_PROJECT_ID` | watsonx.ai Project Workspace ID | Yes | - |
| `IBM_URL` | watsonx.ai Platform Endpoint | Yes | `https://us-south.ml.cloud.ibm.com` |
| `IBM_GRANITE_MODEL` | IBM Granite inference model id | Yes | `ibm/granite-13b-instruct-v2` |
| `IBM_TIMEOUT_SECONDS` | Timeout duration for AI model inference | No | `30.0` |
| `IBM_MAX_NEW_TOKENS` | Maximum tokens to generate | No | `1000` |
| `DEBUG` | Enable verbose error reporting | No | `False` |
| `CORS_ORIGINS` | Permitted cross-origin endpoints | No | `http://localhost:3000` |

---

## Running Locally

To start the local Uvicorn dev server:
```bash
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```
- **Interactive OpenAPI Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Redoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## Running with Docker

We provide a complete Docker deployment setup with a multi-stage production image running as a non-root user.

### Docker Compose (Starts MongoDB + Backend Application)

1. Start services:
   ```bash
   docker-compose up -d --build
   ```
2. View Logs:
   ```bash
   docker-compose logs -f
   ```
3. Stop services:
   ```bash
   docker-compose down
   ```

---

## Running Tests

To run the complete suite of unit and integration tests (including route, repository, and infrastructure validation):
```bash
python -m unittest discover tests
```

---

## API Documentation

### Root Endpoints
- `GET /health` - Simple Liveness Check.
- `GET /ready` - Readiness Check verifying MongoDB connection state.

### Core Assessments API (Prefixed under `/api/v1`)
- `POST /api/v1/assessments` - Initiates the AI pipeline to analyze questionnaire answers and saves the assessment.
- `GET /api/v1/assessments/{id}` - Retrieves a saved assessment.
- `GET /api/v1/assessments` - Lists saved assessments with optional limit parameter.
- `DELETE /api/v1/assessments/{id}` - Deletes a saved assessment.
