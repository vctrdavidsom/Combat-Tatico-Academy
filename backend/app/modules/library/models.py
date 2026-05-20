from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime


class LibraryMaterial(SQLModel, table=True):
    """Material da biblioteca global acessível a todos os alunos."""
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    material_type: str  # e.g., "PDF", "LINK", "VIDEO", etc.
    url: str
    file_size_mb: Optional[float] = None  # Para PDFs
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
