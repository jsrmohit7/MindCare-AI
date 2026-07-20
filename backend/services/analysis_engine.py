from datetime import datetime, timezone
from typing import Any, Dict


class AnalysisEngine:
    """
    Orchestration layer coordinating prompt building, AI model communication,
    and schema validation to produce the final mental health assessment.
    
    This component does not perform business logic, scoring, directly communicate 
    with external APIs, or write to database.
    """

    def __init__(
        self,
        prompt_builder: Any,
        granite_service: Any,
        response_validator: Any
    ) -> None:
        self.prompt_builder = prompt_builder
        self.granite_service = granite_service
        self.response_validator = response_validator

    def generate_assessment(
        self,
        risk_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate the complete validated mental health assessment.
        
        Args:
            risk_profile: The dictionary output of the Risk Engine.
            
        Returns:
            A dictionary containing the original risk profile, validated AI analysis, 
            and execution metadata.
        """
        # Step 1: Generate prompt using prompt builder (callable or module with build_prompt)
        if hasattr(self.prompt_builder, "build_prompt"):
            prompt = self.prompt_builder.build_prompt(risk_profile)
        else:
            prompt = self.prompt_builder(risk_profile)

        # Step 2: Call the model via GraniteService
        raw_response = self.granite_service.generate_analysis(prompt)

        # Step 3: Validate the response via ResponseValidator
        validated_ai_response = self.response_validator.validate(raw_response)

        # Step 4: Retrieve model ID dynamically
        model_id = getattr(self.granite_service, "model_id", None)

        # Step 5: Generate UTC ISO-8601 timestamp
        generated_at = datetime.now(timezone.utc).isoformat()

        # Step 6: Assemble final assessment structure preserving original instances
        return {
            "risk_profile": risk_profile,
            "ai_analysis": validated_ai_response,
            "metadata": {
                "model": model_id,
                "schema_version": "1.0",
                "generated_at": generated_at
            }
        }
