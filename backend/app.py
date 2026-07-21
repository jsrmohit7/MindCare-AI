import os
import time
import uuid
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException, status
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware

from core.config import settings
from core.logging import logger
from config.database import lifespan, get_database

from routes.health import router as health_router
from routes.auth import router as auth_router
from routes.questionnaire import router as questionnaire_router
from api.assessment_routes import router as assessment_router
from api.daily_wellness_routes import router as daily_wellness_router
from api.coach_routes import router as coach_router


from api.exception_handlers import (
    request_validation_exception_handler,
    granite_validation_exception_handler,
    http_exception_handler,
    unexpected_exception_handler
)
from services.response_validator import GraniteValidationError


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that generates X-Request-ID and X-Process-Time headers,
    and logs a single structured log entry per request.
    """
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        start_time = time.time()
        
        try:
            response = await call_next(request)
        except Exception as exc:
            # Propagate back so the unexpected exception handler handles it
            raise exc

        process_time = time.time() - start_time
        
        # Attach response headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{process_time:.6f}"
        
        client_ip = request.client.host if request.client else "unknown"
        
        # Structured request summary log entry: RequestID HTTPMethod Path StatusCode ProcessTime ClientIP
        # Sensitive data (passwords, questionnaire data, API keys) is never logged
        logger.info(
            f"Method={request.method} Path={request.url.path} Status={response.status_code} "
            f"Duration={process_time:.6f}s IP={client_ip}",
            extra={"request_id": request_id}
        )
        
        return response


def create_app() -> FastAPI:
    """
    Application factory for the MindCare AI FastAPI app.
    """
    fastapi_app = FastAPI(
        title=settings.api_title,
        version=settings.api_version,
        lifespan=lifespan,
        debug=settings.debug
    )

    # 1. Register Logging & ID Middleware (Inner Layer)
    fastapi_app.add_middleware(LoggingMiddleware)

    # 2. Register CORS Middleware (Outer Layer)
    fastapi_app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Log resolved CORS origins for production diagnostic verification
    logger.info(f"CORS Whitelisted Origins: {settings.cors_origins}")

    # 3. Register Global Exception Handlers
    fastapi_app.add_exception_handler(RequestValidationError, request_validation_exception_handler)
    fastapi_app.add_exception_handler(GraniteValidationError, granite_validation_exception_handler)
    fastapi_app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    fastapi_app.add_exception_handler(Exception, unexpected_exception_handler)

    # 4. Versioned Endpoint Routers (Auth, Questionnaire, Assessments)
    # Auth Prefix: /api/v1/auth
    fastapi_app.include_router(auth_router, prefix="/api/v1/auth")
    # Questionnaire Prefix: /api/v1/questionnaire
    fastapi_app.include_router(questionnaire_router, prefix="/api/v1/questionnaire")
    # Assessment Prefix: /api/v1/assessments
    fastapi_app.include_router(assessment_router, prefix="/api/v1")
    # Daily Wellness Prefix: /api/v1
    fastapi_app.include_router(daily_wellness_router, prefix="/api/v1")
    # AI Coach Prefix: /api/v1
    fastapi_app.include_router(coach_router, prefix="/api/v1")


    # 5. Non-Versioned Root Router (Health & Readiness checks)
    fastapi_app.include_router(health_router)

    @fastapi_app.get(
        "/ready",
        summary="Readiness Check",
        description="Verify MongoDB connectivity and configuration validity without performing AI inference.",
        status_code=status.HTTP_200_OK,
        responses={
            200: {"description": "Service is ready"},
            503: {"description": "Service is unavailable / not ready"}
        }
    )
    async def readiness_check() -> dict:
        try:
            # Verify MongoDB Connection
            db = get_database()
            await db.command("ping")
            
            # Verify Settings configuration
            _ = settings.mongodb_db
            
            return {"status": "ok"}
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Service not ready: MongoDB connection or configuration failure. Error: {exc}"
            )

    return fastapi_app


app = create_app()
