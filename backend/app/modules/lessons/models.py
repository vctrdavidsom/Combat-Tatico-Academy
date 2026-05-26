from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
	from app.modules.courses.models import Module


class Lesson(SQLModel, table=True):
	id: Optional[int] = Field(default=None, primary_key=True)
	title: str
	type: str = Field(default="video")
	video_id: Optional[str] = None
	duration: Optional[str] = None
	material_pdf_url: Optional[str] = None
	material_link_url: Optional[str] = None
	order: int = Field(default=1)
	is_active: bool = Field(default=True)

	module_id: int = Field(foreign_key="module.id", ondelete="CASCADE")
	module: "Module" = Relationship(back_populates="lessons")
