import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import FastAPI, HTTPException, status
from pydantic import ValidationError

from app import create_app
from core.config import Settings
from core.logging import setup_logging


class TestInfrastructure(unittest.TestCase):
    def setUp(self):
        # Create a mock client using a newly constructed app
        # Mock database connection inside lifespan so it doesn't fail fast on real connect
        self.patcher_connect = patch("config.database.connect_to_mongo", new_callable=AsyncMock)
        self.patcher_close = patch("config.database.close_mongo_connection", new_callable=AsyncMock)
        
        self.mock_connect = self.patcher_connect.start()
        self.mock_close = self.patcher_close.start()

        # Instantiate app factory
        self.app = create_app()
        from config.database import get_database
        self.app.dependency_overrides[get_database] = lambda: MagicMock()
        self.client = TestClient(self.app)

    def tearDown(self):
        self.app.dependency_overrides.clear()
        self.patcher_connect.stop()
        self.patcher_close.stop()

    def test_settings_validation_missing_required(self):
        # Settings require values. Mock environment variables to be empty.
        with patch.dict("os.environ", {
            "MONGODB_URL": "",
            "IBM_API_KEY": "",
            "IBM_PROJECT_ID": "",
            "IBM_URL": "",
            "IBM_GRANITE_MODEL": ""
        }):
            with self.assertRaises(ValidationError):
                # Attempt to instantiate settings, which should trigger field validations
                Settings()

    def test_settings_validation_custom_timeout(self):
        with patch.dict("os.environ", {
            "MONGODB_URL": "mongodb://localhost:27017",
            "IBM_API_KEY": "valid_key",
            "IBM_PROJECT_ID": "project_id",
            "IBM_URL": "https://url.com",
            "IBM_GRANITE_MODEL": "granite-model",
            "IBM_TIMEOUT_SECONDS": "45.5"
        }):
            s = Settings()
            self.assertEqual(s.ibm_timeout_seconds, 45.5)

    def test_middleware_headers_exist(self):
        # Any request to a valid path should return X-Request-ID and X-Process-Time
        response = self.client.get("/health")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("X-Request-ID", response.headers)
        self.assertIn("X-Process-Time", response.headers)

    def test_request_ids_are_unique(self):
        # Trigger two requests and verify they return unique Request IDs
        resp1 = self.client.get("/health")
        resp2 = self.client.get("/health")
        
        id1 = resp1.headers["X-Request-ID"]
        id2 = resp2.headers["X-Request-ID"]
        
        self.assertNotEqual(id1, id2)

    def test_exception_handler_validation_error_format(self):
        # Trigger a 422 by sending invalid payload structure to versioned endpoint
        response = self.client.post("/api/v1/assessments", json={"invalid_field": "test"})
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        
        res_json = response.json()
        self.assertIn("error", res_json)
        self.assertEqual(res_json["error"]["code"], "VALIDATION_ERROR")
        self.assertEqual(res_json["error"]["message"], "Request body validation failed.")
        self.assertIsNotNone(res_json["error"]["details"])

    def test_exception_handler_http_error_format(self):
        # Trigger a 404 by accessing non-existent path
        response = self.client.get("/api/v1/non-existent-route")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        res_json = response.json()
        self.assertIn("error", res_json)
        self.assertEqual(res_json["error"]["code"], "HTTP_ERROR_404")
        self.assertEqual(res_json["error"]["message"], "Not Found")

    def test_health_endpoint(self):
        # Root health check must return HTTP 200 and ok status
        response = self.client.get("/health")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {"status": "ok"})

    @patch("app.get_database")
    def test_readiness_endpoint_ready(self, mock_get_db):
        # Mock database ping command to succeed
        mock_db_instance = MagicMock()
        mock_db_instance.command = AsyncMock(return_value={"ok": 1.0})
        mock_get_db.return_value = mock_db_instance

        # Execute GET /ready
        response = self.client.get("/ready")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {"status": "ok"})
        mock_db_instance.command.assert_called_once_with("ping")

    @patch("app.get_database")
    def test_readiness_endpoint_not_ready(self, mock_get_db):
        # Mock database ping command to fail
        mock_db_instance = MagicMock()
        mock_db_instance.command = AsyncMock(side_effect=Exception("Connection timed out"))
        mock_get_db.return_value = mock_db_instance

        # Execute GET /ready
        response = self.client.get("/ready")
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn("Service not ready", response.json()["error"]["message"])

    def test_lifespan_events(self):
        # Verify startup setup_logging and connect_to_mongo run within the lifespan context
        with TestClient(self.app) as _:
            self.mock_connect.assert_called_once()
        self.mock_close.assert_called_once()


if __name__ == "__main__":
    unittest.main()
