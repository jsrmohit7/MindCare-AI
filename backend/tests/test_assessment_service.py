import unittest
from unittest.mock import AsyncMock, MagicMock
from services.assessment_service import AssessmentService


class TestAssessmentService(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        # Mock dependencies
        self.mock_risk_engine = MagicMock()
        self.mock_analysis_engine = MagicMock()
        self.mock_assessment_repository = MagicMock()

        # Instantiate service under test
        self.service = AssessmentService(
            risk_engine=self.mock_risk_engine,
            analysis_engine=self.mock_analysis_engine,
            assessment_repository=self.mock_assessment_repository
        )

        # Setup sample data
        self.questionnaire_answers = {"phq9": {"q1": 1, "q2": 2}}
        self.risk_profile = {"overall_risk": "Moderate"}
        self.assessment = {
            "risk_profile": self.risk_profile,
            "ai_analysis": {"summary": "AI summary"},
            "metadata": {"model": "ibm/granite-4-h-small", "schema_version": "1.0"}
        }
        self.inserted_id = "mock_mongodb_object_id_string"

    async def test_successful_execution(self):
        # Configure mocks
        self.mock_risk_engine.analyze_questionnaire.return_value = self.risk_profile
        self.mock_analysis_engine.generate_assessment.return_value = self.assessment
        
        # save_assessment is an async method
        self.mock_assessment_repository.save_assessment = AsyncMock(return_value=self.inserted_id)

        # Execute
        result = await self.service.create_assessment(self.questionnaire_answers)

        # Assertions: call counts
        self.mock_risk_engine.analyze_questionnaire.assert_called_once()
        self.mock_analysis_engine.generate_assessment.assert_called_once()
        self.mock_assessment_repository.save_assessment.assert_called_once()

        # Assertions: argument verification
        self.mock_risk_engine.analyze_questionnaire.assert_called_with(self.questionnaire_answers)
        self.mock_analysis_engine.generate_assessment.assert_called_with(self.risk_profile)
        self.mock_assessment_repository.save_assessment.assert_called_with(self.assessment)

        # Assertions: returned object contains _id
        self.assertEqual(result["_id"], self.inserted_id)

        # Assertions: object preservation (referential identity checks)
        self.assertIs(result["risk_profile"], self.assessment["risk_profile"])
        self.assertIs(result["ai_analysis"], self.assessment["ai_analysis"])
        self.assertIs(result["metadata"], self.assessment["metadata"])

    async def test_risk_engine_failure(self):
        # Configure RiskEngine to fail
        self.mock_risk_engine.analyze_questionnaire.side_effect = Exception("RiskEngine error")

        # Execute and Assert exception propagates
        with self.assertRaises(Exception) as ctx:
            await self.service.create_assessment(self.questionnaire_answers)
        self.assertEqual(str(ctx.exception), "RiskEngine error")

        # Verify downstream components were never called
        self.mock_analysis_engine.generate_assessment.assert_not_called()
        self.mock_assessment_repository.save_assessment.assert_not_called()

    async def test_analysis_engine_failure(self):
        # Configure RiskEngine success, AnalysisEngine failure
        self.mock_risk_engine.analyze_questionnaire.return_value = self.risk_profile
        self.mock_analysis_engine.generate_assessment.side_effect = Exception("AnalysisEngine error")

        # Execute and Assert exception propagates
        with self.assertRaises(Exception) as ctx:
            await self.service.create_assessment(self.questionnaire_answers)
        self.assertEqual(str(ctx.exception), "AnalysisEngine error")

        # Verify downstream components were never called
        self.mock_risk_engine.analyze_questionnaire.assert_called_once_with(self.questionnaire_answers)
        self.mock_assessment_repository.save_assessment.assert_not_called()

    async def test_repository_failure(self):
        # Configure upstream success, Repository failure
        self.mock_risk_engine.analyze_questionnaire.return_value = self.risk_profile
        self.mock_analysis_engine.generate_assessment.return_value = self.assessment
        
        # save_assessment is async, so we raise exception using side_effect
        self.mock_assessment_repository.save_assessment = AsyncMock(side_effect=Exception("Database save error"))

        # Execute and Assert exception propagates
        with self.assertRaises(Exception) as ctx:
            await self.service.create_assessment(self.questionnaire_answers)
        self.assertEqual(str(ctx.exception), "Database save error")

        # Verify upstream components were called correctly
        self.mock_risk_engine.analyze_questionnaire.assert_called_once_with(self.questionnaire_answers)
        self.mock_analysis_engine.generate_assessment.assert_called_once_with(self.risk_profile)
        self.mock_assessment_repository.save_assessment.assert_called_once_with(self.assessment)


if __name__ == "__main__":
    unittest.main()
