from typing import Any, Dict, List, Optional


class AssessmentService:
    """
    Application service that orchestrates the complete assessment workflow by
    coordinating the Risk Engine, Analysis Engine, and Assessment Repository.

    It contains no business logic, scores, AI communication, or MongoDB CRUD.
    """

    def __init__(
        self,
        risk_engine: Any,
        analysis_engine: Any,
        assessment_repository: Any
    ) -> None:
        self.risk_engine = risk_engine
        self.analysis_engine = analysis_engine
        self.assessment_repository = assessment_repository

    async def create_assessment(
        self,
        questionnaire_answers: Dict[str, Any],
        user_id: str
    ) -> Dict[str, Any]:
        """
        Generate and persist a complete assessment.

        Args:
            questionnaire_answers: The raw questionnaire answers dictionary.
            user_id: The string representation of the user's ObjectId.

        Returns:
            A dictionary containing the persisted assessment with the MongoDB _id.
        """
        # 1. Generate risk profile using the existing RiskEngine API
        risk_profile = self.risk_engine.analyze_questionnaire(questionnaire_answers)

        # 2. Generate assessment using the existing AnalysisEngine API
        assessment = self.analysis_engine.generate_assessment(risk_profile)

        # 3. Save assessment to repository
        assessment_id = await self.assessment_repository.save_assessment(assessment, user_id)

        # 4. Motor mutates the assessment dict in-place by injecting _id as ObjectId.
        #    We must remove it and use the already-stringified assessment_id instead.
        assessment.pop("_id", None)

        # 5. Assemble and return final assessment including _id as a string
        return {
            "_id": assessment_id,
            **assessment
        }

    async def get_assessment(self, assessment_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve one assessment by ID.

        Args:
            assessment_id: The assessment ID string.

        Returns:
            The serialized assessment document, or None if not found.
        """
        return await self.assessment_repository.get_assessment_by_id(assessment_id)

    async def list_assessments(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Retrieve the newest assessments up to the limit.

        Args:
            user_id: The string representation of the user's ObjectId.
            limit: The maximum number of assessments to return.

        Returns:
            A list of serialized assessment dictionaries.
        """
        return await self.assessment_repository.list_assessments(user_id=user_id, limit=limit)

    async def delete_assessment(self, assessment_id: str) -> bool:
        """
        Delete an assessment by ID.

        Args:
            assessment_id: The assessment ID string.

        Returns:
            True if deleted, False otherwise.
        """
        return await self.assessment_repository.delete_assessment(assessment_id)

