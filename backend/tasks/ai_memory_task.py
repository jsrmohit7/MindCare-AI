import json
import logging
from typing import Any, List, Dict
from repositories.coach_memory_repository import MemoryRepository
from services.ai_orchestrator import AIOrchestrator

logger = logging.getLogger("mindcare_ai.tasks.ai_memory")

async def update_user_memory_task(
    user_id: str,
    messages: List[Dict[str, str]],
    memory_repo: MemoryRepository,
    ai_orchestrator: AIOrchestrator
) -> None:
    """
    Background job that parses recent coach conversations, extracts cognitive insights
    (stressors, habits, preferences), and updates the user's AI memory profile in MongoDB.
    """
    try:
        # 1. Fetch current memory state
        current_memory = await memory_repo.get_memory(user_id)

        # 2. Extract recent transcript snippet (last 6 messages)
        recent_transcript = []
        for m in messages[-6:]:
            recent_transcript.append(f"{m['role'].upper()}: {m['content']}")
        transcript_str = "\n".join(recent_transcript)

        # 3. Prompt Granite to extract cognitive updates
        system_prompt = """You are an AI cognitive profile parser.
Your task is to analyze a conversation transcript and output updates to the user's wellness profile.
You must return a raw JSON object matching the requested schema.
Maintain existing values unless the conversation explicitly contradicts or updates them.
Keep list elements concise (max 3 words per item).
Do not create duplicate items in lists.
"""

        prompt = f"""Analyze the conversation below and update the user's AI memory profile.

Previous Memory State:
{json.dumps(current_memory, default=str)}

Recent Conversation Transcript:
{transcript_str}

OUTPUT REQUIREMENT:
Return a clean, updated JSON object containing the following keys:
- "known_stressors": list of strings (things that cause user stress/anxiety)
- "helpful_habits": list of strings (activities or habits that help them relax)
- "goals": list of strings (current wellness focus/objectives)
- "communication_style": string (brief description of user's speaking style, e.g. "prefers concise", "expressive", "validation-seeking")
- "encouragement_style": string (brief description of how they prefer support, e.g. "gentle validation", "solution-focused")
- "recurring_topics": list of strings (themes recurring in the chat)
- "milestones": list of strings (achievements or successes they celebrate)
- "behavior_patterns": list of strings (behavioral observations, e.g. "checks in every morning")
"""

        schema = {
            "type": "object",
            "properties": {
                "known_stressors": {"type": "array", "items": {"type": "string"}},
                "helpful_habits": {"type": "array", "items": {"type": "string"}},
                "goals": {"type": "array", "items": {"type": "string"}},
                "communication_style": {"type": "string"},
                "encouragement_style": {"type": "string"},
                "recurring_topics": {"type": "array", "items": {"type": "string"}},
                "milestones": {"type": "array", "items": {"type": "string"}},
                "behavior_patterns": {"type": "array", "items": {"type": "string"}}
            },
            "required": [
                "known_stressors", "helpful_habits", "goals",
                "communication_style", "encouragement_style",
                "recurring_topics", "milestones", "behavior_patterns"
            ]
        }

        # Query LLM
        res = ai_orchestrator.generate_json(system_prompt=system_prompt, prompt=prompt, schema=schema)
        updated_data = res["data"]

        # 4. Save/Update in MongoDB
        # Merge updated data with existing, keeping user_id
        for k in schema["properties"].keys():
            if k in updated_data:
                current_memory[k] = updated_data[k]

        await memory_repo.save_or_update_memory(user_id, current_memory)
        logger.info("Successfully updated AI memory for user: %s", user_id)

    except Exception as e:
        logger.error("Failed to update AI memory for user %s: %s", user_id, e)
