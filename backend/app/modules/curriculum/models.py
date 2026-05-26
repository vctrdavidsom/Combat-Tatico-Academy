from typing import Optional, List, Any
from datetime import datetime
from sqlmodel import SQLModel, Field
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB


class LibraryItem(SQLModel, table=True):
	id: Optional[int] = Field(default=None, primary_key=True)
	title: str
	type: str = Field(default="pdf")
	url: str
	tags: Any = Field(default_factory=list, sa_column=Column(JSONB))
	updated_at: datetime = Field(default_factory=datetime.utcnow)
