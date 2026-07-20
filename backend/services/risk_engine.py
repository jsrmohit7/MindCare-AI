from datetime import datetime, timezone

# Configurable clinical weights for the overall risk score normalization
# The weights must sum to exactly 1.0
RISK_WEIGHTS = {
    "phq9": 0.30,
    "gad7": 0.30,
    "stress": 0.15,
    "sleep": 0.125,
    "lifestyle": 0.125
}

# Verify weights configuration at startup
assert abs(sum(RISK_WEIGHTS.values()) - 1.0) < 1e-9, "RISK_WEIGHTS must sum to exactly 1.0"


def calculate_phq9_metrics(phq9_data: dict) -> dict:
    """
    Calculates the total score and severity for the PHQ-9 Depression screening.
    Clinical ranges:
    - 0-4: Minimal Depression
    - 5-9: Mild Depression
    - 10-14: Moderate Depression
    - 15-19: Moderately Severe Depression
    - 20-27: Severe Depression
    """
    # Extract answers from q1 through q9
    score = sum(int(phq9_data.get(f"q{i}", 0)) for i in range(1, 10))

    if score <= 4:
        severity = "Minimal Depression"
    elif score <= 9:
        severity = "Mild Depression"
    elif score <= 14:
        severity = "Moderate Depression"
    elif score <= 19:
        severity = "Moderately Severe Depression"
    else:
        severity = "Severe Depression"

    # Normalized risk: 0 is lowest risk, 100 is highest risk
    risk_normalized = (score / 27.0) * 100.0

    return {
        "score": score,
        "severity": severity,
        "risk_normalized": risk_normalized
    }


def calculate_gad7_metrics(gad7_data: dict) -> dict:
    """
    Calculates the total score and severity for the GAD-7 Anxiety screening.
    Clinical ranges:
    - 0-4: Minimal Anxiety
    - 5-9: Mild Anxiety
    - 10-14: Moderate Anxiety
    - 15-21: Severe Anxiety
    """
    # Extract answers from q1 through q7
    score = sum(int(gad7_data.get(f"q{i}", 0)) for i in range(1, 8))

    if score <= 4:
        severity = "Minimal Anxiety"
    elif score <= 9:
        severity = "Mild Anxiety"
    elif score <= 14:
        severity = "Moderate Anxiety"
    else:
        severity = "Severe Anxiety"

    # Normalized risk: 0 is lowest risk, 100 is highest risk
    risk_normalized = (score / 21.0) * 100.0

    return {
        "score": score,
        "severity": severity,
        "risk_normalized": risk_normalized
    }


def calculate_stress_metrics(stress_data: list) -> dict:
    """
    Calculates the stress questionnaire answers total and severity.
    Assumes list of questions each containing an 'answer' rated 1 to 5.
    Ranges:
    - 6-13: Low
    - 14-21: Moderate
    - 22-30: High
    """
    score = sum(int(item.get("answer", 0)) for item in stress_data)

    if score <= 13:
        severity = "Low"
    elif score <= 21:
        severity = "Moderate"
    else:
        severity = "High"

    # Normalize: score ranges from 6 to 30.
    # Risk range: 0 (score=6) to 100 (score=30)
    risk_normalized = max(0.0, min(100.0, ((score - 6) / 24.0) * 100.0))

    return {
        "score": score,
        "severity": severity,
        "risk_normalized": risk_normalized
    }


def _score_sleep_duration(duration: float) -> int:
    """Helper to score sleep duration in hours (penalty out of 40)."""
    if duration < 5.0 or duration > 10.0:
        return 40
    if duration < 6.5 or duration > 9.0:
        return 20
    return 0


def _score_sleep_quality(quality: str) -> int:
    """Helper to score subjective sleep quality (penalty out of 40)."""
    q_lower = str(quality).lower().strip()
    if q_lower == "poor":
        return 40
    if q_lower == "fair":
        return 20
    return 0


def _score_sleep_disruptions(awakenings: int, difficulty: bool) -> int:
    """Helper to score sleep disruptions (penalty out of 20)."""
    score = 0
    if awakenings >= 3:
        score += 10
    elif awakenings >= 1:
        score += 5

    if difficulty:
        score += 10
    return score


def calculate_sleep_metrics(sleep_data: dict) -> dict:
    """
    Calculates sleep risk score (0-100, where 100 is highest risk/worst sleep).
    Categorizes sleep quality as:
    - 0-30: Good
    - 31-60: Fair
    - 61-100: Poor
    """
    duration = float(sleep_data.get("duration", 7.0))
    quality = sleep_data.get("quality", "Good")
    awakenings = int(sleep_data.get("night_awakenings", 0))
    difficulty = bool(sleep_data.get("difficulty_falling_asleep", False))

    duration_penalty = _score_sleep_duration(duration)
    quality_penalty = _score_sleep_quality(quality)
    disruptions_penalty = _score_sleep_disruptions(awakenings, difficulty)

    score = duration_penalty + quality_penalty + disruptions_penalty
    score = max(0, min(100, score))

    if score <= 30:
        severity = "Good"
    elif score <= 60:
        severity = "Fair"
    else:
        severity = "Poor"

    return {
        "score": score,
        "severity": severity,
        "risk_normalized": float(score)
    }


def calculate_lifestyle_metrics(lifestyle_data: dict) -> dict:
    """
    Calculates lifestyle penalty risk score (0-100, where 100 is highest risk).
    Considers exercise, screen time, alcohol, smoking, water intake, and diet.
    Categorizes lifestyle as:
    - 0-25: Healthy
    - 26-55: Needs Improvement
    - 56-100: High Risk
    """
    score = 0

    # Smoking / Vaping: +25
    if bool(lifestyle_data.get("smoking", False)):
        score += 25

    # Alcohol: Daily (+25), Weekly (+15), others (0)
    alcohol = str(lifestyle_data.get("alcohol", "Never")).lower().strip()
    if alcohol == "daily":
        score += 25
    elif alcohol == "weekly":
        score += 15

    # Exercise: Never (+25), Rarely (+15), others (0)
    exercise = str(lifestyle_data.get("exercise", "Weekly")).lower().strip()
    if exercise == "never":
        score += 25
    elif exercise == "rarely":
        score += 15

    # Water intake: < 1.5 liters (+12.5)
    water = float(lifestyle_data.get("water_intake", 2.0))
    if water < 1.5:
        score += 12.5

    # Screen time: > 8 hours (+12.5)
    screen = float(lifestyle_data.get("screen_time", 4.0))
    if screen > 8.0:
        score += 12.5

    # Diet: Junk (+25), Balanced (+12.5), others (0)
    diet = str(lifestyle_data.get("diet", "Balanced")).lower().strip()
    if diet == "junk":
        score += 25
    elif diet == "balanced":
        score += 12.5

    score = int(max(0.0, min(100.0, score)))

    if score <= 25:
        severity = "Healthy"
    elif score <= 55:
        severity = "Needs Improvement"
    else:
        severity = "High Risk"

    return {
        "score": score,
        "severity": severity,
        "risk_normalized": float(score)
    }


def calculate_overall_risk(phq_risk: float, gad_risk: float, stress_risk: float, sleep_risk: float, lifestyle_risk: float) -> dict:
    """
    Calculates the overall risk score using configurable RISK_WEIGHTS.
    Risk levels:
    - 0-25: Low
    - 26-50: Mild
    - 51-75: Moderate
    - 76-100: High
    """
    score = (
        (phq_risk * RISK_WEIGHTS["phq9"]) +
        (gad_risk * RISK_WEIGHTS["gad7"]) +
        (stress_risk * RISK_WEIGHTS["stress"]) +
        (sleep_risk * RISK_WEIGHTS["sleep"]) +
        (lifestyle_risk * RISK_WEIGHTS["lifestyle"])
    )

    rounded_score = int(round(score))

    if rounded_score <= 25:
        level = "Low"
    elif rounded_score <= 50:
        level = "Mild"
    elif rounded_score <= 75:
        level = "Moderate"
    else:
        level = "High"

    return {
        "score": rounded_score,
        "level": level
    }


def analyze_questionnaire(questionnaire_data: dict) -> dict:
    """
    Orchestrator to calculate clinical metrics and overall risk index for a questionnaire record.
    Accepts raw dictionary data and returns structured categorical/numerical results.
    """
    # Normalize model dump if Pydantic object is passed
    if hasattr(questionnaire_data, "model_dump"):
        data = questionnaire_data.model_dump()
    elif hasattr(questionnaire_data, "dict"):
        data = questionnaire_data.dict()
    else:
        data = dict(questionnaire_data)

    phq_res = calculate_phq9_metrics(data.get("phq9", {}))
    gad_res = calculate_gad7_metrics(data.get("gad7", {}))
    stress_res = calculate_stress_metrics(data.get("stress", []))
    sleep_res = calculate_sleep_metrics(data.get("sleep", {}))
    lifestyle_res = calculate_lifestyle_metrics(data.get("lifestyle", {}))

    overall = calculate_overall_risk(
        phq_risk=phq_res["risk_normalized"],
        gad_risk=gad_res["risk_normalized"],
        stress_risk=stress_res["risk_normalized"],
        sleep_risk=sleep_res["risk_normalized"],
        lifestyle_risk=lifestyle_res["risk_normalized"]
    )

    # Output structured data only (no natural language summaries/recommendations)
    return {
        "phq9": {
            "score": phq_res["score"],
            "severity": phq_res["severity"]
        },
        "gad7": {
            "score": gad_res["score"],
            "severity": gad_res["severity"]
        },
        "stress": {
            "score": stress_res["score"],
            "severity": stress_res["severity"]
        },
        "sleep": {
            "score": sleep_res["score"],
            "severity": sleep_res["severity"]
        },
        "lifestyle": {
            "score": lifestyle_res["score"],
            "severity": lifestyle_res["severity"]
        },
        "overall_risk": overall,
        "metadata": {
            "engine": "Deterministic Weighted Risk Engine",
            "version": "1.0",
            "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        }
    }
