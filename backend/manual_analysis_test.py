"""
DEVELOPMENT-ONLY UTILITY: manual_analysis_test.py
This script is intended solely for local development and verification of the
complete end-to-end AI pipeline (Prompt Builder -> GraniteService -> ResponseValidator -> AnalysisEngine).
It is not importable by production and must not be included in unit test discovery.
"""

import os
import sys
import json
import logging
from dotenv import load_dotenv

# Configure basic logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

# Load environment variables
load_dotenv()

from services.prompt_builder import build_prompt
from services.granite_service import GraniteService
from services.response_validator import ResponseValidator
from services.analysis_engine import AnalysisEngine


def run_manual_integration_test() -> None:
    print("=== MindCare AI: Manual E2E Analysis Engine Integration Test ===")

    # 1. Instantiate the real Prompt Builder (the function build_prompt)
    prompt_builder = build_prompt

    # 2. Instantiate the real GraniteService
    try:
        granite_service = GraniteService()
        print("OK: GraniteService instantiated")
    except Exception as e:
        print(f"FAIL: Failed to instantiate GraniteService: {e}")
        sys.exit(1)

    # 3. Instantiate the real ResponseValidator
    response_validator = ResponseValidator()
    print("OK: ResponseValidator instantiated")

    # 4. Instantiate AnalysisEngine with dependencies
    analysis_engine = AnalysisEngine(
        prompt_builder=prompt_builder,
        granite_service=granite_service,
        response_validator=response_validator
    )
    print("OK: AnalysisEngine instantiated with dependencies")

    # 5. Create a representative sample risk profile matching both user example and Prompt Builder schema
    risk_profile = {
        "risk_level": "Moderate",
        "score": 18,
        "risk_factors": [
            "persistent anxiety",
            "sleep disturbance",
            "difficulty concentrating"
        ],
        "phq9": {
            "score": 14,
            "severity": "Moderate Depression"
        },
        "gad7": {
            "score": 11,
            "severity": "Moderate Anxiety"
        },
        "stress": {
            "score": 18,
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
    print("OK: Sample risk profile constructed")

    # 6. Call generate_assessment
    print("\nExecuting generate_assessment...")
    try:
        # Step outputs are logged by the service internally, but we can verify success of the pipeline here.
        assessment = analysis_engine.generate_assessment(risk_profile)
        print("OK: Prompt built successfully")
        print("OK: Granite response received")
        print("OK: Response validated")
        print("OK: AnalysisEngine completed")
        print("OK: Final assessment generated")
    except Exception as e:
        print(f"FAIL: Orchestration failed with error: {type(e).__name__}: {e}")
        sys.exit(1)

    # 7. Pretty-print the returned assessment
    print("\n=== Final Assessment JSON ===")
    print(json.dumps(assessment, indent=2))
    print("=============================\n")

    # 8. Verify and print specific output values
    try:
        risk_prof = assessment["risk_profile"]
        ai_analysis = assessment["ai_analysis"]
        metadata = assessment["metadata"]

        summary = ai_analysis["summary"]
        recs_count = len(ai_analysis["recommendations"])
        model = metadata["model"]
        generated_at = metadata["generated_at"]

        print("=== Verification Metrics ===")
        print(f"AI Summary: {summary}")
        print(f"AI Recommendations Count: {recs_count}")
        print(f"metadata.model: {model}")
        print(f"metadata.generated_at: {generated_at}")
        print("============================\n")

        # 9. Perform final verification checks to exit with success (exit code 0)
        assert risk_prof is risk_profile, "risk_profile object was copied/modified!"
        assert "ai_analysis" in assessment, "ai_analysis missing from assessment!"
        assert "metadata" in assessment, "metadata missing from assessment!"
        
        # Verify it passed validation (ResponseValidator validate doesn't raise exception)
        response_validator.validate(ai_analysis)
        
        print("OK: E2E Pipeline Validation Succeeded!")
        sys.exit(0)

    except KeyError as e:
        print(f"FAIL: Verification failed: missing key {e}")
        sys.exit(1)
    except AssertionError as e:
        print(f"FAIL: Assertion failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"FAIL: Verification failed with unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    run_manual_integration_test()
