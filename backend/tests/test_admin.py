import unittest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from fastapi import status
from app import app
from services.auth import get_current_user
from api.dependencies import get_admin_service

class TestAdmin(unittest.TestCase):
    def setUp(self):
        # Admin user
        self.mock_admin_user = {"_id": "507f1f77bcf86cd799439011", "email": "admin@example.com", "role": "admin"}
        self.mock_service = MagicMock()

        app.dependency_overrides[get_current_user] = lambda: self.mock_admin_user
        app.dependency_overrides[get_admin_service] = lambda: self.mock_service

        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_get_admin_metrics_authorized(self):
        self.mock_service.get_anonymous_metrics = AsyncMock(return_value={"total_users": 15})
        response = self.client.get("/api/v1/admin/metrics")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["total_users"], 15)

    def test_get_admin_metrics_forbidden(self):
        # Non-admin user
        app.dependency_overrides[get_current_user] = lambda: {"_id": "507f1f77bcf86cd799439011", "email": "user@example.com", "role": "user"}
        response = self.client.get("/api/v1/admin/metrics")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
