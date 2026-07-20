"""
DEVELOPMENT-ONLY UTILITY: manual_granite_test.py
This script is intended solely for local development and verification of the
live IBM watsonx.ai Granite Model integration.
It should not be imported or executed in any production workflow.
"""

import os
import json
import logging
from dotenv import load_dotenv

# Configure basic logging to check structured logs without exposing sensitive information
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

# Load environment variables from .env
load_dotenv()

from services.prompt_builder import build_prompt
from services.granite_service import GraniteService, GraniteServiceError

def run_manual_test() -> None:
    print("=== MindCare AI: Manual Granite Integration Test ===")
    
    # Check if required environment variables are set
    required_vars = ["IBM_API_KEY", "IBM_PROJECT_ID", "IBM_URL", "IBM_GRANITE_MODEL"]
    missing = [var for var in required_vars if not os.environ.get(var)]
    if missing:
        print(f"\n[WARNING] Missing environment variables in your environment/.env: {', '.join(missing)}")
        print("Please configure them in your backend/.env file to run a live test.")
        print("Proceeding to construction attempt anyway...")

    # Construct same sample Risk Engine output used during Prompt Builder validation
    mock_risk_output = {
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
    
    print("\n[Step 1] Constructing mock Risk Engine output...")
    print(json.dumps(mock_risk_output, indent=2))

    # Generate the AI prompt
    print("\n[Step 2] Building prompt from Prompt Builder...")
    try:
        prompt = build_prompt(mock_risk_output)
        print("Prompt built successfully. Character count:", len(prompt))
    except Exception as e:
        print(f"ERROR: Failed to build prompt: {e}")
        return

    # Instantiate GraniteService
    print("\n[Step 3] Instantiating GraniteService (building credentials and client)...")
    try:
        service = GraniteService()
        print("GraniteService initialized successfully.")
    except Exception as e:
        print(f"ERROR: Failed to construct GraniteService: {e}")
        return

    # Call generate_analysis
    print("\n[Step 4] Calling generate_analysis with live IBM Granite Model...")
    try:
        result = service.generate_analysis(prompt)
        print("\n[SUCCESS] Response dictionary returned:")
        print(json.dumps(result, indent=2))
    except GraniteServiceError as e:
        print(f"\n[EXPECTED FAILURE] GraniteService raised error: {type(e).__name__}: {e}")
    except Exception as e:
        print(f"\n[UNEXPECTED FAILURE] Inference failed with: {type(e).__name__}: {e}")

if __name__ == "__main__":
    run_manual_test()
