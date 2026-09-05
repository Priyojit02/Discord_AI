from fastapi import APIRouter
from ..models.summary import SummarizeRequest, SummarizeResponse
from ..models.insights import ChannelInsightsRequest, ChannelInsightsResponse
from ..models.meeting import MeetingRecapRequest, MeetingRecapResponse
from ..services.summarizer_service import SummarizerService
from ..services.sentiment_service import SentimentService
from ..views.response_views import ResponseView

router = APIRouter(prefix="/api/ai", tags=["Channel AI"])

@router.post("/summarize", response_model=SummarizeResponse)
def summarize_channel(req: SummarizeRequest):
    overview, key_points, action_items, smart_replies = SummarizerService.summarize(
        messages=req.messages,
        channel_name=req.channelName or "channel"
    )
    return ResponseView.render_summary(
        overview=overview,
        key_points=key_points,
        action_items=action_items,
        smart_replies=smart_replies
    )

@router.post("/insights", response_model=ChannelInsightsResponse)
def get_channel_insights(req: ChannelInsightsRequest):
    channel = req.channelName or "general"
    metric, summary = SentimentService.analyze_channel(
        messages=req.messages,
        channel_name=channel
    )
    return ResponseView.render_insights(
        metric=metric,
        summary=summary,
        channel=channel
    )

@router.post("/meeting-recap", response_model=MeetingRecapResponse)
def get_meeting_recap(req: MeetingRecapRequest):
    recap = SummarizerService.generate_meeting_recap(
        channel_name=req.channelName,
        duration_minutes=req.durationMinutes or 15,
        participants=req.participants,
        messages=req.messages,
    )
    return MeetingRecapResponse(**recap)

