# MindCare AI - Release Notes & Deployment Guide (v1.0.0)

This release marks the first production-ready milestone for **MindCare AI**, integrating clinical scoring aggregates, IBM watsonx.ai Granite inference models, secure persistence, and an interactive Next.js interface.

---

## Release Features

1. **Multi-Step Questionnaire**: User-friendly multi-step React form utilizing `React Hook Form` and `Zod` validation.
2. **Clinical Severity Scoring**: Evaluates PHQ-9 (Depression), GAD-7 (Anxiety), stress indices, sleep quality, lifestyle indicators, and subjective wellbeing.
3. **IBM Watsonx.ai Integration**: Harnesses Granite foundation models to dynamically formulate custom evaluations and actionable wellness recommendations.
4. **Reliable Persistence**: Centralized async repository layer communicating with MongoDB utilizing standard Motor drivers.
5. **Infrastructure Observability**: Structured log outputting carrying correlation Request IDs, custom CORS middleware filters, and standardized error schemas.
6. **Containerized DevOps**: Complete Docker and Docker Compose files supporting non-root runtime environments and automatic health checking.

---

## Production Deployment Steps

### Method A: Docker Compose (Self-Hosted / Single Node)
1. Clone the repository and configure environment variables inside a `.env` file at the root:
   ```bash
   cp backend/.env.example .env
   ```
2. Build and spin up the production container stack:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```
3. Verify that all service health checks pass:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

### Method B: Render Cloud Platform
1. Connect your GitHub repository to Render.
2. Click **New** -> **Blueprint Route** in your Render dashboard.
3. Link to the repository. Render will automatically parse the `render.yaml` file and configure:
   - A MongoDB Database instance.
   - The FastAPI backend service.
   - The Next.js frontend web service.
4. Go to your backend service dashboard on Render and add your secret credentials:
   - `IBM_API_KEY`: Your watsonx API access key.
   - `IBM_PROJECT_ID`: Your watsonx project identifier.

---

## Rollback Instructions

### 1. Git Version Rollback
To rollback to a previous commit or tag:
```bash
git checkout v0.9.0
```

### 2. Docker Stack Rollback
If a newer Docker release is unstable:
1. Re-tag the previous stable build image:
   ```bash
   docker-compose -f docker-compose.prod.yml stop
   ```
2. Pull the designated stable container tags:
   ```bash
   docker pull mindcare/backend:v0.9.0
   docker tag mindcare/backend:v0.9.0 mindcare/backend:latest
   ```
3. Restart the container stack:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

---

## Known Limitations & Failbacks
- **AI Latency**: Because the AI model performs complete text generation, inference requests may take up to 5-15 seconds. Frontend features show a dedicated loader to capture this delay.
- **Offline Mode**: If MongoDB goes offline, the `/ready` check will fail and block incoming traffic immediately, while the `/health` check remains active to indicate process liveness.
