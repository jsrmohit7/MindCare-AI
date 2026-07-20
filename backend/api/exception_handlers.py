import traceback
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from services.response_validator import GraniteValidationError
from core.logging import logger


async def request_validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handles Pydantic validation errors (HTTP 422).
    """
    request_id = getattr(request.state, "request_id", "N/A")
    logger.warning(
        f"Request validation failure on {request.url.path}: {exc.errors()}", 
        extra={"request_id": request_id}
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request body validation failed.",
                "details": exc.errors()
            }
        }
    )


async def granite_validation_exception_handler(request: Request, exc: GraniteValidationError) -> JSONResponse:
    """
    Handles AI response schema validation errors (HTTP 400).
    """
    request_id = getattr(request.state, "request_id", "N/A")
    logger.warning(
        f"Granite validation failure: {str(exc)}", 
        extra={"request_id": request_id}
    )
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": "GRANITE_VALIDATION_ERROR",
                "message": str(exc),
                "details": None
            }
        }
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Handles standard HTTPExceptions.
    """
    request_id = getattr(request.state, "request_id", "N/A")
    logger.warning(
        f"HTTPException {exc.status_code} on {request.url.path}: {exc.detail}", 
        extra={"request_id": request_id}
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"HTTP_ERROR_{exc.status_code}",
                "message": exc.detail,
                "details": None
            }
        }
    )


async def unexpected_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catches all unhandled exceptions, logs the traceback, and returns HTTP 500.
    """
    request_id = getattr(request.state, "request_id", "N/A")
    tb = traceback.format_exc()
    logger.error(
        f"Unexpected exception occurred: {str(exc)}\n{tb}", 
        extra={"request_id": request_id}
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred.",
                "details": str(exc)
            }
        }
    )
