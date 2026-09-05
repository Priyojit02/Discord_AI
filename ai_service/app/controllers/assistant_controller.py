from fastapi import APIRouter
from ..models.assistant import QueryRequest, QueryResponse
from ..services.clyde_service import ClydeBotService
from ..views.response_views import ResponseView

router = APIRouter(prefix="/api/ai", tags=["Assistant Copilot"])

@router.post("/query", response_model=QueryResponse)
def ask_ai_bot(req: QueryRequest):
    reply, suggestions, model_used = ClydeBotService.process_query(
        prompt=req.prompt,
        channel_name=req.channelName or "channel",
        recent_messages=req.recentMessages or []
    )
    return ResponseView.render_query(
        reply=reply,
        suggestions=suggestions,
        model=model_used
    )
