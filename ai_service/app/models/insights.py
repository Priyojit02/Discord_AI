from typing import List, Optional
from pydantic import BaseModel, Field
from .message import MessageItem

class ChannelInsightsRequest(BaseModel):
    messages: List[MessageItem] = Field(default_factory=list, description="Messages to analyze")
    channelName: Optional[str] = Field("general", description="Channel name")

class SentimentMetric(BaseModel):
    score: float = Field(..., description="Sentiment score from -1.0 (negative) to 1.0 (positive)")
    sentiment: str = Field(..., description="E.g., Positive, Neutral, Lively, Collaborative")
    energy: str = Field(..., description="E.g., High, Moderate, Calm")
    activeSpeakers: int = Field(..., description="Count of distinct participants")
    topics: List[str] = Field(default_factory=list, description="Key discussion themes")

class ChannelInsightsResponse(BaseModel):
    insights: SentimentMetric
    summary: str
    channelName: str
