from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# --- SCHEMAS DE MATERIAL DA BIBLIOTECA ---
class LibraryMaterialCreate(BaseModel):
    title: str
    description: Optional[str] = None
    material_type: str  # e.g., "PDF", "LINK", "VIDEO"
    url: str
    file_size_mb: Optional[float] = None


class LibraryMaterialUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    material_type: Optional[str] = None
    url: Optional[str] = None
    file_size_mb: Optional[float] = None
    is_active: Optional[bool] = None


class LibraryMaterialPublic(BaseModel):
    id: int
    title: str
    description: Optional[str]
    material_type: str
    url: str
    file_size_mb: Optional[float]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
