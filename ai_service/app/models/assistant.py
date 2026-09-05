from typing import List, Optional
from pydantic import BaseModel, Field
from .message import MessageItem

class QueryRequest(BaseModel):
    prompt: str = Field(..., description="User prompt or slash command")
    channelName: Optional[str] = Field("channel", description="Contextual channel name")
    recentMessages: Optional[List[MessageItem]] = Field(default_factory=list, description="Recent conversation messages")

class QueryResponse(BaseModel):
    reply: str = Field(..., description="Assistant reply (markdown formatted)")
    suggestions: List[str] = Field(default_factory=list, description="Follow up suggested actions or prompts")
    model: Optional[str] = Field("Claude Sonnet 4.6 (AWS Bedrock)", description="Model engine that fulfilled the query")
