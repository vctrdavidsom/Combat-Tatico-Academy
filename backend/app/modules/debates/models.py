from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class DebateMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    lesson_id: int = Field(foreign_key="lesson.id", ondelete="CASCADE")
    user_id: int = Field(foreign_key="user.id", ondelete="CASCADE")
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_visible: bool = Field(default=True)
