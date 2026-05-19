from pydantic import BaseModel, EmailStr
from app.modules.users.models import UserRole

# payload de entrada para criação/registro
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.STUDENT

# payload de entrada para o login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# payload de saída (remover dados sensíveis)
class UserPublic(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole

    class Config:
        from_attributes = True

# estrutura de retorno do login (padrão oauth2)
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"