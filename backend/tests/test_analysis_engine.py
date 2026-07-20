import unittest
from unittest.mock import MagicMock
from services.analysis_engine import AnalysisEngine
from services.response_validator import GraniteValidationError


class TestAnalysisEngine(unittest.TestCase):
    def setUp(self):
        # Create mock dependencies
        self.mock_prompt_builder = MagicMock()
        # Delete build_prompt attribute to prevent MagicMock from dynamically auto-generating it
        del self.mock_prompt_builder.build_prompt
        self.mock_granite_service = MagicMock()
        self.mock_response_validator = MagicMock()
        
        # Configure granite service mock model id
        self.mock_model_id = "ibm/granite-4-h-small"
        self.mock_granite_service.model_id = self.mock_model_id

        # Instantiate engine under test
        self.engine = AnalysisEngine(
            prompt_builder=self.mock_prompt_builder,
            granite_service=self.mock_granite_service,
            response_validator=self.mock_response_validator
        )

        # Setup sample inputs and outputs
        self.risk_profile = {
            "phq9": {"score": 10, "severity": "Moderate"},
            "overall_risk": {"score": 50, "level": "Moderate"}
        }
        self.mock_prompt = "Built Prompt String"
        self.mock_raw_response = {"summary": "raw response content"}
        self.mock_validated_response = {"summary": "validated response content"}

    def test_successful_assessment(self):
        # Configure mocks for success
        self.mock_prompt_builder.return_value = self.mock_prompt
        self.mock_granite_service.generate_analysis.return_value = self.mock_raw_response
        self.mock_response_validator.validate.return_value = self.mock_validated_response

        # Execute
        result = self.engine.generate_assessment(self.risk_profile)

        # Assert orchestration sequence & parameters
        self.mock_prompt_builder.assert_called_once_with(self.risk_profile)
        self.mock_granite_service.generate_analysis.assert_called_once_with(self.mock_prompt)
        self.mock_response_validator.validate.assert_called_once_with(self.mock_raw_response)

        # Assert structure and preservation of original object instances
        self.assertIs(result["risk_profile"], self.risk_profile)
        self.assertIs(result["ai_analysis"], self.mock_validated_response)
        
        # Assert metadata
        metadata = result["metadata"]
        self.assertEqual(metadata["model"], self.mock_model_id)
        self.assertEqual(metadata["schema_version"], "1.0")
        self.assertIn("generated_at", metadata)
        self.assertIsInstance(metadata["generated_at"], str)
        self.assertTrue(len(metadata["generated_at"]) > 0)

    def test_successful_assessment_builder_method(self):
        # Configure mock where prompt builder is an object with build_prompt method
        builder_obj = MagicMock()
        builder_obj.build_prompt.return_value = self.mock_prompt
        
        engine_with_obj = AnalysisEngine(
            prompt_builder=builder_obj,
            granite_service=self.mock_granite_service,
            response_validator=self.mock_response_validator
        )

        self.mock_granite_service.generate_analysis.return_value = self.mock_raw_response
        self.mock_response_validator.validate.return_value = self.mock_validated_response

        # Execute
        result = engine_with_obj.generate_assessment(self.risk_profile)

        # Assert correct method call
        builder_obj.build_prompt.assert_called_once_with(self.risk_profile)
        self.mock_granite_service.generate_analysis.assert_called_once_with(self.mock_prompt)
        self.mock_response_validator.validate.assert_called_once_with(self.mock_raw_response)
        
        self.assertIs(result["risk_profile"], self.risk_profile)
        self.assertIs(result["ai_analysis"], self.mock_validated_response)

    def test_prompt_builder_failure(self):
        # Configure prompt builder to raise an exception
        self.mock_prompt_builder.side_effect = Exception("Prompt building failed")

        # Execute & Assert exception propagates
        with self.assertRaises(Exception) as ctx:
            self.engine.generate_assessment(self.risk_profile)
        self.assertEqual(str(ctx.exception), "Prompt building failed")

        # Verify downstream components were never called
        self.mock_granite_service.generate_analysis.assert_not_called()
        self.mock_response_validator.validate.assert_not_called()

    def test_granite_service_failure(self):
        # Configure prompt builder success, granite service failure
        self.mock_prompt_builder.return_value = self.mock_prompt
        self.mock_granite_service.generate_analysis.side_effect = Exception("Granite inference failed")

        # Execute & Assert exception propagates
        with self.assertRaises(Exception) as ctx:
            self.engine.generate_assessment(self.risk_profile)
        self.assertEqual(str(ctx.exception), "Granite inference failed")

        # Verify response validator was never called
        self.mock_prompt_builder.assert_called_once_with(self.risk_profile)
        self.mock_granite_service.generate_analysis.assert_called_once_with(self.mock_prompt)
        self.mock_response_validator.validate.assert_not_called()

    def test_response_validator_failure(self):
        # Configure prompt builder and granite service success, response validator failure
        self.mock_prompt_builder.return_value = self.mock_prompt
        self.mock_granite_service.generate_analysis.return_value = self.mock_raw_response
        self.mock_response_validator.validate.side_effect = GraniteValidationError("Missing required field: summary")

        # Execute & Assert exception propagates
        with self.assertRaises(GraniteValidationError) as ctx:
            self.engine.generate_assessment(self.risk_profile)
        self.assertEqual(str(ctx.exception), "Missing required field: summary")

        # Verify orchestration calls
        self.mock_prompt_builder.assert_called_once_with(self.risk_profile)
        self.mock_granite_service.generate_analysis.assert_called_once_with(self.mock_prompt)
        self.mock_response_validator.validate.assert_called_once_with(self.mock_raw_response)


if __name__ == "__main__":
    unittest.main()
