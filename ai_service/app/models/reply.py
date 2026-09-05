from typing import List, Optional
from pydantic import BaseModel, Field
from .message import MessageItem

class SmartRepliesRequest(BaseModel):
    messages: List[MessageItem] = Field(default_factory=list, description="Recent conversation messages")
    channelName: Optional[str] = Field("channel", description="Name of the channel")

class SmartRepliesResponse(BaseModel):
    replies: List[str] = Field(default_factory=list, description="Suggested quick replies")
