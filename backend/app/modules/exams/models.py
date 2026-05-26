from typing import Optional, List, TYPE_CHECKING, Any
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB

if TYPE_CHECKING:
	from app.modules.courses.models import Module, Course
	from app.modules.users.models import User


class Exam(SQLModel, table=True):
	id: Optional[int] = Field(default=None, primary_key=True)
	title: str
	type: str = Field(default="activity")
	draw_count: int = Field(default=0)
	attempt_limit: int = Field(default=0)
	total_points: Optional[float] = None
	cut_score: Optional[int] = None
	duration_minutes: Optional[int] = None
	start_date: Optional[datetime] = None
	due_date: Optional[datetime] = None
	is_active: bool = Field(default=True)

	module_id: int = Field(foreign_key="module.id", ondelete="CASCADE")
	module: "Module" = Relationship(back_populates="exams")

	questions: List["Question"] = Relationship(back_populates="exam", cascade_delete=True)


class Question(SQLModel, table=True):
	id: Optional[int] = Field(default=None, primary_key=True)
	type: str = Field(default="multiple")
	prompt: str
	weight: Optional[float] = Field(default=1)
	order: int = Field(default=1)

	exam_id: int = Field(foreign_key="exam.id", ondelete="CASCADE")
	exam: Exam = Relationship(back_populates="questions")

	alternatives: List["Alternative"] = Relationship(back_populates="question", cascade_delete=True)


class Alternative(SQLModel, table=True):
	id: Optional[int] = Field(default=None, primary_key=True)
	text: str
	is_correct: bool = Field(default=False)

	question_id: int = Field(foreign_key="question.id", ondelete="CASCADE")
	question: Question = Relationship(back_populates="alternatives")


class ExamLog(SQLModel, table=True):
	id: Optional[int] = Field(default=None, primary_key=True)
	user_id: int = Field(foreign_key="user.id", ondelete="CASCADE")
	exam_id: int = Field(foreign_key="exam.id", ondelete="CASCADE")
	course_id: Optional[int] = Field(default=None, foreign_key="course.id", ondelete="SET NULL")
	module_id: Optional[int] = Field(default=None, foreign_key="module.id", ondelete="SET NULL")

	answers: Any = Field(sa_column=Column(JSONB))
	score_percent: float
	score_points: Optional[float] = None
	total_points: Optional[float] = None
	has_essay: bool = Field(default=False)
	status: str = Field(default="pendente")
	result: str = Field(default="nao_apto")
	submitted_at: datetime = Field(default_factory=datetime.utcnow)
	attempt_number: int = Field(default=1)
	max_attempts: Optional[int] = None
	cut_score: Optional[int] = None
	feedback: Optional[str] = None

	exam: "Exam" = Relationship()
