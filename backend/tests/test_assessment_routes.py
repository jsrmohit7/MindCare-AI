import unittest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from fastapi import status

from app import app
from api.dependencies import get_assessment_service
from services.response_validator import GraniteValidationError


class TestAssessmentRoutes(unittest.TestCase):
    def setUp(self):
        # Create a mock for AssessmentService
        self.mock_service = MagicMock()
        
        # Override the dependency provider to inject our mock service
        app.dependency_overrides[get_assessment_service] = lambda: self.mock_service
        self.client = TestClient(app)

        # Setup sample data matching models/request_models
        self.sample_request = {
            "personal_info": {"occupation": "Engineer", "education": "BS", "marital_status": "Single"},
            "phq9": {"q1": 1, "q2": 1, "q3": 0, "q4": 1, "q5": 2, "q6": 1, "q7": 0, "q8": 2, "q9": 1, "total_score": None},
            "gad7": {"q1": 1, "q2": 2, "q3": 1, "q4": 0, "q5": 2, "q6": 1, "q7": 1, "total_score": None},
            "stress": [{"question": "Q1", "answer": 3}],
            "sleep": {"duration": 7.5, "quality": "Good", "night_awakenings": 1, "difficulty_falling_asleep": False},
            "lifestyle": {"exercise": "Daily", "screen_time": 4.0, "alcohol": "None", "smoking": False, "water_intake": 2.0, "diet": "Good"},
            "wellbeing": {"happiness": 7, "energy": 6, "motivation": 8, "concentration": 7, "social_support": "High"},
            "status": "submitted"
        }

        self.mock_assessment_id = "507f1f77bcf86cd799439011"
        self.sample_assessment = {
            "_id": self.mock_assessment_id,
            "risk_profile": {"overall_risk": "Moderate"},
            "ai_analysis": {
                "summary": "This is a summary",
                "risk_assessment": "Moderate Risk",
                "recommendations": ["Do breathing exercises"],
                "follow_up": "Check in one week",
                "disclaimer": "Not medical advice"
            },
            "metadata": {
                "model": "ibm/granite-4-h-small",
                "schema_version": "1.0",
                "generated_at": "2026-07-20T07:18:17.964324+00:00"
            }
        }

    def tearDown(self):
        # Clear dependency overrides to prevent test contamination
        app.dependency_overrides.clear()

    def test_health_endpoint(self):
        # Test root /health check
        response = self.client.get("/health")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_assessment_router_health(self):
        # Test assessment-specific /health check
        response = self.client.get("/api/v1/assessments/health")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_create_assessment_success(self):
        # Setup mock behavior
        self.mock_service.create_assessment = AsyncMock(return_value=self.sample_assessment)

        # Execute POST
        response = self.client.post("/api/v1/assessments", json=self.sample_request)

        # Assert status code
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Assert response schema validation and mapping (_id -> id)
        res_data = response.json()
        self.assertIn("id", res_data)
        self.assertNotIn("_id", res_data)
        self.assertEqual(res_data["id"], self.mock_assessment_id)
        self.assertEqual(res_data["risk_profile"], self.sample_assessment["risk_profile"])
        
        # Verify call arguments
        self.mock_service.create_assessment.assert_called_once_with(self.sample_request)

    def test_create_assessment_validation_failure(self):
        # Modify request to make it invalid (q1 is out of range)
        invalid_request = dict(self.sample_request)
        invalid_request["phq9"] = {"q1": 5} # q1 is ge=0, le=3

        # Execute POST
        response = self.client.post("/api/v1/assessments", json=invalid_request)

        # Assert status code (422 validation error)
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.mock_service.create_assessment.assert_not_called()

    def test_create_assessment_validation_exception(self):
        # Mock service raising GraniteValidationError
        self.mock_service.create_assessment = AsyncMock(side_effect=GraniteValidationError("Empty fields in AI response"))

        # Execute POST
        response = self.client.post("/api/v1/assessments", json=self.sample_request)

        # Assert status code (400 Bad Request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        res_json = response.json()
        error_msg = res_json.get("error", {}).get("message", res_json.get("detail", ""))
        self.assertIn("Empty fields in AI response", error_msg)

    def test_create_assessment_internal_error(self):
        # Mock service raising generic exception
        self.mock_service.create_assessment = AsyncMock(side_effect=Exception("Database connection failure"))

        # Execute POST
        response = self.client.post("/api/v1/assessments", json=self.sample_request)

        # Assert status code (500 Internal Server Error)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        res_json = response.json()
        error_msg = res_json.get("error", {}).get("message", res_json.get("detail", ""))
        self.assertIn("An unexpected error occurred", error_msg)

    def test_get_assessment_found(self):
        # Setup mock behavior
        self.mock_service.get_assessment = AsyncMock(return_value=self.sample_assessment)

        # Execute GET
        response = self.client.get(f"/api/v1/assessments/{self.mock_assessment_id}")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertEqual(res_data["id"], self.mock_assessment_id)
        self.assertNotIn("_id", res_data)
        
        self.mock_service.get_assessment.assert_called_once_with(self.mock_assessment_id)

    def test_get_assessment_not_found(self):
        # Setup mock return value as None
        self.mock_service.get_assessment = AsyncMock(return_value=None)

        # Execute GET
        response = self.client.get(f"/api/v1/assessments/{self.mock_assessment_id}")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.mock_service.get_assessment.assert_called_once_with(self.mock_assessment_id)

    def test_get_assessment_invalid_id(self):
        # Execute GET with malformed ID
        response = self.client.get("/api/v1/assessments/invalid-id-format")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.mock_service.get_assessment.assert_not_called()

    def test_list_assessments_success(self):
        # Setup mock return value
        self.mock_service.list_assessments = AsyncMock(return_value=[self.sample_assessment])

        # Execute GET
        response = self.client.get("/api/v1/assessments?limit=10")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertIn("assessments", res_data)
        self.assertEqual(len(res_data["assessments"]), 1)
        self.assertEqual(res_data["assessments"][0]["id"], self.mock_assessment_id)
        
        self.mock_service.list_assessments.assert_called_once_with(limit=10)

    def test_list_assessments_invalid_limit(self):
        # Execute GET with out-of-bounds limit parameter
        response = self.client.get("/api/v1/assessments?limit=101") # max le=100

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.mock_service.list_assessments.assert_not_called()

    def test_delete_assessment_success(self):
        # Setup mock behavior
        self.mock_service.delete_assessment = AsyncMock(return_value=True)

        # Execute DELETE
        response = self.client.delete(f"/api/v1/assessments/{self.mock_assessment_id}")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(response.text, "") # Empty body
        self.mock_service.delete_assessment.assert_called_once_with(self.mock_assessment_id)

    def test_delete_assessment_not_found(self):
        # Setup mock behavior
        self.mock_service.delete_assessment = AsyncMock(return_value=False)

        # Execute DELETE
        response = self.client.delete(f"/api/v1/assessments/{self.mock_assessment_id}")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.mock_service.delete_assessment.assert_called_once_with(self.mock_assessment_id)

    def test_delete_assessment_invalid_id(self):
        # Execute DELETE with malformed ID
        response = self.client.delete("/api/v1/assessments/invalid-id-format")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.mock_service.delete_assessment.assert_not_called()


if __name__ == "__main__":
    unittest.main()
