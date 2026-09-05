from fastapi import APIRouter
from ..models.draft import DraftRequest, DraftResponse
from ..services.draft_service import DraftService
from ..views.response_views import ResponseView

router = APIRouter(prefix="/api/ai", tags=["Drafting AI"])

@router.post("/draft", response_model=DraftResponse)
def enhance_draft_text(req: DraftRequest):
    enhanced = DraftService.enhance_draft(text=req.text, style=req.style)
    return ResponseView.render_draft(enhanced=enhanced, style=req.style)
