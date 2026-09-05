import os
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

class Settings:
    PROJECT_NAME: str = "Discord Python AI Service"
    PROJECT_VERSION: str = "1.1.0"
    HOST: str = os.getenv("AI_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("AI_PORT", "8000"))
    DEBUG: bool = os.getenv("AI_DEBUG", "True").lower() == "true"

    # AWS Bedrock Configuration (from Smart_Inbox_Assistant_Clinevo)
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    AWS_BEARER_TOKEN_BEDROCK: Optional[str] = os.getenv("AWS_BEARER_TOKEN_BEDROCK")
    BEDROCK_MODEL_ID: str = os.getenv("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-6")

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "*",
    ]

    # Discord AI Assistant Bot Details
    AI_BOT_NAME: str = "Clyde AI"
    AI_BOT_ROLE: str = "Discord Intelligent Copilot"

settings = Settings()

def get_llm(temperature: float = 0.3, max_tokens: int = 1500):
    """
    Returns a configured ChatBedrock client using Claude Sonnet from AWS Bedrock.
    Falls back gracefully if AWS credentials or network fail.
    """
    try:
        from langchain_aws import ChatBedrock
        return ChatBedrock(
            model_id=settings.BEDROCK_MODEL_ID,
            region_name=settings.AWS_REGION,
            model_kwargs={
                "temperature": temperature,
                "max_tokens": max_tokens
            },
        )
    except Exception as exc:
        from .logger import logger
        logger.warning(f"Could not initialize ChatBedrock: {exc}. Will use heuristic fallback.")
        return None
