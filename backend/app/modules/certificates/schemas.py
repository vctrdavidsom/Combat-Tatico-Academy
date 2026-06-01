from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CertificateCreate(BaseModel):
    file_name: str
    file_content_base64: str

class CertificatePublic(BaseModel):
    id: int
    file_name: str
    uploaded_at: datetime
    user_id: int
    course_id: int

    class Config:
        from_attributes = True
