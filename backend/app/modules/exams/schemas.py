from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.modules.exams.models import ExamResultStatus, ExamStatus


# --- SCHEMAS DE ALTERNATIVA ---
class AlternativeCreate(BaseModel):
    text: str
    order: Optional[int] = 1
    is_correct: bool = False


class AlternativeUpdate(BaseModel):
    text: Optional[str] = None
    order: Optional[int] = None
    is_correct: Optional[bool] = None
    is_active: Optional[bool] = None


class AlternativePublic(BaseModel):
    id: int
    text: str
    order: int
    is_correct: bool  # Mantém para admin, será ocultado no frontend
    is_active: bool

    class Config:
        from_attributes = True


class AlternativeStudentPublic(BaseModel):
    """Versão para estudante - sem revelar a resposta correta"""
    id: int
    text: str
    order: int

    class Config:
        from_attributes = True


# --- SCHEMAS DE QUESTÃO ---
class QuestionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    order: Optional[int] = 1
    alternatives: List[AlternativeCreate] = []


class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class QuestionPublic(BaseModel):
    id: int
    title: str
    description: Optional[str]
    order: int
    is_active: bool
    exam_id: int
    alternatives: List[AlternativePublic] = []

    class Config:
        from_attributes = True


class QuestionStudentPublic(BaseModel):
    """Versão para estudante - estrutura otimizada para sidebar"""
    id: int
    title: str
    description: Optional[str]
    order: int
    alternatives: List[AlternativeStudentPublic] = []

    class Config:
        from_attributes = True


# --- SCHEMAS DE EXAME ---
class ExamCreate(BaseModel):
    title: str
    description: Optional[str] = None
    passing_score: Optional[float] = 70.0
    time_limit_minutes: Optional[int] = None
    questions: List[QuestionCreate] = []


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    passing_score: Optional[float] = None
    time_limit_minutes: Optional[int] = None
    is_active: Optional[bool] = None


class ExamPublic(BaseModel):
    id: int
    title: str
    description: Optional[str]
    passing_score: float
    time_limit_minutes: Optional[int]
    is_active: bool
    module_id: int

    class Config:
        from_attributes = True


class ExamDetailPublic(ExamPublic):
    """Estrutura completa do exame com questões (para admin)"""
    questions: List[QuestionPublic] = []


class ExamStudentPublic(BaseModel):
    """Estrutura otimizada para frontend - sem respostas corretas"""
    id: int
    title: str
    description: Optional[str]
    passing_score: float
    time_limit_minutes: Optional[int]
    questions: List[QuestionStudentPublic] = []

    class Config:
        from_attributes = True


# --- SCHEMAS DE RESPOSTA DO ALUNO ---
class StudentAnswerCreate(BaseModel):
    question_id: int
    alternative_id: Optional[int] = None
    answer_time_seconds: Optional[int] = None


class StudentAnswerPublic(BaseModel):
    id: int
    question_id: int
    alternative_id: Optional[int]
    answer_time_seconds: Optional[int]

    class Config:
        from_attributes = True


# --- SCHEMAS DE RESULTADO ---
class ExamResultCreate(BaseModel):
    """Submissão das respostas do exame pelo aluno"""
    exam_id: int
    answers: List[StudentAnswerCreate]
    total_time_seconds: int


class ExamResultPublic(BaseModel):
    id: int
    exam_id: int
    score: float
    status: ExamResultStatus
    total_time_seconds: int
    started_at: datetime
    completed_at: datetime

    class Config:
        from_attributes = True


class ExamResultDetailPublic(ExamResultPublic):
    """Resultado detalhado com respostas"""
    answers: List[StudentAnswerPublic] = []
    exam: ExamPublic
