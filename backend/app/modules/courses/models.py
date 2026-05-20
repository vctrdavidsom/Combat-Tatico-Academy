from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

if TYPE_CHECKING:
    from app.modules.lessons.models import Lesson
    from app.modules.exams.models import Exam

# --- TABELA INTERMEDIÁRIA (LIBERAÇÃO DO CURSO PARA O ALUNO) ---
class Enrollment(SQLModel, table=True):
    user_id: int = Field(foreign_key="user.id", primary_key=True, ondelete="CASCADE")
    course_id: int = Field(foreign_key="course.id", primary_key=True, ondelete="CASCADE")


# --- TABELAS DE CURSO E MÓDULO ---
class Course(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True, index=True)  # <-- Código do curso (SKU) adicionado
    name: str = Field(index=True)
    description: str                                    
    duration: str
    thumbnail_url: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    modules: List["Module"] = Relationship(back_populates="course", cascade_delete=True)


class Module(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    order: int = Field(default=1)
    
    course_id: int = Field(foreign_key="course.id", ondelete="CASCADE")
    course: Course = Relationship(back_populates="modules")
    lessons: List["Lesson"] = Relationship(back_populates="module", cascade_delete=True)
    exams: List["Exam"] = Relationship(back_populates="module", cascade_delete=True)