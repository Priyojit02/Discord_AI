from typing import Optional, List
from pydantic import BaseModel, Field

class MessageItem(BaseModel):
    sender: str = Field(..., description="Display name or username of sender")
    content: str = Field(..., description="Message text body")
    timestamp: Optional[str] = Field(None, description="ISO timestamp or formatted string")

class ChannelContext(BaseModel):
    channelName: str = Field("general", description="Active channel name")
    serverId: Optional[str] = Field(None, description="Server ID if channel belongs to server")
    recentMessages: List[MessageItem] = Field(default_factory=list, description="Historical message window")
