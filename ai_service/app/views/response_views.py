from typing import List
from ..models.summary import SummarizeResponse
from ..models.reply import SmartRepliesResponse
from ..models.draft import DraftResponse
from ..models.assistant import QueryResponse
from ..models.insights import ChannelInsightsResponse, SentimentMetric

class ResponseView:
    """View presenter building standardized API response representations."""

    @staticmethod
    def render_summary(
        overview: str,
        key_points: List[str],
        action_items: List[str],
        smart_replies: List[str]
    ) -> SummarizeResponse:
        return SummarizeResponse(
            overview=overview,
            keyPoints=key_points,
            actionItems=action_items,
            smartReplies=smart_replies,
        )

    @staticmethod
    def render_smart_replies(replies: List[str]) -> SmartRepliesResponse:
        return SmartRepliesResponse(replies=replies)

    @staticmethod
    def render_draft(enhanced: str, style: str) -> DraftResponse:
        return DraftResponse(enhanced=enhanced, style=style)

    @staticmethod
    def render_query(reply: str, suggestions: List[str], model: str = "Claude Sonnet 4.6 (AWS Bedrock)") -> QueryResponse:
        return QueryResponse(reply=reply, suggestions=suggestions, model=model)

    @staticmethod
    def render_insights(metric: SentimentMetric, summary: str, channel: str) -> ChannelInsightsResponse:
        return ChannelInsightsResponse(insights=metric, summary=summary, channelName=channel)
