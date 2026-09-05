import os
from fastapi import APIRouter
from ..core.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    has_bedrock = bool(os.getenv("AWS_BEARER_TOKEN_BEDROCK") or os.getenv("AWS_ACCESS_KEY_ID"))
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "engine": "FastAPI + AWS Bedrock Claude Sonnet",
        "model": settings.BEDROCK_MODEL_ID,
        "aws_region": settings.AWS_REGION,
        "bedrock_configured": has_bedrock,
    }
