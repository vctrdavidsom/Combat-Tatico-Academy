from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

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