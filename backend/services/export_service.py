from typing import Any, Dict
from repositories.journal_repository import JournalRepository
from repositories.goal_repository import GoalRepository
from repositories.coach_repository import CoachRepository
from repositories.assessment_repository import AssessmentRepository
from repositories.daily_wellness_repository import DailyWellnessRepository
from repositories.monthly_review_repository import MonthlyReviewRepository
from repositories.activity_repository import ActivityRepository
from repositories.audit_log_repository import AuditLogRepository

class ExportService:
    """
    Service responsible for compiling and generating personal data portability exports (JSON/CSV).
    """

    def __init__(
        self,
        journal_repo: JournalRepository,
        goal_repo: GoalRepository,
        coach_repo: CoachRepository,
        assessment_repo: AssessmentRepository,
        wellness_repo: DailyWellnessRepository,
        review_repo: MonthlyReviewRepository,
        activity_repo: ActivityRepository,
        audit_repo: AuditLogRepository
    ) -> None:
        self.journal_repo = journal_repo
        self.goal_repo = goal_repo
        self.coach_repo = coach_repo
        self.assessment_repo = assessment_repo
        self.wellness_repo = wellness_repo
        self.review_repo = review_repo
        self.activity_repo = activity_repo
        self.audit_repo = audit_repo

    async def compile_user_archive(self, user_id: str) -> Dict[str, Any]:
        """Gathers all user feature collections and packages them into a single export dictionary."""
        journals = await self.journal_repo.list_journals(user_id, limit=9999)
        goals = await self.goal_repo.list_goals(user_id)
        coach = await self.coach_repo.list_conversations(user_id)
        assessments = await self.assessment_repo.list_assessments(user_id, limit=9999)
        checkins = await self.wellness_repo.list_checkins(user_id, limit=9999)
        reviews = await self.review_repo.list_monthly_reviews(user_id)
        timeline = await self.activity_repo.get_user_timeline(user_id, limit=9999)

        # Log audit log
        await self.audit_repo.log_action("export_personal_data", user_id=user_id, status="success")

        return {
            "exported_at": datetime_to_iso(),
            "user_id": user_id,
            "journals": journals,
            "goals": goals,
            "coach_conversations": coach,
            "assessments": assessments,
            "daily_checkins": checkins,
            "monthly_reviews": reviews,
            "activity_timeline": timeline
        }

def datetime_to_iso() -> str:
    from datetime import datetime
    return datetime.utcnow().isoformat() + "Z"
