from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from enum import Enum

if TYPE_CHECKING:
    from app.modules.courses.models import Module
    from app.modules.users.models import User


# --- ENUMS ---
class ExamStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ExamResultStatus(str, Enum):
    PASSED = "PASSED"
    FAILED = "FAILED"


# --- EXAM STRUCTURE ---
class Exam(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    passing_score: float = Field(default=70.0)  # Nota mínima para aprovação (0-100)
    time_limit_minutes: Optional[int] = None  # Tempo limite em minutos (None = sem limite)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    module_id: int = Field(foreign_key="module.id", ondelete="CASCADE")
    module: "Module" = Relationship(back_populates="exams")
    
    questions: List["Question"] = Relationship(back_populates="exam", cascade_delete=True)
    results: List["ExamResult"] = Relationship(back_populates="exam", cascade_delete=True)


class Question(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    order: int = Field(default=1)
    is_active: bool = Field(default=True)
    
    exam_id: int = Field(foreign_key="exam.id", ondelete="CASCADE")
    exam: "Exam" = Relationship(back_populates="questions")
    
    alternatives: List["Alternative"] = Relationship(back_populates="question", cascade_delete=True)
    student_answers: List["StudentAnswer"] = Relationship(back_populates="question", cascade_delete=True)


class Alternative(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    text: str
    order: int = Field(default=1)
    is_correct: bool = Field(default=False)  # Marca a alternativa correta
    is_active: bool = Field(default=True)
    
    question_id: int = Field(foreign_key="question.id", ondelete="CASCADE")
    question: "Question" = Relationship(back_populates="alternatives")
    
    student_answers: List["StudentAnswer"] = Relationship(back_populates="alternative", cascade_delete=True)


# --- EXAM RESULTS & HISTORY ---
class StudentAnswer(SQLModel, table=True):
    """Registro de resposta individual do aluno a uma questão."""
    id: Optional[int] = Field(default=None, primary_key=True)
    answer_time_seconds: Optional[int] = None  # Tempo gasto nesta questão
    
    exam_result_id: int = Field(foreign_key="examresult.id", ondelete="CASCADE")
    exam_result: "ExamResult" = Relationship(back_populates="answers")
    
    question_id: int = Field(foreign_key="question.id", ondelete="CASCADE")
    question: "Question" = Relationship(back_populates="student_answers")
    
    alternative_id: Optional[int] = Field(foreign_key="alternative.id", ondelete="SET NULL")
    alternative: Optional["Alternative"] = Relationship(back_populates="student_answers")


class ExamResult(SQLModel, table=True):
    """Registro completo da tentativa de exame do aluno."""
    id: Optional[int] = Field(default=None, primary_key=True)
    score: float  # Nota obtida (0-100)
    status: ExamResultStatus  # PASSED ou FAILED
    total_time_seconds: int = Field(default=0)  # Tempo total gasto
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime = Field(default_factory=datetime.utcnow)
    
    user_id: int = Field(foreign_key="user.id", ondelete="CASCADE")
    exam_id: int = Field(foreign_key="exam.id", ondelete="CASCADE")
    
    exam: "Exam" = Relationship(back_populates="results")
    answers: List["StudentAnswer"] = Relationship(back_populates="exam_result", cascade_delete=True)
