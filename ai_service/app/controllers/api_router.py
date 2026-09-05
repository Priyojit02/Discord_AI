from fastapi import APIRouter
from .health_controller import router as health_router
from .summary_controller import router as summary_router
from .reply_controller import router as reply_router
from .draft_controller import router as draft_router
from .assistant_controller import router as assistant_router

api_router = APIRouter()

# Register modular sub-routers
api_router.include_router(health_router)
api_router.include_router(summary_router)
api_router.include_router(reply_router)
api_router.include_router(draft_router)
api_router.include_router(assistant_router)

__all__ = ["api_router"]
