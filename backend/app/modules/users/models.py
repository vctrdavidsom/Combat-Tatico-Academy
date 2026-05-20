from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime, date
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    STUDENT = "STUDENT"

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Dados Pessoais
    full_name: str
    cpf: str = Field(unique=True, index=True) # Obrigatório e único
    birth_date: Optional[date] = None         # Opcional (sem *)
    
    # Contato
    email: str = Field(unique=True, index=True)
    phone: Optional[str] = None
    
    # Endereço
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    
    # Sistema
    hashed_password: str
    role: UserRole = Field(default=UserRole.STUDENT)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)  