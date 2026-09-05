from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logger import logger
from app.controllers import api_router

def create_app() -> FastAPI:
    """Application factory for Discord Python AI Service."""
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.PROJECT_VERSION,
        description="Advanced MVC AI Service Layer for Discord Clone (Smart Inbox, Clyde Bot, Bedrock Claude Sonnet)",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Middleware: CORS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount Master API Controller Router
    application.include_router(api_router)

    @application.on_event("startup")
    async def startup_event():
        logger.info(f"✨ {settings.PROJECT_NAME} v{settings.PROJECT_VERSION} started")
        logger.info(f"🤖 Model: {settings.BEDROCK_MODEL_ID} in {settings.AWS_REGION}")
        logger.info(f"🌐 Listening on http://{settings.HOST}:{settings.PORT}")

    return application

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
