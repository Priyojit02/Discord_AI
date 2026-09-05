from enum import Enum
from pydantic import BaseModel, Field

class DraftStyle(str, Enum):
    DISCORD = "discord"
    PROFESSIONAL = "professional"
    CONCISE = "concise"
    EMOJIS = "emojis"
    BULLET_POINTS = "bullet_points"

class DraftRequest(BaseModel):
    text: str = Field(..., description="Draft message to polish")
    style: str = Field("discord", description="Formatting style or tone")

class DraftResponse(BaseModel):
    enhanced: str = Field(..., description="AI enhanced text")
    style: str = Field("discord", description="Applied style")
