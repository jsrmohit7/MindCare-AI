from fastapi import Depends
from config.database import get_database

# 1. Repositories
from repositories.assessment_repository import AssessmentRepository
from repositories.daily_wellness_repository import DailyWellnessRepository
from repositories.coach_repository import CoachRepository
from repositories.activity_repository import ActivityRepository
from repositories.coach_memory_repository import MemoryRepository
from repositories.wellness_state_repository import WellnessStateRepository
from repositories.journal_repository import JournalRepository
from repositories.goal_repository import GoalRepository
from repositories.monthly_review_repository import MonthlyReviewRepository

def get_assessment_repository(db=Depends(get_database)) -> AssessmentRepository:
    return AssessmentRepository(db)

def get_daily_wellness_repository(db=Depends(get_database)) -> DailyWellnessRepository:
    return DailyWellnessRepository(db)

def get_coach_repository(db=Depends(get_database)) -> CoachRepository:
    return CoachRepository(db)

def get_activity_repository(db=Depends(get_database)) -> ActivityRepository:
    return ActivityRepository(db)

def get_memory_repository(db=Depends(get_database)) -> MemoryRepository:
    return MemoryRepository(db)

def get_wellness_state_repository(db=Depends(get_database)) -> WellnessStateRepository:
    return WellnessStateRepository(db)

def get_journal_repository(db=Depends(get_database)) -> JournalRepository:
    return JournalRepository(db)

def get_goal_repository(db=Depends(get_database)) -> GoalRepository:
    return GoalRepository(db)

def get_monthly_review_repository(db=Depends(get_database)) -> MonthlyReviewRepository:
    return MonthlyReviewRepository(db)


# 2. Engines & Services
from services.ai_orchestrator import AIOrchestrator
from services.wellness_intelligence_engine import WellnessIntelligenceEngine
from services.prediction_engine import PredictionEngine
from services.insight_engine import InsightEngine
from services.reasoning_engine import ReasoningEngine
from services.decision_engine import DecisionEngine
from services.analysis_engine import AnalysisEngine
from services.assessment_service import AssessmentService
from services.daily_wellness_service import DailyWellnessService
from services.coach_service import CoachService
from services.journal_service import JournalService
from services.goal_service import GoalService
from services.monthly_review_service import MonthlyReviewService
from services.prompt_builder import build_prompt
from services.response_validator import ResponseValidator
import services.risk_engine as risk_engine

def get_ai_orchestrator() -> AIOrchestrator:
    return AIOrchestrator()

def get_wellness_intelligence_engine() -> WellnessIntelligenceEngine:
    return WellnessIntelligenceEngine()

def get_prediction_engine(
    ai_orchestrator: AIOrchestrator = Depends(get_ai_orchestrator)
) -> PredictionEngine:
    return PredictionEngine(ai_orchestrator)

def get_insight_engine(
    ai_orchestrator: AIOrchestrator = Depends(get_ai_orchestrator)
) -> InsightEngine:
    return InsightEngine(ai_orchestrator)

def get_reasoning_engine(
    prediction_engine: PredictionEngine = Depends(get_prediction_engine),
    insight_engine: InsightEngine = Depends(get_insight_engine)
) -> ReasoningEngine:
    return ReasoningEngine(prediction_engine, insight_engine)

def get_decision_engine(
    wellness_engine: WellnessIntelligenceEngine = Depends(get_wellness_intelligence_engine)
) -> DecisionEngine:
    return DecisionEngine(wellness_engine)

def get_analysis_engine() -> AnalysisEngine:
    return AnalysisEngine(
        prompt_builder=build_prompt,
        granite_service=AIOrchestrator(),
        response_validator=ResponseValidator()
    )

def get_assessment_service(
    repository: AssessmentRepository = Depends(get_assessment_repository),
    analysis_engine: AnalysisEngine = Depends(get_analysis_engine)
) -> AssessmentService:
    return AssessmentService(
        risk_engine=risk_engine,
        analysis_engine=analysis_engine,
        assessment_repository=repository
    )

def get_daily_wellness_service(
    repository: DailyWellnessRepository = Depends(get_daily_wellness_repository)
) -> DailyWellnessService:
    return DailyWellnessService(repository, AIOrchestrator())

def get_coach_service(
    coach_repo: CoachRepository = Depends(get_coach_repository),
    assessment_repo: AssessmentRepository = Depends(get_assessment_repository),
    wellness_repo: DailyWellnessRepository = Depends(get_daily_wellness_repository),
    wellness_service: DailyWellnessService = Depends(get_daily_wellness_service),
    memory_repo: MemoryRepository = Depends(get_memory_repository),
    activity_repo: ActivityRepository = Depends(get_activity_repository),
    reasoning_engine: ReasoningEngine = Depends(get_reasoning_engine),
    journal_repo: JournalRepository = Depends(get_journal_repository),
    goal_repo: GoalRepository = Depends(get_goal_repository),
    review_repo: MonthlyReviewRepository = Depends(get_monthly_review_repository)
) -> CoachService:
    return CoachService(
        coach_repo=coach_repo,
        assessment_repo=assessment_repo,
        wellness_repo=wellness_repo,
        wellness_service=wellness_service,
        granite_service=AIOrchestrator(),
        memory_repo=memory_repo,
        activity_repo=activity_repo,
        reasoning_engine=reasoning_engine,
        journal_repo=journal_repo,
        goal_repo=goal_repo,
        review_repo=review_repo
    )


def get_journal_service(
    journal_repo: JournalRepository = Depends(get_journal_repository),
    memory_repo: MemoryRepository = Depends(get_memory_repository),
    activity_repo: ActivityRepository = Depends(get_activity_repository),
    ai_orchestrator: AIOrchestrator = Depends(get_ai_orchestrator)
) -> JournalService:
    return JournalService(
        journal_repo=journal_repo,
        memory_repo=memory_repo,
        activity_repo=activity_repo,
        ai_orchestrator=ai_orchestrator
    )

def get_goal_service(
    goal_repo: GoalRepository = Depends(get_goal_repository),
    activity_repo: ActivityRepository = Depends(get_activity_repository)
) -> GoalService:
    return GoalService(goal_repo, activity_repo)

def get_monthly_review_service(
    review_repo: MonthlyReviewRepository = Depends(get_monthly_review_repository),
    wellness_repo: DailyWellnessRepository = Depends(get_daily_wellness_repository),
    assessment_repo: AssessmentRepository = Depends(get_assessment_repository),
    wellness_engine: WellnessIntelligenceEngine = Depends(get_wellness_intelligence_engine),
    ai_orchestrator: AIOrchestrator = Depends(get_ai_orchestrator)
) -> MonthlyReviewService:
    return MonthlyReviewService(
        review_repo=review_repo,
        wellness_repo=wellness_repo,
        assessment_repo=assessment_repo,
        wellness_engine=wellness_engine,
        ai_orchestrator=ai_orchestrator
    )
