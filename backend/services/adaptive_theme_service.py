from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional
from services.ai_orchestrator import AIOrchestrator

logger = logging.getLogger("mindcare_ai.adaptive_theme_service")

EMOTION_TO_THEME = {
    "Happy": "happy",
    "Calm": "calm",
    "Focused": "focused",
    "Stressed": "stressed",
    "Anxious": "anxious",
    "Low Mood": "low_mood"
}

class AdaptiveThemeService:
    """
    Service responsible for calculating user's emotional state, mapping it to a theme,
    persisting preferences, and compiling adaptive UI recommendations.
    """

    def __init__(
        self,
        db: Any,
        ai_orchestrator: AIOrchestrator,
        assessment_repository: Any,
        daily_wellness_repository: Any
    ) -> None:
        self.db = db
        self.collection = db["user_adaptive_theme"]
        self.ai_orchestrator = ai_orchestrator
        self.assessment_repo = assessment_repository
        self.wellness_repo = daily_wellness_repository

    async def get_user_theme_state(self, user_id: str) -> Dict[str, Any]:
        """
        Retrieves the user's theme state. If it does not exist, computes it automatically.
        """
        doc = await self.collection.find_one({"user_id": user_id})
        if not doc:
            # First time user or missing theme state, calculate initial
            return await self.calculate_and_save_user_emotion(user_id)
        
        # Format the document for JSON compatibility
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        
        return doc

    async def save_theme_override(self, user_id: str, theme: Optional[str]) -> Dict[str, Any]:
        """
        Allows manually overriding the user's active theme.
        If theme is None/null, resets override to auto-adaptive.
        """
        query = {"user_id": user_id}
        update_data = {
            "override_theme": theme,
            "last_updated": datetime.now(timezone.utc)
        }
        
        await self.collection.update_one(query, {"$set": update_data}, upsert=True)
        return await self.get_user_theme_state(user_id)

    async def calculate_and_save_user_emotion(self, user_id: str) -> Dict[str, Any]:
        """
        Calculates emotional state using latest check-in and assessments.
        Saves and returns the computed state.
        """
        # 1. Fetch latest assessment
        assessments = await self.assessment_repo.list_assessments(user_id, limit=1)
        latest_assessment = assessments[0] if assessments else None

        # 2. Fetch latest check-in
        checkins = await self.wellness_repo.list_checkins(user_id, limit=5)
        latest_checkin = checkins[0] if checkins else None

        # 3. Pull metrics
        phq_score = 0
        phq_severity = "Minimal"
        gad_score = 0
        gad_severity = "Minimal"

        if latest_assessment:
            risk = latest_assessment.get("risk_profile", {})
            phq_score = risk.get("phq9", {}).get("score", 0)
            phq_severity = risk.get("phq9", {}).get("severity", "Minimal")
            gad_score = risk.get("gad7", {}).get("score", 0)
            gad_severity = risk.get("gad7", {}).get("severity", "Minimal")

        mood = "Neutral"
        stress = 5
        anxiety = 5
        sleep = "6–8 Hours"
        notes = ""

        if latest_checkin:
            mood = latest_checkin.get("mood", "Neutral")
            stress = latest_checkin.get("stress", 5)
            anxiety = latest_checkin.get("anxiety", 5)
            sleep = latest_checkin.get("sleep", "6–8 Hours")
            notes = latest_checkin.get("notes", "")

        # 4. Determine clinical alert (Moderate/Severe depression or anxiety)
        show_support_recommendation = (phq_score >= 10 or gad_score >= 10)

        # 5. Classify emotion using watsonx Granite (or fallback rule engine)
        detected_emotion = "Calm"
        explanation = "Based on your balanced daily wellness inputs."
        advice = "Maintain your current routine and take a few moments for self-reflection."
        motivation = "Peace is a journey, not a destination."

        # Prompt for watsonx Granite if available
        prompt = f"""
You are the MindCare AI Emotion Detection Engine.
Analyze the user's latest clinical screening results and daily wellness logs to determine their current emotional state.

Supported Emotional States (Choose EXACTLY one of these strings):
- "Happy": User feels positive, motivated, celebrating accomplishments.
- "Calm": User feels balanced, peaceful, relaxed.
- "Focused": User feels productive, goal-oriented, mindful.
- "Stressed": User is overwhelmed, busy, experiencing high tension.
- "Anxious": User is fearful, worried, experiencing high anxiety.
- "Low Mood": User feels sad, flat, low energy, depressed.

Latest User Data:
- Latest Daily Check-in Mood: {mood}
- Stress Level: {stress}/10
- Anxiety Level: {anxiety}/10
- Sleep Duration/Quality: {sleep}
- Check-in Notes: "{notes}"
- PHQ-9 Depression Score: {phq_score} (Severity: {phq_severity})
- GAD-7 Anxiety Score: {gad_score} (Severity: {gad_severity})

Respond with a clean JSON object containing exactly the following keys. Do not wrap in markdown code blocks, just return raw JSON text.

JSON Keys:
- "detected_emotion": One of the six supported emotional states (exact string matching: "Happy", "Calm", "Focused", "Stressed", "Anxious", "Low Mood").
- "explanation": A brief, supportive, context-aware explanation of why this state was selected (max 2 sentences).
- "advice": A practical, personalized wellness suggestion suited to this emotion (max 2 sentences).
- "motivation": A short, encouraging quote or positive affirmation (max 1 sentence).
"""

        try:
            # Request Granite analysis
            res = self.ai_orchestrator.generate_json(
                system_prompt="You are a precise JSON classifier. Never output raw conversational text, markdown code blocks, or explanations.",
                prompt=prompt,
                schema={
                    "type": "object",
                    "properties": {
                        "detected_emotion": {"type": "string", "enum": ["Happy", "Calm", "Focused", "Stressed", "Anxious", "Low Mood"]},
                        "explanation": {"type": "string"},
                        "advice": {"type": "string"},
                        "motivation": {"type": "string"}
                    },
                    "required": ["detected_emotion", "explanation", "advice", "motivation"]
                }
            )
            data = res.get("data", {})
            detected_emotion = data.get("detected_emotion", "Calm")
            explanation = data.get("explanation", explanation)
            advice = data.get("advice", advice)
            motivation = data.get("motivation", motivation)
            logger.info("Watsonx Granite successfully classified emotion as: %s", detected_emotion)
        except Exception as exc:
            logger.warning("Granite AI emotion classification failed: %s. Falling back to deterministic rules.", exc)
            fallback = self._classify_emotion_fallback(mood, stress, anxiety, phq_score, gad_score, notes)
            detected_emotion = fallback["detected_emotion"]
            explanation = fallback["explanation"]
            advice = fallback["advice"]
            motivation = fallback["motivation"]

        # Ensure correct formatting of emotion key
        if detected_emotion not in EMOTION_TO_THEME:
            detected_emotion = "Calm"

        active_theme = EMOTION_TO_THEME[detected_emotion]

        # 6. Retrieve or update history
        existing = await self.collection.find_one({"user_id": user_id})
        history = existing.get("history", []) if existing else []
        
        # Append today's history if date is new
        today_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if not any(h.get("date") == today_date for h in history):
            history.insert(0, {
                "date": today_date,
                "detected_emotion": detected_emotion,
                "theme": active_theme
            })
            history = history[:10]

        # 7. Persist to MongoDB
        state_document = {
            "user_id": user_id,
            "detected_emotion": detected_emotion,
            "theme": active_theme,
            "override_theme": existing.get("override_theme") if existing else None,
            "explanation": explanation,
            "advice": advice,
            "motivation": motivation,
            "show_support_recommendation": show_support_recommendation,
            "history": history,
            "last_updated": datetime.now(timezone.utc)
        }

        await self.collection.update_one(
            {"user_id": user_id},
            {"$set": state_document},
            upsert=True
        )

        state_document["_id"] = str(user_id)
        return state_document

    def _classify_emotion_fallback(
        self,
        mood: str,
        stress: int,
        anxiety: int,
        phq_score: int,
        gad_score: int,
        notes: str
    ) -> Dict[str, str]:
        """Deterministic rule-based fallback classification."""
        if gad_score >= 10:
            detected_emotion = "Anxious"
            explanation = f"Your recent anxiety screening score ({gad_score}/21) indicates elevated distress."
            advice = "Try a grounding exercise like the 5-4-3-2-1 technique or focus on slow, deep breathing."
            motivation = "Give yourself grace; you are doing the best you can."
        elif phq_score >= 10:
            detected_emotion = "Low Mood"
            explanation = f"Your recent depression screening score ({phq_score}/27) indicates low emotional vitality."
            advice = "Be gentle with yourself today. Focus on small, achievable daily goals and rest."
            motivation = "Small progress is still progress."
        elif stress >= 7:
            detected_emotion = "Stressed"
            explanation = f"Your daily log reports high stress levels ({stress}/10)."
            advice = "Consider taking a brief break from screens and practicing a 5-minute breathing exercise."
            motivation = "Give yourself permission to pause and breathe."
        elif anxiety >= 7:
            detected_emotion = "Anxious"
            explanation = f"Your daily check-in reports high anxiety levels ({anxiety}/10)."
            advice = "Focus on sensory grounding or chat with your AI Coach for calming support."
            motivation = "One breath at a time."
        elif mood in ("Sad", "Very Sad"):
            detected_emotion = "Low Mood"
            explanation = "You reported feeling down in your recent wellness log."
            advice = "Reflect in your journal, practice self-compassion, and check in with your support network."
            motivation = "Tough times don't last, but tough people do."
        elif mood in ("Very Happy", "Happy"):
            detected_emotion = "Happy"
            explanation = "You logged a positive and happy state of mind!"
            advice = "Celebrate your progress, maintain your streak, and set a goal to share this positive energy."
            motivation = "Happiness is double when shared."
        else:
            focus_keywords = ["focus", "work", "productive", "study", "complete", "finish", "goal", "build", "task"]
            notes_lower = notes.lower()
            if any(w in notes_lower for w in focus_keywords):
                detected_emotion = "Focused"
                explanation = "Your notes indicate a goal-oriented and productive mindset today."
                advice = "Review your active goals, minimize distractions, and capitalize on this mental clarity."
                motivation = "Focus on the process, not just the outcome."
            else:
                detected_emotion = "Calm"
                explanation = "Your logs show a balanced and peaceful state of mind."
                advice = "Enjoy this peaceful state. Take time to stretch or walk to maintain balance."
                motivation = "Peace is the breath of the soul."

        return {
            "detected_emotion": detected_emotion,
            "explanation": explanation,
            "advice": advice,
            "motivation": motivation
        }
