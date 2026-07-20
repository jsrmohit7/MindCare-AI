import os
import json
import unittest
from unittest.mock import patch, MagicMock
import httpx
import requests.exceptions
from ibm_watsonx_ai.wml_client_error import ApiRequestFailure

# Import the service and exceptions
from services.granite_service import (
    GraniteService,
    GraniteConfigError,
    GraniteAuthError,
    GraniteNetworkError,
    GraniteTimeoutError,
    GraniteSDKError,
    GraniteParsingError
)

class TestGraniteService(unittest.TestCase):
    def setUp(self):
        # Save original environment variables
        self.original_env = dict(os.environ)
        # Populate dummy environment variables for tests
        os.environ["IBM_API_KEY"] = "mock-api-key"
        os.environ["IBM_PROJECT_ID"] = "mock-project-id"
        os.environ["IBM_URL"] = "https://mock-url.ibm.com"
        os.environ["IBM_GRANITE_MODEL"] = "ibm/granite-13b-instruct-v2"
        os.environ["IBM_TIMEOUT_SECONDS"] = "5.0"

    def tearDown(self):
        # Restore original environment
        os.environ.clear()
        os.environ.update(self.original_env)

    def test_missing_config_keys(self):
        # Test case: missing configuration environment variables
        del os.environ["IBM_API_KEY"]
        with self.assertRaises(GraniteConfigError) as ctx:
            GraniteService()
        self.assertIn("IBM_API_KEY", str(ctx.exception))

    def test_invalid_timeout(self):
        # Test case: timeout value is not a float
        os.environ["IBM_TIMEOUT_SECONDS"] = "invalid-timeout"
        with self.assertRaises(GraniteConfigError) as ctx:
            GraniteService()
        self.assertIn("IBM_TIMEOUT_SECONDS", str(ctx.exception))

    @patch('services.granite_service.ModelInference')
    @patch('services.granite_service.APIClient')
    @patch('services.granite_service.Credentials')
    def test_successful_inference(self, mock_creds, mock_client, mock_model_class):
        # Test case: successful inference returning a valid JSON dictionary
        mock_model_instance = MagicMock()
        mock_model_class.return_value = mock_model_instance

        mock_response_dict = {
            "summary": "The patient shows moderate anxiety.",
            "risk_assessment": "Moderate",
            "recommendations": ["Recommendation 1", "Recommendation 2"],
            "follow_up": "Consult with a doctor.",
            "disclaimer": "This is a screening assessment and not a clinical diagnosis."
        }
        mock_model_instance.chat.return_value = {
            "choices": [
                {
                    "message": {
                        "content": json.dumps(mock_response_dict)
                    }
                }
            ]
        }

        service = GraniteService()
        result = service.generate_analysis("test prompt")

        self.assertEqual(result, mock_response_dict)
        mock_model_instance.chat.assert_called_once_with(
            messages=[{"role": "user", "content": "test prompt"}],
            params={"max_tokens": 1000}
        )

    @patch('services.granite_service.ModelInference')
    @patch('services.granite_service.APIClient')
    @patch('services.granite_service.Credentials')
    @patch('services.granite_service.time.sleep')
    def test_authentication_failure_401(self, mock_sleep, mock_creds, mock_client, mock_model_class):
        # Test case: authentication failure (HTTP 401) should raise GraniteAuthError immediately (no retries)
        mock_model_instance = MagicMock()
        mock_model_class.return_value = mock_model_instance

        dummy_response = MagicMock()
        dummy_response.status_code = 401
        err = ApiRequestFailure("Auth failed", dummy_response)
        setattr(err, "code", 401)
        mock_model_instance.chat.side_effect = err

        service = GraniteService()
        with self.assertRaises(GraniteAuthError) as ctx:
            service.generate_analysis("test prompt")

        self.assertIn("Authentication failure", str(ctx.exception))
        self.assertEqual(mock_model_instance.chat.call_count, 1)
        mock_sleep.assert_not_called()

    @patch('services.granite_service.ModelInference')
    @patch('services.granite_service.APIClient')
    @patch('services.granite_service.Credentials')
    @patch('services.granite_service.time.sleep')
    def test_authentication_failure_403(self, mock_sleep, mock_creds, mock_client, mock_model_class):
        # Test case: authentication failure (HTTP 403) should raise GraniteAuthError immediately (no retries)
        mock_model_instance = MagicMock()
        mock_model_class.return_value = mock_model_instance

        dummy_response = MagicMock()
        dummy_response.status_code = 403
        err = ApiRequestFailure("Forbidden", dummy_response)
        setattr(err, "code", 403)
        mock_model_instance.chat.side_effect = err

        service = GraniteService()
        with self.assertRaises(GraniteAuthError):
            service.generate_analysis("test prompt")

        self.assertEqual(mock_model_instance.chat.call_count, 1)
        mock_sleep.assert_not_called()

    @patch('services.granite_service.ModelInference')
    @patch('services.granite_service.APIClient')
    @patch('services.granite_service.Credentials')
    @patch('services.granite_service.time.sleep')
    def test_invalid_json_parsing(self, mock_sleep, mock_creds, mock_client, mock_model_class):
        # Test case: non-JSON response returned should raise GraniteParsingError immediately
        mock_model_instance = MagicMock()
        mock_model_class.return_value = mock_model_instance
        mock_model_instance.chat.return_value = {
            "choices": [
                {
                    "message": {
                        "content": "invalid raw text response"
                    }
                }
            ]
        }

        service = GraniteService()
        with self.assertRaises(GraniteParsingError):
            service.generate_analysis("test prompt")

        self.assertEqual(mock_model_instance.chat.call_count, 1)
        mock_sleep.assert_not_called()

    @patch('services.granite_service.ModelInference')
    @patch('services.granite_service.APIClient')
    @patch('services.granite_service.Credentials')
    @patch('services.granite_service.time.sleep')
    def test_valid_json_but_not_dictionary(self, mock_sleep, mock_creds, mock_client, mock_model_class):
        # Test case: JSON is valid list but not a dictionary should raise GraniteParsingError
        mock_model_instance = MagicMock()
        mock_model_class.return_value = mock_model_instance
        mock_model_instance.chat.return_value = {
            "choices": [
                {
                    "message": {
                        "content": '["list", "not", "dict"]'
                    }
                }
            ]
        }

        service = GraniteService()
        with self.assertRaises(GraniteParsingError):
            service.generate_analysis("test prompt")

        self.assertEqual(mock_model_instance.chat.call_count, 1)
        mock_sleep.assert_not_called()

    @patch('services.granite_service.ModelInference')
    @patch('services.granite_service.APIClient')
    @patch('services.granite_service.Credentials')
    @patch('services.granite_service.time.sleep')
    def test_timeout_handling_retries_and_fails(self, mock_sleep, mock_creds, mock_client, mock_model_class):
        # Test case: request times out and exceeds max retries, raising GraniteTimeoutError
        mock_model_instance = MagicMock()
        mock_model_class.return_value = mock_model_instance
        mock_model_instance.chat.side_effect = httpx.TimeoutException("Read timeout")

        service = GraniteService()
        with self.assertRaises(GraniteTimeoutError):
            service.generate_analysis("test prompt")

        # Initial call + 3 retries = 4 calls total
        self.assertEqual(mock_model_instance.chat.call_count, 4)
        self.assertEqual(mock_sleep.call_count, 3)
        # Verifying exponential backoff values: 1s, 2s, 4s
        mock_sleep.assert_any_call(1.0)
        mock_sleep.assert_any_call(2.0)
        mock_sleep.assert_any_call(4.0)

    @patch('services.granite_service.ModelInference')
    @patch('services.granite_service.APIClient')
    @patch('services.granite_service.Credentials')
    @patch('services.granite_service.time.sleep')
    def test_timeout_handling_succeeds_on_retry(self, mock_sleep, mock_creds, mock_client, mock_model_class):
        # Test case: request times out initially, but succeeds on the first retry
        mock_model_instance = MagicMock()
        mock_model_class.return_value = mock_model_instance

        mock_response = {"success": True}
        mock_model_instance.chat.side_effect = [
            httpx.TimeoutException("Read timeout"),
            {
                "choices": [
                    {
                        "message": {
                            "content": json.dumps(mock_response)
                        }
                    }
                ]
            }
        ]

        service = GraniteService()
        result = service.generate_analysis("test prompt")

        self.assertEqual(result, mock_response)
        self.assertEqual(mock_model_instance.chat.call_count, 2)
        mock_sleep.assert_called_once_with(1.0)

    @patch('services.granite_service.ModelInference')
    @patch('services.granite_service.APIClient')
    @patch('services.granite_service.Credentials')
    @patch('services.granite_service.time.sleep')
    def test_network_failure_retries_and_fails(self, mock_sleep, mock_creds, mock_client, mock_model_class):
        # Test case: network exception occurs and raises GraniteNetworkError after retrying
        mock_model_instance = MagicMock()
        mock_model_class.return_value = mock_model_instance
        mock_model_instance.chat.side_effect = httpx.NetworkError("DNS resolution failed")

        service = GraniteService()
        with self.assertRaises(GraniteNetworkError):
            service.generate_analysis("test prompt")

        self.assertEqual(mock_model_instance.chat.call_count, 4)
        self.assertEqual(mock_sleep.call_count, 3)

    @patch('services.granite_service.ModelInference')
    @patch('services.granite_service.APIClient')
    @patch('services.granite_service.Credentials')
    @patch('services.granite_service.time.sleep')
    def test_transient_status_codes_retry(self, mock_sleep, mock_creds, mock_client, mock_model_class):
        # Test case: transient API response status code (HTTP 429) retries and raises GraniteSDKError
        mock_model_instance = MagicMock()
        mock_model_class.return_value = mock_model_instance

        dummy_response = MagicMock()
        dummy_response.status_code = 429
        err = ApiRequestFailure("Rate limit exceeded", dummy_response)
        setattr(err, "code", 429)
        mock_model_instance.chat.side_effect = err

        service = GraniteService()
        with self.assertRaises(GraniteSDKError) as ctx:
            service.generate_analysis("test prompt")

        self.assertIn("HTTP 429", str(ctx.exception))
        self.assertEqual(mock_model_instance.chat.call_count, 4)
        self.assertEqual(mock_sleep.call_count, 3)

    @patch('services.granite_service.ModelInference')
    @patch('services.granite_service.APIClient')
    @patch('services.granite_service.Credentials')
    @patch('services.granite_service.time.sleep')
    def test_non_transient_status_code_400_no_retry(self, mock_sleep, mock_creds, mock_client, mock_model_class):
        # Test case: non-transient status code (HTTP 400 Bad Request) should not retry
        mock_model_instance = MagicMock()
        mock_model_class.return_value = mock_model_instance

        dummy_response = MagicMock()
        dummy_response.status_code = 400
        err = ApiRequestFailure("Bad request details", dummy_response)
        setattr(err, "code", 400)
        mock_model_instance.chat.side_effect = err

        service = GraniteService()
        with self.assertRaises(GraniteSDKError) as ctx:
            service.generate_analysis("test prompt")

        self.assertIn("HTTP 400", str(ctx.exception))
        self.assertEqual(mock_model_instance.chat.call_count, 1)
        mock_sleep.assert_not_called()

if __name__ == '__main__':
    unittest.main()
