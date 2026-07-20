import os
import uuid
import json
import time
import logging
from typing import Any, Dict
import httpx
from ibm_watsonx_ai import Credentials, APIClient
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.wml_client_error import ApiRequestFailure
from ibm_watsonx_ai.utils.utils import HttpClientConfig
import requests.exceptions

logger = logging.getLogger("mindcare_ai.granite_service")

class GraniteServiceError(Exception):
    """Base exception for all Granite Service errors."""
    pass

class GraniteConfigError(GraniteServiceError):
    """Raised when environment variables or configurations are missing or invalid."""
    pass

class GraniteAuthError(GraniteServiceError):
    """Raised when credentials authentication fails."""
    pass

class GraniteNetworkError(GraniteServiceError):
    """Raised when a temporary network or connection failure occurs."""
    pass

class GraniteTimeoutError(GraniteServiceError):
    """Raised when the request to Watsonx.ai times out."""
    pass

class GraniteSDKError(GraniteServiceError):
    """Raised when the Watsonx.ai SDK raises a general/unexpected error."""
    pass

class GraniteParsingError(GraniteServiceError):
    """Raised when the response text cannot be parsed into a dictionary (invalid JSON)."""
    pass


class GraniteService:
    """
    Isolated infrastructure layer communicating with IBM watsonx.ai Foundation Models.
    Ensures single client construction, structured logging, and robust exception handling.
    """

    def __init__(self) -> None:
        from core.config import Settings
        from pydantic import ValidationError
        
        try:
            settings = Settings()
        except ValidationError as e:
            msg = str(e)
            # Map Pydantic field names to env variables for backward compatibility with existing tests
            mappings = {
                "ibm_api_key": "IBM_API_KEY",
                "ibm_project_id": "IBM_PROJECT_ID",
                "ibm_url": "IBM_URL",
                "ibm_granite_model": "IBM_GRANITE_MODEL",
                "ibm_timeout_seconds": "IBM_TIMEOUT_SECONDS",
                "ibm_max_new_tokens": "IBM_MAX_NEW_TOKENS"
            }
            for field, env_var in mappings.items():
                msg = msg.replace(field, env_var)
            # Re-raise as GraniteConfigError to preserve expected exceptions in tests
            raise GraniteConfigError(f"Configuration validation failed: {msg}")
        
        # Load environment configuration from centralized settings
        self.api_key = settings.ibm_api_key
        self.project_id = settings.ibm_project_id
        self.url = settings.ibm_url
        self.model_id = settings.ibm_granite_model
        self.timeout_seconds = settings.ibm_timeout_seconds
        self.max_new_tokens = settings.ibm_max_new_tokens

        try:
            # Initialize watsonx.ai credentials
            credentials = Credentials(
                url=self.url,
                api_key=self.api_key
            )

            # Configure request timeouts using httpx config
            timeout = httpx.Timeout(self.timeout_seconds)
            http_config = HttpClientConfig(timeout=timeout)

            # Construct APIClient and reuse it
            self.client = APIClient(
                credentials=credentials,
                project_id=self.project_id,
                httpx_client=http_config,
                async_httpx_client=http_config
            )

            # Initialize model inference interface once
            self.model = ModelInference(
                model_id=self.model_id,
                api_client=self.client
            )
        except Exception as e:
            raise GraniteSDKError(f"Failed to initialize Watsonx.ai client: {e}") from e

    def _create_chat_messages(self, prompt: str) -> list[dict]:
        """
        Formats the input prompt into the messages structure required by the Chat API.
        """
        return [
            {
                "role": "user",
                "content": prompt
            }
        ]

    def generate_analysis(self, prompt: str) -> Dict[str, Any]:
        """
        Receives the prompt and requests inference from the IBM Granite Model.
        Returns the parsed response as a Python dictionary.
        """
        correlation_id = str(uuid.uuid4())

        logger.info(
            "Request started. Correlation ID: %s, Selected Granite model: %s",
            correlation_id,
            self.model_id
        )

        max_retries = 3
        base_delay = 1.0
        response_text = None
        start_time = time.perf_counter()
        messages = self._create_chat_messages(prompt)

        for attempt in range(max_retries + 1):
            try:
                chat_response = self.model.chat(
                    messages=messages,
                    params={
                        "max_tokens": self.max_new_tokens
                    }
                )
                response_text = chat_response["choices"][0]["message"]["content"]
                break  # Success!
            except ApiRequestFailure as e:
                # Retrieve HTTP status code if available
                status_code = getattr(e, "code", None)
                if status_code is None and hasattr(e, "response") and hasattr(e.response, "status_code"):
                    status_code = e.response.status_code

                # Map 401/403 directly to Authentication error
                if status_code in (401, 403):
                    duration = time.perf_counter() - start_time
                    logger.error(
                        "Request failed. Correlation ID: %s, Selected Granite model: %s, Success or failure status: Failure, Response duration: %.4f seconds",
                        correlation_id,
                        self.model_id,
                        duration
                    )
                    raise GraniteAuthError(f"Authentication failure with watsonx.ai (HTTP {status_code}): {e}") from e

                # Determine if transient error
                is_transient = status_code in (429,) or (status_code is not None and 500 <= status_code < 600)

                if is_transient and attempt < max_retries:
                    sleep_time = base_delay * (2 ** attempt)
                    logger.warning(
                        "Transient ApiRequestFailure (HTTP %s) on attempt %d. Correlation ID: %s. Retrying in %.1f seconds...",
                        status_code,
                        attempt + 1,
                        correlation_id,
                        sleep_time
                    )
                    time.sleep(sleep_time)
                    continue
                else:
                    duration = time.perf_counter() - start_time
                    logger.error(
                        "Request failed. Correlation ID: %s, Selected Granite model: %s, Success or failure status: Failure, Response duration: %.4f seconds",
                        correlation_id,
                        self.model_id,
                        duration
                    )
                    raise GraniteSDKError(f"Watsonx.ai SDK request failed (HTTP {status_code}): {e}") from e

            except httpx.TimeoutException as e:
                if attempt < max_retries:
                    sleep_time = base_delay * (2 ** attempt)
                    logger.warning(
                        "Transient timeout on attempt %d. Correlation ID: %s. Retrying in %.1f seconds...",
                        attempt + 1,
                        correlation_id,
                        sleep_time
                    )
                    time.sleep(sleep_time)
                    continue
                else:
                    duration = time.perf_counter() - start_time
                    logger.error(
                        "Request failed. Correlation ID: %s, Selected Granite model: %s, Success or failure status: Failure, Response duration: %.4f seconds",
                        correlation_id,
                        self.model_id,
                        duration
                    )
                    raise GraniteTimeoutError(f"Request to Watsonx.ai timed out: {e}") from e

            except (httpx.NetworkError, requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
                if attempt < max_retries:
                    sleep_time = base_delay * (2 ** attempt)
                    logger.warning(
                        "Transient network error on attempt %d. Correlation ID: %s. Retrying in %.1f seconds...",
                        attempt + 1,
                        correlation_id,
                        sleep_time
                    )
                    time.sleep(sleep_time)
                    continue
                else:
                    duration = time.perf_counter() - start_time
                    logger.error(
                        "Request failed. Correlation ID: %s, Selected Granite model: %s, Success or failure status: Failure, Response duration: %.4f seconds",
                        correlation_id,
                        self.model_id,
                        duration
                    )
                    raise GraniteNetworkError(f"Network failure communicating with Watsonx.ai: {e}") from e

            except Exception as e:
                duration = time.perf_counter() - start_time
                logger.error(
                    "Request failed. Correlation ID: %s, Selected Granite model: %s, Success or failure status: Failure, Response duration: %.4f seconds",
                    correlation_id,
                    self.model_id,
                    duration
                )
                raise GraniteSDKError(f"Unexpected error in GraniteService: {e}") from e

        duration = time.perf_counter() - start_time

        if response_text is None:
            logger.error(
                "Request completed with no response content. Correlation ID: %s, Selected Granite model: %s, Success or failure status: Failure, Response duration: %.4f seconds",
                correlation_id,
                self.model_id,
                duration
            )
            raise GraniteParsingError("Empty response returned from IBM Granite model")

        try:
            # Parse directly to dict. No cleanup/normalization.
            parsed_data = json.loads(response_text)
            if not isinstance(parsed_data, dict):
                raise ValueError("Parsed output is not a dictionary")
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(
                "Request completed but JSON parsing failed. Correlation ID: %s, Selected Granite model: %s, Success or failure status: Failure, Response duration: %.4f seconds",
                correlation_id,
                self.model_id,
                duration
            )
            raise GraniteParsingError(f"Failed to parse IBM Granite response as valid JSON dictionary: {e}") from e

        logger.info(
            "Request completed. Correlation ID: %s, Selected Granite model: %s, Success or failure status: Success, Response duration: %.4f seconds",
            correlation_id,
            self.model_id,
            duration
        )
        return parsed_data
