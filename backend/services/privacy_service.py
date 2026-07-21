from typing import Any, Dict
from repositories.journal_repository import JournalRepository
from repositories.goal_repository import GoalRepository
from repositories.coach_repository import CoachRepository
from repositories.assessment_repository import AssessmentRepository
from repositories.daily_wellness_repository import DailyWellnessRepository
from repositories.coach_memory_repository import MemoryRepository
from repositories.activity_repository import ActivityRepository
from repositories.audit_log_repository import AuditLogRepository

class PrivacyService:
    """
    Service coordinating personal data privacy controls, including selective
    content purges and account teardowns.
    """

    def __init__(
        self,
        journal_repo: JournalRepository,
        goal_repo: GoalRepository,
        coach_repo: CoachRepository,
        assessment_repo: AssessmentRepository,
        wellness_repo: DailyWellnessRepository,
        memory_repo: MemoryRepository,
        activity_repo: ActivityRepository,
        audit_repo: AuditLogRepository,
        db: Any
    ) -> None:
        self.journal_repo = journal_repo
        self.goal_repo = goal_repo
        self.coach_repo = coach_repo
        self.assessment_repo = assessment_repo
        self.wellness_repo = wellness_repo
        self.memory_repo = memory_repo
        self.activity_repo = activity_repo
        self.audit_repo = audit_repo
        self.db = db

    async def get_personal_data_summary(self, user_id: str) -> Dict[str, int]:
        """Returns the volume counts of stored personal records for transparency view."""
        journals = await self.journal_repo.list_journals(user_id, limit=9999)
        goals = await self.goal_repo.list_goals(user_id)
        coach_convs = await self.coach_repo.list_conversations(user_id)
        assessments = await self.assessment_repo.list_assessments(user_id, limit=9999)
        checkins = await self.wellness_repo.list_checkins(user_id, limit=9999)

        return {
            "journals": len(journals),
            "goals": len(goals),
            "coach_conversations": len(coach_convs),
            "assessments": len(assessments),
            "daily_checkins": len(checkins)
        }

    async def purge_journal(self, user_id: str) -> None:
        """Deletes all journal entries and updates audit logs."""
        await self.journal_repo.delete_all_user_journals(user_id)
        await self.audit_repo.log_action("purge_journal", user_id=user_id, status="success")

    async def purge_goals(self, user_id: str) -> None:
        """Deletes all wellness goals and updates audit logs."""
        await self.goal_repo.delete_all_user_goals(user_id)
        await self.audit_repo.log_action("purge_goals", user_id=user_id, status="success")

    async def purge_coach_history(self, user_id: str) -> None:
        """Deletes all coach conversation threads and updates audit logs."""
        await self.coach_repo.delete_all_user_conversations(user_id)
        await self.audit_repo.log_action("purge_coach_history", user_id=user_id, status="success")

    async def purge_assessments(self, user_id: str) -> None:
        """Deletes all historical assessments and updates audit logs."""
        await self.assessment_repo.delete_all_user_assessments(user_id)
        await self.audit_repo.log_action("purge_assessments", user_id=user_id, status="success")

    async def purge_daily_wellness(self, user_id: str) -> None:
        """Deletes all daily check-in records and updates audit logs."""
        await self.wellness_repo.delete_all_user_checkins(user_id)
        await self.audit_repo.log_action("purge_daily_wellness", user_id=user_id, status="success")

    async def purge_ai_memory(self, user_id: str) -> None:
        """Wipes the AI cognitive profile and resets memory state."""
        await self.memory_repo.delete_memory(user_id)
        await self.audit_repo.log_action("purge_ai_memory", user_id=user_id, status="success")

    async def delete_account(self, user_id: str) -> None:
        """Performs a full cascading purge of all user records from MongoDB and deletes user account."""
        # Purge all features
        await self.purge_journal(user_id)
        await self.purge_goals(user_id)
        await self.purge_coach_history(user_id)
        await self.purge_assessments(user_id)
        await self.purge_daily_wellness(user_id)
        await self.purge_ai_memory(user_id)
        
        # Purge activity timeline
        await self.activity_repo.delete_all_user_activities(user_id)

        # Delete user profile record
        from bson import ObjectId
        await self.db.users.delete_one({"_id": ObjectId(user_id)})
        
        await self.audit_repo.log_action("delete_account", user_id=user_id, status="success", metadata={"account_purged": True})
