from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime

# 1. Definição Tática de Papéis
class UserRole(str, Enum):
    ADMIN = "admin"
    STUDENT = "student"

# 2. A Tabela de Usuários
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    email: str = Field(unique=True, index=True)
    hashed_password: str
    role: UserRole = Field(default=UserRole.STUDENT)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Dica: O SQLModel já entende que 'table=True' cria a tabela no Neon