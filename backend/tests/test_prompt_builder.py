import unittest
from services.prompt_builder import (
    build_system_prompt,
    build_input_section,
    build_task_section,
    build_output_schema,
    build_prompt
)

class TestPromptBuilder(unittest.TestCase):
    def setUp(self):
        self.mock_risk_output = {
            "phq9": {
                "score": 14,
                "severity": "Moderate Depression"
            },
            "gad7": {
                "score": 11,
                "severity": "Moderate Anxiety"
            },
            "stress": {
                "score": 20,
                "severity": "Moderate"
            },
            "sleep": {
                "score": 45,
                "severity": "Fair"
            },
            "lifestyle": {
                "score": 50,
                "severity": "Needs Improvement"
            },
            "overall_risk": {
                "score": 55,
                "level": "Moderate"
            }
        }

    def test_build_system_prompt(self):
        sys_prompt = build_system_prompt()
        self.assertIn("SYSTEM ROLE", sys_prompt)
        self.assertIn("AI mental health screening assistant", sys_prompt)
        self.assertIn("DO NOT diagnose mental illness", sys_prompt)
        # Safety rules assertions
        self.assertIn("Do not diagnose mental disorders", sys_prompt)
        self.assertIn("Do not recommend medications", sys_prompt)
        self.assertIn("Do not provide emergency medical instructions", sys_prompt)

    def test_build_input_section(self):
        input_section = build_input_section(self.mock_risk_output)
        self.assertIn("INPUT DATA", input_section)
        self.assertIn("Score: 14", input_section)
        self.assertIn("Severity: Moderate Depression", input_section)
        self.assertIn("Score: 11", input_section)
        self.assertIn("Severity: Moderate Anxiety", input_section)
        self.assertIn("Level: Moderate", input_section)

    def test_build_task_section(self):
        task_section = build_task_section()
        self.assertIn("TASKS", task_section)
        self.assertIn("supportive wellness recommendations", task_section)
        # Critical Rules assertions
        self.assertIn("Never recalculate scores", task_section)
        self.assertIn("Never change supplied severity labels", task_section)
        self.assertIn("Never infer missing symptoms", task_section)
        self.assertIn("Only interpret the deterministic inputs", task_section)
        # Safety rules recommendation check
        self.assertIn("recommend consultation with a licensed mental health professional", task_section)

    def test_build_output_schema(self):
        schema_section = build_output_schema()
        self.assertIn("OUTPUT REQUIREMENTS", schema_section)
        self.assertIn("STRICT JSON ONLY", schema_section)
        self.assertIn("No markdown", schema_section)
        self.assertIn("disclaimer", schema_section)
        self.assertIn("This assessment is based on standardized screening questionnaires and is not a medical diagnosis.", schema_section)

    def test_build_prompt(self):
        prompt = build_prompt(self.mock_risk_output)
        # Check metadata headers
        self.assertIn("Prompt Version: 1.0", prompt)
        self.assertIn("Source: MindCare AI Prompt Builder", prompt)
        self.assertIn("Target Model: IBM Granite", prompt)
        self.assertIn("Assessment Type: Clinical Screening Summary", prompt)

        # Check sections presence
        self.assertIn("SYSTEM ROLE", prompt)
        self.assertIn("INPUT DATA", prompt)
        self.assertIn("TASKS", prompt)
        self.assertIn("OUTPUT REQUIREMENTS", prompt)

        # Confirm data insertion
        self.assertIn("Score: 14", prompt)
        self.assertIn("Severity: Moderate Depression", prompt)
        self.assertIn("Level: Moderate", prompt)

        # Confirm safety rules presence
        self.assertIn("Do not diagnose mental disorders", prompt)
        self.assertIn("Do not recommend medications", prompt)
        self.assertIn("Do not provide emergency medical instructions", prompt)
        self.assertIn("recommend consultation with a licensed mental health professional", prompt)

if __name__ == '__main__':
    unittest.main()
