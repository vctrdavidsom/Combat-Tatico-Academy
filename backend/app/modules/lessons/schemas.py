from pydantic import BaseModel
from typing import Optional


class LessonCreate(BaseModel):
	title: str
	type: str = "video"
	video_id: Optional[str] = None
	duration: Optional[str] = None
	material_pdf_url: Optional[str] = None
	material_link_url: Optional[str] = None
	order: Optional[int] = 1
	is_active: Optional[bool] = True


class LessonUpdate(BaseModel):
	title: Optional[str] = None
	type: Optional[str] = None
	video_id: Optional[str] = None
	duration: Optional[str] = None
	material_pdf_url: Optional[str] = None
	material_link_url: Optional[str] = None
	order: Optional[int] = None
	is_active: Optional[bool] = None


class LessonPublic(BaseModel):
	id: int
	title: str
	type: str
	video_id: Optional[str]
	duration: Optional[str]
	material_pdf_url: Optional[str]
	material_link_url: Optional[str]
	order: int
	is_active: bool
	module_id: int

	class Config:
		from_attributes = True
