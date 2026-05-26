from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class LibraryItemCreate(BaseModel):
	title: str
	type: str = "pdf"
	url: str
	tags: List[str] = []


class LibraryItemUpdate(BaseModel):
	title: Optional[str] = None
	type: Optional[str] = None
	url: Optional[str] = None
	tags: Optional[List[str]] = None


class LibraryItemPublic(BaseModel):
	id: int
	title: str
	type: str
	url: str
	tags: List[str]
	updated_at: datetime

	class Config:
		from_attributes = True
