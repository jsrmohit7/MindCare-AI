from services.prompt_builder import build_prompt

sample_risk = {
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
        "score": 85,
        "level": "High"
    }
}

prompt = build_prompt(sample_risk)

print(prompt)