from pydantic import BaseModel
from typing import Optional


# --- SCHEMAS DE AULA ---
class LessonCreate(BaseModel):
    title: str
    content_url: str
    order: Optional[int] = 1


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content_url: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class LessonPublic(BaseModel):
    id: int
    title: str
    content_url: str
    order: int
    is_active: bool
    module_id: int

    class Config:
        from_attributes = True
