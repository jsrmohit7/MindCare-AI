import os

# Define the absolute path to the prompt template file relative to this service module
TEMPLATE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "templates",
    "granite_analysis_prompt.txt"
)


def build_system_prompt() -> str:
    """
    Constructs the static SYSTEM ROLE section of the prompt.
    Defines role scope, diagnostic boundaries, and standard safety limitations.
    """
    return (
        "================================================================================\n"
        "SYSTEM ROLE\n"
        "================================================================================\n"
        "You are an AI mental health screening assistant.\n"
        "You analyze standardized screening results.\n"
        "You DO NOT diagnose mental illness.\n"
        "You DO NOT invent symptoms.\n"
        "You ONLY interpret the provided screening scores.\n"
        "You MUST clearly state that this is a screening assessment and not a clinical diagnosis.\n"
        "\n"
        "SAFETY PROHIBITIONS:\n"
        "- Do not diagnose mental disorders.\n"
        "- Do not recommend medications.\n"
        "- Do not provide emergency medical instructions.\n"
        "- Use supportive, non-judgmental language.\n"
        "- Base every statement only on the supplied screening data."
    )


def build_input_section(risk_output: dict) -> str:
    """
    Dynamically maps the structured Risk Engine output into a standardized INPUT DATA block.
    Extracts scores and severity labels exactly as received.
    """
    phq = risk_output.get("phq9", {})
    gad = risk_output.get("gad7", {})
    stress = risk_output.get("stress", {})
    sleep = risk_output.get("sleep", {})
    lifestyle = risk_output.get("lifestyle", {})
    overall = risk_output.get("overall_risk", {})

    return (
        "================================================================================\n"
        "INPUT DATA\n"
        "================================================================================\n"
        f"PHQ-9 (Depression):\n"
        f"- Score: {phq.get('score', 'N/A')}\n"
        f"- Severity: {phq.get('severity', 'N/A')}\n"
        f"\n"
        f"GAD-7 (Anxiety):\n"
        f"- Score: {gad.get('score', 'N/A')}\n"
        f"- Severity: {gad.get('severity', 'N/A')}\n"
        f"\n"
        f"Stress Answers:\n"
        f"- Score: {stress.get('score', 'N/A')}\n"
        f"- Severity: {stress.get('severity', 'N/A')}\n"
        f"\n"
        f"Sleep:\n"
        f"- Score: {sleep.get('score', 'N/A')}\n"
        f"- Severity: {sleep.get('severity', 'N/A')}\n"
        f"\n"
        f"Lifestyle:\n"
        f"- Score: {lifestyle.get('score', 'N/A')}\n"
        f"- Severity: {lifestyle.get('severity', 'N/A')}\n"
        f"\n"
        f"Overall Risk Profile:\n"
        f"- Score: {overall.get('score', 'N/A')}\n"
        f"- Level: {overall.get('level', 'N/A')}"
    )


def build_task_section() -> str:
    """
    Constructs the static TASKS section of the prompt.
    Outlines score interpretation instructions, risk assessment, and wellness strategies.
    """
    return (
        "================================================================================\n"
        "TASKS\n"
        "================================================================================\n"
        "Interpret the screening scores.\n"
        "Explain what the scores generally indicate.\n"
        "Assess overall screening risk.\n"
        "Provide supportive wellness recommendations.\n"
        "Suggest when professional consultation may be appropriate.\n"
        "Avoid alarming language.\n"
        "Avoid definitive diagnoses.\n"
        "\n"
        "CRITICAL RULES:\n"
        "- Never recalculate scores.\n"
        "- Never change supplied severity labels.\n"
        "- Never infer missing symptoms.\n"
        "- Only interpret the deterministic inputs.\n"
        "- If the screening suggests elevated risk (e.g., Overall Risk Level is Moderate or High, "
        "or PHQ-9/GAD-7 severity is Moderate or Severe), you MUST explicitly recommend consultation "
        "with a licensed mental health professional."
    )


def build_output_schema() -> str:
    """
    Constructs the static JSON output formatting and validation boundaries.
    Tells the model to output strict raw JSON without markdown fences.
    """
    return (
        "================================================================================\n"
        "OUTPUT REQUIREMENTS\n"
        "================================================================================\n"
        "IBM Granite MUST return STRICT JSON ONLY.\n"
        "No markdown (DO NOT wrap in markdown fences like ```json).\n"
        "No explanations outside JSON.\n"
        "No bullet lists outside JSON keys.\n"
        "If information is unavailable, return empty strings or empty arrays while preserving the schema.\n"
        "\n"
        "Use this schema exactly:\n"
        "{\n"
        '    "summary": "interpret the screening scores and explain what they generally indicate",\n'
        '    "risk_assessment": "assess overall screening risk",\n'
        '    "recommendations": [\n'
        '        "supportive wellness recommendation 1",\n'
        '        "supportive wellness recommendation 2",\n'
        '        "supportive wellness recommendation 3"\n'
        "    ],\n"
        '    "follow_up": "suggest when professional consultation may be appropriate",\n'
        '    "disclaimer": "This assessment is based on standardized screening questionnaires and is not a medical diagnosis."\n'
        "}\n"
        "\n"
        "The disclaimer must always match: \"This assessment is based on standardized screening questionnaires and is not a medical diagnosis.\""
    )


def build_prompt(risk_output: dict) -> str:
    """
    Stitches the prompt sections together by loading templates/granite_analysis_prompt.txt
    from the file system and replacing section placeholders.
    """
    if not os.path.exists(TEMPLATE_PATH):
        raise FileNotFoundError(f"Prompt template file not found at: {TEMPLATE_PATH}")

    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        template_content = f.read()

    system_prompt = build_system_prompt()
    input_section = build_input_section(risk_output)
    task_section = build_task_section()
    output_schema = build_output_schema()

    return template_content.format(
        system_prompt=system_prompt,
        input_section=input_section,
        task_section=task_section,
        output_schema=output_schema
    )
