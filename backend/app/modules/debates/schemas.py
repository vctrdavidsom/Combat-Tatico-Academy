from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DebateMessageCreate(BaseModel):
    content: str


class DebateMessageUpdate(BaseModel):
    is_visible: Optional[bool] = None


class DebateMessagePublic(BaseModel):
    id: int
    lesson_id: int
    user_id: int
    user_name: str
    content: str
    created_at: datetime
    is_visible: bool

    class Config:
        from_attributes = True
