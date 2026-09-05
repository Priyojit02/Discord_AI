from pydantic import BaseModel, Field
from typing import List, Optional
from .message import MessageItem

class MeetingRecapRequest(BaseModel):
    channelName: str = Field(..., description="Voice channel or server name")
    durationMinutes: Optional[int] = Field(default=15, description="Duration of the call session")
    participants: Optional[List[str]] = Field(default_factory=list, description="List of participant names")
    messages: Optional[List[MessageItem]] = Field(default_factory=list, description="Optional text/transcript messages")

class MeetingRecapResponse(BaseModel):
    title: str
    executiveSummary: str
    keyDecisions: List[str]
    actionItems: List[str]
    topicsDiscussed: List[str]
    sentimentScore: str
    durationMinutes: int
    participants: List[str]

class CodeRunRequest(BaseModel):
    language: str = Field(default="python", description="Code language e.g. python, javascript")
    code: str = Field(..., description="The code content to run or analyze")

class CodeRunResponse(BaseModel):
    language: str
    output: str
    hasError: bool = False
    executionTimeMs: float = 0.0
    explanation: Optional[str] = None
