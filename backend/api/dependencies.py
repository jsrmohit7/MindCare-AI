from fastapi import Depends
from config.database import get_database

# 1. Repositories
from repositories.assessment_repository import AssessmentRepository
from repositories.daily_wellness_repository import DailyWellnessRepository
from repositories.coach_repository import CoachRepository
from repositories.activity_repository import ActivityRepository
from repositories.coach_memory_repository import MemoryRepository
from repositories.wellness_state_repository import WellnessStateRepository

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


# 2. Engines & Services
from services.ai_orchestrator import AIOrchestrator
from services.wellness_intelligence_engine import WellnessIntelligenceEngine
from services.decision_engine import DecisionEngine
from services.analysis_engine import AnalysisEngine
from services.assessment_service import AssessmentService
from services.daily_wellness_service import DailyWellnessService
from services.coach_service import CoachService
from services.prompt_builder import build_prompt
from services.response_validator import ResponseValidator
import services.risk_engine as risk_engine

def get_ai_orchestrator() -> AIOrchestrator:
    return AIOrchestrator()

def get_wellness_intelligence_engine() -> WellnessIntelligenceEngine:
    return WellnessIntelligenceEngine()

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
    activity_repo: ActivityRepository = Depends(get_activity_repository)
) -> CoachService:
    return CoachService(
        coach_repo=coach_repo,
        assessment_repo=assessment_repo,
        wellness_repo=wellness_repo,
        wellness_service=wellness_service,
        granite_service=AIOrchestrator(),
        memory_repo=memory_repo,
        activity_repo=activity_repo
    )
