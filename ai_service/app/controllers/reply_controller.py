from fastapi import APIRouter
from ..models.reply import SmartRepliesRequest, SmartRepliesResponse
from ..services.reply_service import ReplyService
from ..views.response_views import ResponseView

router = APIRouter(prefix="/api/ai", tags=["Smart Replies"])

@router.post("/smart-replies", response_model=SmartRepliesResponse)
def get_smart_replies(req: SmartRepliesRequest):
    replies = ReplyService.generate_replies(
        messages=req.messages,
        channel_name=req.channelName or "channel"
    )
    return ResponseView.render_smart_replies(replies=replies)
