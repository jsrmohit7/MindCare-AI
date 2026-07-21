import abc
import os
import json
import time
import uuid
import logging
import httpx
from typing import Any, Dict, List, Optional
from ibm_watsonx_ai import Credentials, APIClient
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.wml_client_error import ApiRequestFailure
from ibm_watsonx_ai.utils.utils import HttpClientConfig
import requests.exceptions

# Standard exception mappings matching v2/v3 expected types
class AIOrchestratorError(Exception):
    """Base exception for all AI Orchestrator errors."""
    pass

class AIConfigError(AIOrchestratorError):
    """Raised when environment variables or configurations are missing or invalid."""
    pass

class AIAuthError(AIOrchestratorError):
    """Raised when credentials authentication fails."""
    pass

class AINetworkError(AIOrchestratorError):
    """Raised when a temporary network or connection failure occurs."""
    pass

class AITimeoutError(AIOrchestratorError):
    """Raised when the request to AI provider times out."""
    pass

class AISDKError(AIOrchestratorError):
    """Raised when the provider SDK raises a general/unexpected error."""
    pass

class AIParsingError(AIOrchestratorError):
    """Raised when response text cannot be parsed into the requested format (e.g. invalid JSON)."""
    pass


logger = logging.getLogger("mindcare_ai.ai_orchestrator")


class BaseLLMProvider(abc.ABC):
    """
    Interface for pluggable AI model providers.
    """
    @abc.abstractmethod
    def generate_text(self, system_prompt: str, messages: List[Dict[str, str]], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generates raw text response and returns it with usage metadata."""
        pass

    @abc.abstractmethod
    def generate_json(self, system_prompt: str, prompt: str, schema: Optional[Dict[str, Any]] = None, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generates structured JSON response and returns parsed dict with usage metadata."""
        pass


class GraniteProvider(BaseLLMProvider):
    """
    Concrete implementation of BaseLLMProvider using IBM watsonx.ai Granite models.
    """

    def __init__(self) -> None:
        from core.config import Settings
        from pydantic import ValidationError

        try:
            settings = Settings()
        except ValidationError as e:
            msg = str(e)
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
            raise AIConfigError(f"Configuration validation failed: {msg}")

        self.api_key = settings.ibm_api_key
        self.project_id = settings.ibm_project_id
        self.url = settings.ibm_url
        self.model_id = settings.ibm_granite_model
        self.timeout_seconds = settings.ibm_timeout_seconds
        self.max_new_tokens = settings.ibm_max_new_tokens

        try:
            credentials = Credentials(url=self.url, api_key=self.api_key)
            timeout = httpx.Timeout(self.timeout_seconds)
            http_config = HttpClientConfig(timeout=timeout)

            self.client = APIClient(
                credentials=credentials,
                project_id=self.project_id,
                httpx_client=http_config,
                async_httpx_client=http_config
            )

            self.model = ModelInference(
                model_id=self.model_id,
                api_client=self.client
            )
        except Exception as e:
            raise AISDKError(f"Failed to initialize Watsonx.ai client: {e}") from e

    def _estimate_tokens(self, text: str) -> int:
        """Simple word-based token estimation (approx 1.3 tokens per word)."""
        if not text:
            return 0
        return int(len(text.split()) * 1.3)

    def _execute_chat(self, messages: List[Dict[str, str]], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Executes raw Watsonx chat query with retry logic, exponential backoff,
        and latency tracking.
        """
        correlation_id = str(uuid.uuid4())
        max_retries = 3
        base_delay = 1.0
        response_text = None
        start_time = time.perf_counter()

        logger.info("AI request started. Correlation ID: %s, Model: %s", correlation_id, self.model_id)

        chat_params = {"max_tokens": self.max_new_tokens}
        if params:
            chat_params.update(params)

        for attempt in range(max_retries + 1):
            try:
                chat_response = self.model.chat(
                    messages=messages,
                    params=chat_params
                )
                response_text = chat_response["choices"][0]["message"]["content"]
                break
            except ApiRequestFailure as e:
                status_code = getattr(e, "code", None)
                if status_code is None and hasattr(e, "response") and hasattr(e.response, "status_code"):
                    status_code = e.response.status_code

                if status_code in (401, 403):
                    logger.error("Authentication failure. Correlation ID: %s, HTTP Status: %s", correlation_id, status_code)
                    raise AIAuthError(f"Authentication failure with watsonx.ai (HTTP {status_code}): {e}") from e

                is_transient = status_code in (429,) or (status_code is not None and 500 <= status_code < 600)
                if is_transient and attempt < max_retries:
                    sleep_time = base_delay * (2 ** attempt)
                    logger.warning("Transient HTTP %s failure on attempt %d. Retrying in %.1f seconds...", status_code, attempt + 1, sleep_time)
                    time.sleep(sleep_time)
                    continue
                else:
                    logger.error("Non-transient SDK failure. Correlation ID: %s, HTTP Status: %s", correlation_id, status_code)
                    raise AISDKError(f"Watsonx.ai SDK request failed (HTTP {status_code}): {e}") from e

            except httpx.TimeoutException as e:
                if attempt < max_retries:
                    sleep_time = base_delay * (2 ** attempt)
                    logger.warning("Timeout exception on attempt %d. Retrying in %.1f seconds...", attempt + 1, sleep_time)
                    time.sleep(sleep_time)
                    continue
                else:
                    logger.error("Timeout exceeded. Correlation ID: %s", correlation_id)
                    raise AITimeoutError(f"Request to Watsonx.ai timed out: {e}") from e

            except (httpx.NetworkError, requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
                if attempt < max_retries:
                    sleep_time = base_delay * (2 ** attempt)
                    logger.warning("Network failure on attempt %d. Retrying in %.1f seconds...", attempt + 1, sleep_time)
                    time.sleep(sleep_time)
                    continue
                else:
                    logger.error("Network connection failure. Correlation ID: %s", correlation_id)
                    raise AINetworkError(f"Network failure communicating with Watsonx.ai: {e}") from e

            except Exception as e:
                logger.error("Unexpected SDK exception. Correlation ID: %s, Error: %s", correlation_id, e)
                raise AISDKError(f"Unexpected error in GraniteService: {e}") from e

        duration = time.perf_counter() - start_time
        if response_text is None:
            logger.error("Empty response received. Correlation ID: %s", correlation_id)
            raise AIParsingError("Empty response returned from IBM Granite model")

        # Estimate input/output tokens
        input_content = " ".join([m.get("content", "") for m in messages])
        input_tokens = self._estimate_tokens(input_content)
        output_tokens = self._estimate_tokens(response_text)

        logger.info(
            "AI request finished. Correlation ID: %s, Model: %s, Success: True, Duration: %.4f seconds, Tokens: %d",
            correlation_id, self.model_id, duration, input_tokens + output_tokens
        )

        return {
            "text": response_text,
            "latency": duration,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "model": self.model_id
        }

    def generate_text(self, system_prompt: str, messages: List[Dict[str, str]], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        full_messages = []
        if system_prompt:
            full_messages.append({"role": "system", "content": system_prompt})
        for msg in messages:
            full_messages.append({"role": msg["role"], "content": msg["content"]})
        return self._execute_chat(full_messages, params)

    def generate_json(self, system_prompt: str, prompt: str, schema: Optional[Dict[str, Any]] = None, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        system_instructions = system_prompt or ""
        if schema:
            system_instructions += f"\n\nOUTPUT REQUIREMENT: Return STRICT JSON format only. Match this schema:\n{json.dumps(schema)}"
        
        messages = [{"role": "user", "content": prompt}]
        res = self.generate_text(system_prompt=system_instructions, messages=messages, params=params)
        
        raw_text = res["text"].strip()
        
        # Clean up any potential markdown wraps
        if raw_text.startswith("```json"):
            raw_text = raw_text.replace("```json", "", 1)
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3].strip()
        
        try:
            parsed_json = json.loads(raw_text)
            res["data"] = parsed_json
            return res
        except (json.JSONDecodeError, ValueError) as e:
            logger.error("JSON parsing failure: %s, Raw text: %s", e, raw_text)
            raise AIParsingError(f"Failed to parse response as valid JSON dictionary: {e}") from e


class AIOrchestrator:
    """
    Central gateway responsible for routing all LLM requests in the ecosystem.
    Supports pluggable providers and tracks diagnostic logs.
    """
    def __init__(self, provider: Optional[BaseLLMProvider] = None) -> None:
        self.provider = provider or GraniteProvider()

    @property
    def model_id(self) -> str:
        if hasattr(self.provider, "model_id"):
            return self.provider.model_id
        return "unknown-model"

    def generate_text(self, system_prompt: str, messages: List[Dict[str, str]], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self.provider.generate_text(system_prompt, messages, params)

    def generate_json(self, system_prompt: str, prompt: str, schema: Optional[Dict[str, Any]] = None, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self.provider.generate_json(system_prompt, prompt, schema, params)

    def generate_analysis(self, prompt: str) -> Dict[str, Any]:
        """Backward-compatible wrapper for structured assessment analytics."""
        res = self.generate_json(system_prompt="", prompt=prompt)
        return res["data"]

    def generate_chat_response(self, system_prompt: str, chat_history: List[Dict[str, str]]) -> str:
        """Backward-compatible wrapper for free-text chat responses."""
        res = self.generate_text(system_prompt=system_prompt, messages=chat_history)
        return res["text"]

