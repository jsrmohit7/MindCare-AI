from fastapi import Depends
from config.database import get_database
from repositories.assessment_repository import AssessmentRepository
from services.analysis_engine import AnalysisEngine
from services.assessment_service import AssessmentService
from services.prompt_builder import build_prompt
from services.granite_service import GraniteService
from services.response_validator import ResponseValidator
import services.risk_engine as risk_engine


def get_assessment_repository(db=Depends(get_database)) -> AssessmentRepository:
    """
    Provides a request-scoped AssessmentRepository instance.
    """
    return AssessmentRepository(db)


def get_analysis_engine() -> AnalysisEngine:
    """
    Provides a request-scoped/stateless AnalysisEngine instance.
    """
    return AnalysisEngine(
        prompt_builder=build_prompt,
        granite_service=GraniteService(),
        response_validator=ResponseValidator()
    )


def get_assessment_service(
    repository: AssessmentRepository = Depends(get_assessment_repository),
    analysis_engine: AnalysisEngine = Depends(get_analysis_engine)
) -> AssessmentService:
    """
    Provides a request-scoped AssessmentService instance.
    """
    return AssessmentService(
        risk_engine=risk_engine,
        analysis_engine=analysis_engine,
        assessment_repository=repository
    )


# Daily Wellness Dependencies
from repositories.daily_wellness_repository import DailyWellnessRepository
from services.daily_wellness_service import DailyWellnessService

def get_daily_wellness_repository(db=Depends(get_database)) -> DailyWellnessRepository:
    return DailyWellnessRepository(db)

def get_daily_wellness_service(
    repository: DailyWellnessRepository = Depends(get_daily_wellness_repository)
) -> DailyWellnessService:
    return DailyWellnessService(repository, GraniteService())


# AI Coach Dependencies
from repositories.coach_repository import CoachRepository
from services.coach_service import CoachService

def get_coach_repository(db=Depends(get_database)) -> CoachRepository:
    return CoachRepository(db)

def get_coach_service(
    coach_repo: CoachRepository = Depends(get_coach_repository),
    assessment_repo: AssessmentRepository = Depends(get_assessment_repository),
    wellness_repo: DailyWellnessRepository = Depends(get_daily_wellness_repository),
    wellness_service: DailyWellnessService = Depends(get_daily_wellness_service)
) -> CoachService:
    return CoachService(
        coach_repo=coach_repo,
        assessment_repo=assessment_repo,
        wellness_repo=wellness_repo,
        wellness_service=wellness_service,
        granite_service=GraniteService()
    )

