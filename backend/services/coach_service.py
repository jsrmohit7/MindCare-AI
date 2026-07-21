from typing import Any, Dict, List, Optional
from datetime import datetime, date
from repositories.coach_repository import CoachRepository
from repositories.assessment_repository import AssessmentRepository
from repositories.daily_wellness_repository import DailyWellnessRepository
from repositories.coach_memory_repository import MemoryRepository
from repositories.activity_repository import ActivityRepository
from services.daily_wellness_service import DailyWellnessService
from services.ai_orchestrator import AIOrchestrator
from services.reasoning_engine import ReasoningEngine
from tasks.ai_memory_task import update_user_memory_task

class CoachService:
    """
    Service coordinating AI Coach logic, including prompt context compiling,
    AI memory retrieval, activity logging, and cognitive profile updating.
    """

    def __init__(
        self,
        coach_repo: CoachRepository,
        assessment_repo: AssessmentRepository,
        wellness_repo: DailyWellnessRepository,
        wellness_service: DailyWellnessService,
        granite_service: AIOrchestrator,
        memory_repo: MemoryRepository,
        activity_repo: ActivityRepository,
        reasoning_engine: ReasoningEngine
    ) -> None:
        self.coach_repo = coach_repo
        self.assessment_repo = assessment_repo
        self.wellness_repo = wellness_repo
        self.wellness_service = wellness_service
        self.granite_service = granite_service
        self.memory_repo = memory_repo
        self.activity_repo = activity_repo
        self.reasoning_engine = reasoning_engine

    async def get_user_wellness_context(self, user_id: str) -> str:
        """Compiles historical assessments, daily wellness records, and progress trends into a textual context."""
        # 1. Fetch assessments
        assessments = await self.assessment_repo.list_assessments(user_id, limit=5)
        latest_assessment_str = "No assessments completed yet."
        assessment_history_str = ""
        if assessments:
            latest = assessments[0]
            latest_risk = latest.get("risk_profile", {}).get("overall_risk", {})
            latest_assessment_str = (
                f"Date: {latest.get('metadata', {}).get('generated_at', '').split('T')[0]}, "
                f"Score: {latest_risk.get('score', 'N/A')}/100, "
                f"Severity/Level: {latest_risk.get('level', 'N/A')}"
            )
            history_entries = []
            for a in assessments[1:]:
                a_risk = a.get("risk_profile", {}).get("overall_risk", {})
                history_entries.append(
                    f"- Date: {a.get('metadata', {}).get('generated_at', '').split('T')[0]}, "
                    f"Score: {a_risk.get('score', 'N/A')}/100, "
                    f"Severity/Level: {a_risk.get('level', 'N/A')}"
                )
            assessment_history_str = "\n".join(history_entries) if history_entries else "No prior assessments."

        # 2. Fetch daily wellness checkins
        checkins = await self.wellness_repo.list_checkins(user_id, limit=30)
        recent_checkins_entries = []
        recent_ai_insights = []
        recent_notes = []
        
        # Calculate streaks
        current_streak, longest_streak, total_checkins = self.wellness_service.calculate_streaks(checkins, date.today())
        
        # Calculate trends (average stress, anxiety, exercise minutes, etc.)
        moods = [c.get("mood") for c in checkins if c.get("mood")]
        stresses = [c.get("stress") for c in checkins if c.get("stress") is not None]
        anxieties = [c.get("anxiety") for c in checkins if c.get("anxiety") is not None]
        exercise_count = sum(1 for c in checkins if c.get("exercise"))
        
        avg_stress = sum(stresses) / len(stresses) if stresses else "N/A"
        avg_anxiety = sum(anxieties) / len(anxieties) if anxieties else "N/A"
        most_common_mood = max(set(moods), key=moods.count) if moods else "N/A"
        
        for c in checkins[:7]: # Last 7 checkins
            recent_checkins_entries.append(
                f"- Date: {c.get('date')}, Mood: {c.get('mood')}, "
                f"Stress: {c.get('stress')}/10, Anxiety: {c.get('anxiety')}/10, "
                f"Sleep: {c.get('sleep')}, Water: {c.get('water')}, "
                f"Exercise: {'Yes' if c.get('exercise') else 'No'}, "
                f"Meditation: {'Yes' if c.get('meditation') else 'No'}"
            )
            if c.get("ai_summary"):
                recent_ai_insights.append(f"- Date: {c.get('date')}: {c.get('ai_summary')}")
            if c.get("notes"):
                recent_notes.append(f"- Date: {c.get('date')}: \"{c.get('notes')}\"")

        checkins_str = "\n".join(recent_checkins_entries) if recent_checkins_entries else "No daily check-ins completed yet."
        ai_insights_str = "\n".join(recent_ai_insights[:3]) if recent_ai_insights else "No recent AI insights."
        notes_str = "\n".join(recent_notes[:3]) if recent_notes else "No recent wellness notes."

        # Achievements summary
        achievements = []
        if len(assessments) >= 1:
            achievements.append("- First Assessment Unlocked")
        if total_checkins >= 1:
            achievements.append("- First Check-In Unlocked")
        if longest_streak >= 7:
            achievements.append("- 7-Day Streak Milestone Unlocked")
        if longest_streak >= 30:
            achievements.append("- 30-Day Streak Milestone Unlocked")

        achievements_str = "\n".join(achievements) if achievements else "No achievements unlocked yet."

        # Fetch AI Memory State
        memory = await self.memory_repo.get_memory(user_id)
        stressors = ", ".join(memory.get("known_stressors", [])) or "None identified"
        habits = ", ".join(memory.get("helpful_habits", [])) or "None identified"
        goals = ", ".join(memory.get("goals", [])) or "None identified"
        encouragement = memory.get("encouragement_style", "gentle validation")
        comm_style = memory.get("communication_style", "supportive and conversational")

        # Get explainable AI reasoning
        reasoning_data = self.reasoning_engine.generate_reasoning(
            assessments=assessments,
            checkins=checkins,
            streak_data={
                "current_streak": current_streak,
                "longest_streak": longest_streak,
                "total_checkins": total_checkins
            }
        )
        contributing_str = ", ".join([f"{f['factor']} (importance: {f['importance']})" for f in reasoning_data.get("contributing_factors", [])])
        actions_str = "\n".join([f"- {a['title']}: {a['description']} (Impact: {a['expected_impact']}, Effort: {a['estimated_effort']})" for a in reasoning_data.get("action_plan", [])])

        context = f"""[USER PROFILE & CLINICAL DATA]
Latest Assessment: {latest_assessment_str}
Assessment History:
{assessment_history_str}

[DAILY WELLNESS DATA]
Current Streak: {current_streak} Days
Longest Streak: {longest_streak} Days
Total Check-ins: {total_checkins}
Achievements:
{achievements_str}

Recent Check-ins (Last 7 days):
{checkins_str}

Historical Trends (Last 30 checkins):
- Most Common Mood: {most_common_mood}
- Average Stress Level: {f"{avg_stress:.1f}/10" if isinstance(avg_stress, float) else avg_stress}
- Average Anxiety Level: {f"{avg_anxiety:.1f}/10" if isinstance(avg_anxiety, float) else avg_anxiety}
- Exercise Frequency: {exercise_count} times in last 30 logs

Recent AI Daily Insights:
{ai_insights_str}

Recent Wellness Notes/Journal Entries:
{notes_str}

[AI COGNITIVE MEMORY]
- Known Stressors: {stressors}
- Helpful Habits: {habits}
- Important Goals: {goals}
- Communication Preference: {comm_style}
- Encouragement Style: {encouragement}

[COGNITIVE REASONING & RECOMMENDATIONS]
Latest Prediction: {reasoning_data.get('prediction')} (Confidence: {reasoning_data.get('confidence')}%)
Reasoning: {reasoning_data.get('reasoning')}
Contributing Factors: {contributing_str}
Limitations: {reasoning_data.get('limitations')}

Recommended Action Plan:
{actions_str}
"""
        return context

    def build_system_prompt(self, user_name: str, context: str) -> str:
        return f"""You are MindCare AI Coach, a supportive and empathetic AI wellness assistant.
You are chatting with {user_name}.
Your goal is to help the user reflect on their wellness journey, understand their progress, and support healthy habits.

CRITICAL INSTRUCTIONS:
1. Base your guidance and advice on the user's historical wellness data, AI memory, and predictions/reasoning provided in the CONTEXT. Be highly context-aware: acknowledge their streaks, recent check-ins, stressors, goals, and current stress trend predictions/root causes.
2. DO NOT make medical diagnoses or claim clinical certainty. You are a wellness coach, not a therapist or physician.
3. Encourage professional help when appropriate (e.g. if the user exhibits severe risk scores or asks for clinical advice).
4. If the conversation suggests serious distress, self-harm, or emergency, you must immediately encourage the user to contact trusted friends, family, or professional emergency services (e.g., suicide helplines), and clearly remind them that you are an AI companion, not a replacement for professional care.
5. Be warm, non-judgmental, and structured. Use friendly formatting (bullet points, bold highlights, paragraph breaks). Do not include any code blocks. Keep responses relatively concise and focused on positive steps.

CONTEXT DATA FOR {user_name}:
{context}
"""

    async def generate_response(
        self,
        user_id: str,
        user_name: str,
        conversation_id: str,
        user_message: str,
        background_tasks: Optional[Any] = None
    ) -> str:
        # 1. Fetch conversation
        conv = await self.coach_repo.get_conversation(user_id, conversation_id)
        if not conv:
            raise ValueError("Conversation not found")

        # 2. Append new user message to history
        messages = conv.get("messages", [])
        messages.append({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.utcnow().isoformat()
        })

        # 3. Get context-aware system prompt
        context = await self.get_user_wellness_context(user_id)
        system_prompt = self.build_system_prompt(user_name, context)

        # 4. Generate response from Granite (via AIOrchestrator)
        try:
            recent_history = messages[-10:]
            ai_text = self.granite_service.generate_chat_response(system_prompt, recent_history)
        except Exception as e:
            ai_text = "I'm here to support you. It looks like I had a temporary connection issue. How can I help you reflect on your wellness today?"

        # 5. Append assistant message to history
        messages.append({
            "role": "assistant",
            "content": ai_text,
            "timestamp": datetime.utcnow().isoformat()
        })

        # 6. Save updated messages to MongoDB
        await self.coach_repo.update_messages(user_id, conversation_id, messages)

        # 7. Log Activity Event
        await self.activity_repo.log_event(
            user_id=user_id,
            source_collection="coach_conversations",
            event_type="coach_chat",
            title="Chatted with AI Coach",
            description=f"Sent a message to AI Coach in chat: '{conv.get('title')}'",
            metadata={"conversation_id": conversation_id}
        )

        # 8. Trigger AI memory update background task
        if background_tasks:
            background_tasks.add_task(
                update_user_memory_task,
                user_id=user_id,
                messages=messages,
                memory_repo=self.memory_repo,
                ai_orchestrator=self.granite_service
            )
        else:
            import asyncio
            asyncio.create_task(
                update_user_memory_task(
                    user_id=user_id,
                    messages=messages,
                    memory_repo=self.memory_repo,
                    ai_orchestrator=self.granite_service
                )
            )

        return ai_text
