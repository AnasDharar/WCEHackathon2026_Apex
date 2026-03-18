from fastapi import APIRouter, Depends, HTTPException

from app.schemas.assessment_schema import AssessmentSubmitRequest
from app.services.assessment_service import AssessmentService, get_assessment_service
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/assessments", tags=["assessments"])


@router.get("/catalog")
def catalog(_user=Depends(get_current_user), service: AssessmentService = Depends(get_assessment_service)):
    """Return assessment catalog."""
    return {"data": service.get_catalog()}


@router.post("/submit")
def submit(payload: AssessmentSubmitRequest, user=Depends(get_current_user), service: AssessmentService = Depends(get_assessment_service)):
    """Submit and score assessments."""
    if not payload.submissions:
        raise HTTPException(status_code=422, detail="At least one submission is required.")
    submissions = [submission.model_dump() for submission in payload.submissions]
    return {"data": service.submit_batch(user.id, submissions)}


@router.get("/")
def list_assessments(user=Depends(get_current_user), service: AssessmentService = Depends(get_assessment_service)):
    """Return user assessments."""
    return {"data": service.list_assessments(user.id)}
