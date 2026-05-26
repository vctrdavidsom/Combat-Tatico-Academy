from pydantic import BaseModel
from typing import Optional, List, Dict, Union, Any
from datetime import datetime


class QuestionCreate(BaseModel):
	type: str = "multiple"
	prompt: str
	options: List[str] = []
	correct_index: Optional[int] = None
	weight: Optional[float] = 1
	order: Optional[int] = 1


class ExamCreate(BaseModel):
	title: str
	type: str = "activity"
	draw_count: int = 0
	attempt_limit: int = 0
	total_points: Optional[float] = None
	cut_score: Optional[int] = None
	duration_minutes: Optional[int] = None
	start_date: Optional[datetime] = None
	due_date: Optional[datetime] = None
	is_active: Optional[bool] = True
	questions: List[QuestionCreate] = []


class ExamUpdate(BaseModel):
	title: Optional[str] = None
	type: Optional[str] = None
	draw_count: Optional[int] = None
	attempt_limit: Optional[int] = None
	total_points: Optional[float] = None
	cut_score: Optional[int] = None
	duration_minutes: Optional[int] = None
	start_date: Optional[datetime] = None
	due_date: Optional[datetime] = None
	is_active: Optional[bool] = None
	questions: Optional[List[QuestionCreate]] = None


class QuestionPublic(BaseModel):
	id: int
	type: str
	prompt: str
	options: List[str] = []
	correct_index: Optional[int] = None
	weight: Optional[float] = None
	order: int


class ExamPublic(BaseModel):
	id: int
	title: str
	type: str
	draw_count: int
	attempt_limit: int
	total_points: Optional[float]
	cut_score: Optional[int]
	duration_minutes: Optional[int]
	start_date: Optional[datetime]
	due_date: Optional[datetime]
	is_active: bool
	module_id: int
	questions: List[QuestionPublic] = []


class ExamLogCreate(BaseModel):
	answers: Dict[int, Union[str, int]]
	score_percent: float
	score_points: Optional[float] = None
	total_points: Optional[float] = None
	has_essay: bool = False
	max_attempts: Optional[int] = None
	cut_score: Optional[int] = None


class ExamLogPublic(BaseModel):
	id: int
	user_id: int
	exam_id: int
	course_id: Optional[int]
	module_id: Optional[int]
	answers: Any
	score_percent: float
	score_points: Optional[float]
	total_points: Optional[float]
	has_essay: bool
	status: str
	result: str
	submitted_at: datetime
	attempt_number: int
	max_attempts: Optional[int]
	cut_score: Optional[int]
	feedback: Optional[str]

	class Config:
		from_attributes = True


class ExamLogUpdate(BaseModel):
	score_percent: Optional[float] = None
	score_points: Optional[float] = None
	total_points: Optional[float] = None
	status: Optional[str] = None
	result: Optional[str] = None
	feedback: Optional[str] = None
