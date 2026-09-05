from fastapi import APIRouter
from ..models.assistant import QueryRequest, QueryResponse
from ..models.meeting import CodeRunRequest, CodeRunResponse
from ..services.clyde_service import ClydeBotService
from ..services.code_runner_service import CodeRunnerService
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

@router.post("/run-code", response_model=CodeRunResponse)
def run_code_snippet(req: CodeRunRequest):
    result = CodeRunnerService.run_code(code=req.code, language=req.language)
    return CodeRunResponse(**result)

@router.post("/explain-code")
def explain_code_snippet(req: CodeRunRequest):
    explanation = CodeRunnerService.explain_code(code=req.code, language=req.language)
    return {"explanation": explanation, "language": req.language}

