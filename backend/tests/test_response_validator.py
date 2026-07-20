import unittest
from services.response_validator import ResponseValidator, GraniteValidationError


class TestResponseValidator(unittest.TestCase):
    def setUp(self):
        self.validator = ResponseValidator()
        self.valid_response = {
            "summary": "This is a valid summary.",
            "risk_assessment": "Moderate risk",
            "recommendations": [
                "Practice daily breathing exercise.",
                "Maintain a consistent sleep routine."
            ],
            "follow_up": "Consult with a mental health professional.",
            "disclaimer": "This assessment is based on standardized screening questionnaires and is not a medical diagnosis."
        }

    def test_valid_response(self):
        # Test case: valid response passes and returns the exact same instance
        result = self.validator.validate(self.valid_response)
        self.assertEqual(result, self.valid_response)
        self.assertIs(result, self.valid_response)

    def test_valid_response_with_unknown_fields(self):
        # Test case: extra unknown fields are preserved and ignored
        response_copy = dict(self.valid_response)
        response_copy["model_version"] = "4.0"
        response_copy["confidence"] = 0.95
        
        result = self.validator.validate(response_copy)
        self.assertEqual(result, response_copy)
        self.assertIs(result, response_copy)
        self.assertIn("model_version", result)
        self.assertIn("confidence", result)

    def test_response_is_not_dictionary(self):
        # Test case: response is not a dict (list, string, None)
        invalid_cases = [
            [],
            "hello",
            None
        ]
        for case in invalid_cases:
            with self.subTest(case=case):
                with self.assertRaises(GraniteValidationError) as ctx:
                    self.validator.validate(case)
                self.assertEqual(str(ctx.exception), "Response must be a dictionary.")

    def test_missing_required_fields(self):
        # Test case: missing individual required fields
        required_fields = ["summary", "risk_assessment", "recommendations", "follow_up", "disclaimer"]
        for field in required_fields:
            with self.subTest(missing_field=field):
                response_copy = dict(self.valid_response)
                del response_copy[field]
                with self.assertRaises(GraniteValidationError) as ctx:
                    self.validator.validate(response_copy)
                self.assertEqual(str(ctx.exception), f"Missing required field: {field}")

    def test_empty_string_fields(self):
        # Test case: string fields are empty or whitespace-only
        string_fields = ["summary", "risk_assessment", "follow_up", "disclaimer"]
        empty_vals = ["", "   ", "\n\t"]
        for field in string_fields:
            for val in empty_vals:
                with self.subTest(field=field, value=repr(val)):
                    response_copy = dict(self.valid_response)
                    response_copy[field] = val
                    with self.assertRaises(GraniteValidationError) as ctx:
                        self.validator.validate(response_copy)
                    self.assertEqual(str(ctx.exception), f"Field '{field}' must be a non-empty string.")

    def test_string_field_non_string_type(self):
        # Test case: string fields with non-string values
        string_fields = ["summary", "risk_assessment", "follow_up", "disclaimer"]
        invalid_types = [123, True, [], {}]
        for field in string_fields:
            for val in invalid_types:
                with self.subTest(field=field, value=type(val)):
                    response_copy = dict(self.valid_response)
                    response_copy[field] = val
                    with self.assertRaises(GraniteValidationError) as ctx:
                        self.validator.validate(response_copy)
                    self.assertEqual(str(ctx.exception), f"Field '{field}' must be a non-empty string.")

    def test_recommendations_not_a_list(self):
        # Test case: recommendations is not a list
        invalid_recs = ["Exercise", 123, {}, None]
        for val in invalid_recs:
            with self.subTest(value=repr(val)):
                response_copy = dict(self.valid_response)
                response_copy["recommendations"] = val
                with self.assertRaises(GraniteValidationError) as ctx:
                    self.validator.validate(response_copy)
                self.assertEqual(str(ctx.exception), "Field 'recommendations' must be a list.")

    def test_recommendations_empty_list(self):
        # Test case: recommendations is an empty list
        response_copy = dict(self.valid_response)
        response_copy["recommendations"] = []
        with self.assertRaises(GraniteValidationError) as ctx:
            self.validator.validate(response_copy)
        self.assertEqual(str(ctx.exception), "Field 'recommendations' must not be empty.")

    def test_recommendations_contains_empty_string(self):
        # Test case: recommendation contains empty string
        invalid_recs = ["Exercise", "", "Yoga"]
        response_copy = dict(self.valid_response)
        response_copy["recommendations"] = invalid_recs
        with self.assertRaises(GraniteValidationError) as ctx:
            self.validator.validate(response_copy)
        self.assertEqual(str(ctx.exception), "Recommendation at index 1 must be a non-empty string.")

    def test_recommendations_contains_whitespace_only_string(self):
        # Test case: recommendation contains whitespace-only string
        invalid_recs = ["Exercise", "   ", "Yoga"]
        response_copy = dict(self.valid_response)
        response_copy["recommendations"] = invalid_recs
        with self.assertRaises(GraniteValidationError) as ctx:
            self.validator.validate(response_copy)
        self.assertEqual(str(ctx.exception), "Recommendation at index 1 must be a non-empty string.")

    def test_recommendations_contains_non_string_value(self):
        # Test case: recommendation contains non-string value (e.g. integer)
        invalid_recs = ["Exercise", 123, "Yoga"]
        response_copy = dict(self.valid_response)
        response_copy["recommendations"] = invalid_recs
        with self.assertRaises(GraniteValidationError) as ctx:
            self.validator.validate(response_copy)
        self.assertEqual(str(ctx.exception), "Recommendation at index 1 must be a string.")


if __name__ == "__main__":
    unittest.main()
