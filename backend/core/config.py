import os
import sys
from typing import List
from pydantic import BaseModel, Field, field_validator, ConfigDict
from dotenv import load_dotenv
from pathlib import Path

# Load env variables
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_PATH, override=True)
load_dotenv()

# Automatically inject dummy values during unit tests to prevent startup validation failure
if "UNITTEST_MODE" in os.environ or any("unittest" in arg for arg in sys.argv):
    os.environ.setdefault("MONGODB_URL", "mongodb://localhost:27017")
    os.environ.setdefault("MONGODB_DB", "test_db")
    os.environ.setdefault("IBM_API_KEY", "dummy_key")
    os.environ.setdefault("IBM_PROJECT_ID", "dummy_project")
    os.environ.setdefault("IBM_URL", "https://dummy.url")
    os.environ.setdefault("IBM_GRANITE_MODEL", "ibm/granite-4-h-small")


class Settings(BaseModel):
    """
    Strongly typed application configuration settings validated at startup.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)

    mongodb_url: str = Field(validate_default=True, default_factory=lambda: os.getenv("MONGODB_URL", "").strip())
    mongodb_db: str = Field(default_factory=lambda: os.getenv("MONGODB_DB", "mindcare_ai").strip())
    
    ibm_api_key: str = Field(validate_default=True, default_factory=lambda: os.getenv("IBM_API_KEY", "").strip())
    ibm_project_id: str = Field(validate_default=True, default_factory=lambda: os.getenv("IBM_PROJECT_ID", "").strip())
    ibm_url: str = Field(validate_default=True, default_factory=lambda: os.getenv("IBM_URL", "").strip())
    ibm_granite_model: str = Field(validate_default=True, default_factory=lambda: os.getenv("IBM_GRANITE_MODEL", "").strip())
    
    ibm_timeout_seconds: float = Field(validate_default=True, default_factory=lambda: os.getenv("IBM_TIMEOUT_SECONDS", "30.0"))
    ibm_max_new_tokens: int = Field(validate_default=True, default_factory=lambda: os.getenv("IBM_MAX_NEW_TOKENS", "1000"))
    
    api_title: str = "MindCare AI API"
    api_version: str = "0.1.0"
    debug: bool = Field(default_factory=lambda: os.getenv("DEBUG", "False").lower() in ("true", "1", "t"))
    cors_origins: List[str] = Field(default_factory=lambda: list(set([
        origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if origin.strip()
    ] + [
        "https://mindcare-frontend-4ays.onrender.com",
        "https://mindcare-ai-4ays.onrender.com"
    ])))

    @field_validator("mongodb_url", "ibm_api_key", "ibm_project_id", "ibm_url", "ibm_granite_model")
    @classmethod
    def validate_required_secrets(cls, v: str, info) -> str:
        if not v:
            raise ValueError(f"Configuration setting '{info.field_name}' is required and cannot be empty.")
        return v

    @field_validator("ibm_timeout_seconds")
    @classmethod
    def validate_timeout(cls, v: float) -> float:
        # Pydantic handles conversion, but validation runs on the converted float
        return v

    @field_validator("ibm_max_new_tokens")
    @classmethod
    def validate_max_tokens(cls, v: int) -> int:
        return v


# Instantiate settings to validate configuration at import time (fail fast)
settings = Settings()
