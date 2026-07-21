from typing import Any, Dict, List, Optional
from datetime import datetime
from repositories.journal_repository import JournalRepository
from repositories.coach_memory_repository import MemoryRepository
from repositories.activity_repository import ActivityRepository
from services.ai_orchestrator import AIOrchestrator

class JournalService:
    """
    Service responsible for coordinating daily journal entries, running AI analyses
    using AIOrchestrator, logging activity events, and updating cognitive AI memories.
    """

    def __init__(
        self,
        journal_repo: JournalRepository,
        memory_repo: MemoryRepository,
        activity_repo: ActivityRepository,
        ai_orchestrator: AIOrchestrator
    ) -> None:
        self.journal_repo = journal_repo
        self.memory_repo = memory_repo
        self.activity_repo = activity_repo
        self.ai_orchestrator = ai_orchestrator

    async def analyze_journal_content(self, content: str) -> Dict[str, Any]:
        """Runs prompt to analyze journal sentiments, topics, and emotions via AIOrchestrator."""
        system_prompt = """You are an expert AI wellness counselor.
Your task is to analyze the user's personal journal entry and extract emotional patterns, topics, and wellness notes.
You must return a raw JSON object matching the requested schema.
"""

        prompt = f"""Analyze the journal entry below.

Journal Entry:
"{content}"

OUTPUT REQUIREMENT:
Return a clean JSON object containing these keys:
- "sentiment": string (one of: Positive | Negative | Neutral)
- "emotions": list of strings (e.g., ["Calm", "Joy"])
- "topics": list of strings (e.g., ["work", "exercise"])
- "stress_indicators": list of strings (any stressors mentioned, e.g., ["deadline"])
- "positive_habits": list of strings (any positive actions, e.g., ["reading"])
- "summary": string (a concise 1-2 sentence supportive reflection)
"""

        schema = {
            "type": "object",
            "properties": {
                "sentiment": {"type": "string"},
                "emotions": {"type": "array", "items": {"type": "string"}},
                "topics": {"type": "array", "items": {"type": "string"}},
                "stress_indicators": {"type": "array", "items": {"type": "string"}},
                "positive_habits": {"type": "array", "items": {"type": "string"}},
                "summary": {"type": "string"}
            },
            "required": ["sentiment", "emotions", "topics", "stress_indicators", "positive_habits", "summary"]
        }

        try:
            res = self.ai_orchestrator.generate_json(system_prompt=system_prompt, prompt=prompt, schema=schema)
            return res["data"]
        except Exception:
            # Fallback in case LLM analysis fails
            return {
                "sentiment": "Neutral",
                "emotions": ["Neutral"],
                "topics": [],
                "stress_indicators": [],
                "positive_habits": [],
                "summary": "Journal entry saved. Continue writing to compile more habits."
            }

    async def create_journal_entry(self, user_id: str, date_str: str, content: str, tags: List[str]) -> str:
        """Creates a journal entry, analyzes it, updates memory, and logs timeline event."""
        # 1. Run AI analysis
        ai_analysis = await self.analyze_journal_content(content)

        # 2. Insert into repository
        journal_data = {
            "content": content,
            "tags": tags,
            "ai_analysis": ai_analysis
        }
        journal_id = await self.journal_repo.create_journal(user_id, date_str, journal_data)

        # 3. Log Activity Event
        await self.activity_repo.log_event(
            user_id=user_id,
            source_collection="mood_journal",
            event_type="journal",
            title="Written Journal Entry",
            description=f"Wrote a daily wellness journal entry.",
            metadata={"journal_id": journal_id, "sentiment": ai_analysis.get("sentiment")}
        )

        # 4. Update user cognitive AI memory
        try:
            memory = await self.memory_repo.get_memory(user_id)
            
            # Append new stressors and habits if not already present
            for stressor in ai_analysis.get("stress_indicators", []):
                if stressor and stressor not in memory["known_stressors"]:
                    memory["known_stressors"].append(stressor)
            for habit in ai_analysis.get("positive_habits", []):
                if habit and habit not in memory["helpful_habits"]:
                    memory["helpful_habits"].append(habit)
            for topic in ai_analysis.get("topics", []):
                if topic and topic not in memory["recurring_topics"]:
                    memory["recurring_topics"].append(topic)
                    
            await self.memory_repo.save_or_update_memory(user_id, memory)
        except Exception:
            pass # Keep robust

        return journal_id

    async def update_journal_entry(self, user_id: str, journal_id: str, content: str, tags: List[str]) -> bool:
        """Updates a journal entry, runs analysis, updates memory, and logs updated timeline event."""
        # 1. Re-analyze content
        ai_analysis = await self.analyze_journal_content(content)

        # 2. Update DB
        journal_data = {
            "content": content,
            "tags": tags,
            "ai_analysis": ai_analysis
        }
        success = await self.journal_repo.update_journal(user_id, journal_id, journal_data)
        if not success:
            return False

        # 3. Log Activity Event
        await self.activity_repo.log_event(
            user_id=user_id,
            source_collection="mood_journal",
            event_type="journal",
            title="Updated Journal Entry",
            description=f"Edited today's daily journal entry.",
            metadata={"journal_id": journal_id, "sentiment": ai_analysis.get("sentiment")}
        )

        # 4. Update user cognitive AI memory
        try:
            memory = await self.memory_repo.get_memory(user_id)
            for stressor in ai_analysis.get("stress_indicators", []):
                if stressor and stressor not in memory["known_stressors"]:
                    memory["known_stressors"].append(stressor)
            for habit in ai_analysis.get("positive_habits", []):
                if habit and habit not in memory["helpful_habits"]:
                    memory["helpful_habits"].append(habit)
            await self.memory_repo.save_or_update_memory(user_id, memory)
        except Exception:
            pass

        return True
