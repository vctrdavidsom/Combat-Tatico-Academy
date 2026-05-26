from pydantic import BaseModel
from typing import Optional, List
from app.modules.lessons.schemas import LessonPublic
from app.modules.exams.schemas import ExamPublic

# --- SCHEMAS DE MÓDULO ---
class ModuleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    order: Optional[int] = 1

class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None

class ModulePublic(BaseModel):
    id: int
    title: str
    description: Optional[str]
    order: int
    course_id: int

    class Config:
        from_attributes = True


class ModuleDetailPublic(ModulePublic):
    lessons: List[LessonPublic] = []
    exams: List[ExamPublic] = []

# --- SCHEMAS DE CURSO ---
class CourseCreate(BaseModel):
    code: str  # <-- Adicionado: Código obrigatório na criação
    name: str
    description: str
    duration: str
    thumbnail_url: Optional[str] = None

class CourseUpdate(BaseModel):
    code: Optional[str] = None  # <-- Adicionado: Opcional na atualização
    name: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_active: Optional[bool] = None

class CoursePublic(BaseModel):
    id: int
    code: str  # <-- Adicionado: Retornado para o Front-end/API Externa
    name: str
    description: str
    duration: str
    thumbnail_url: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class CourseDetailPublic(CoursePublic):
    modules: List[ModuleDetailPublic] = []
    final_exam: Optional[ExamPublic] = None