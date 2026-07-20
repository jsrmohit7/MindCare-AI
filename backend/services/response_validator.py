class GraniteValidationError(Exception):
    """Raised when the Granite AI response fails schema validation."""
    pass


REQUIRED_FIELDS = {
    "summary",
    "risk_assessment",
    "recommendations",
    "follow_up",
    "disclaimer",
}


class ResponseValidator:
    """
    Validates the structured IBM Granite AI response against a required schema.
    This component performs schema validation only and does not alter responses.
    """

    def validate(self, response: dict) -> dict:
        """
        Validate the Granite AI response.

        Returns:
            The original response object unchanged.

        Raises:
            GraniteValidationError
        """
        if not isinstance(response, dict):
            raise GraniteValidationError("Response must be a dictionary.")

        # Check for missing required fields
        for field in REQUIRED_FIELDS:
            if field not in response:
                raise GraniteValidationError(f"Missing required field: {field}")

        # Validate string fields
        string_fields = ["summary", "risk_assessment", "follow_up", "disclaimer"]
        for field in string_fields:
            val = response[field]
            if not isinstance(val, str) or not val.strip():
                raise GraniteValidationError(f"Field '{field}' must be a non-empty string.")

        # Validate recommendations
        recs = response["recommendations"]
        if not isinstance(recs, list):
            raise GraniteValidationError("Field 'recommendations' must be a list.")
        
        if len(recs) == 0:
            raise GraniteValidationError("Field 'recommendations' must not be empty.")

        for i, rec in enumerate(recs):
            if not isinstance(rec, str):
                raise GraniteValidationError(f"Recommendation at index {i} must be a string.")
            if not rec.strip():
                raise GraniteValidationError(f"Recommendation at index {i} must be a non-empty string.")

        return response
