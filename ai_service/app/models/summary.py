from typing import List, Optional
from pydantic import BaseModel, Field
from .message import MessageItem

class SummarizeRequest(BaseModel):
    messages: List[MessageItem] = Field(default_factory=list, description="Messages to summarize")
    channelName: Optional[str] = Field("channel", description="Name of the channel")

class SummarizeResponse(BaseModel):
    overview: str
    keyPoints: List[str]
    actionItems: List[str]
    smartReplies: List[str]
