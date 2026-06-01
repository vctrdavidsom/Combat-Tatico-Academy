from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

class Certificate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    file_name: str
    file_content_base64: str # Stores the base64 encoded PDF content
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    user_id: int = Field(foreign_key="user.id", ondelete="CASCADE")
    course_id: int = Field(foreign_key="course.id", ondelete="CASCADE")
