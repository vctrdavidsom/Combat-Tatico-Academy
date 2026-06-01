from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date
from app.modules.users.models import UserRole

# payload de entrada para criação/registro
class UserCreate(BaseModel):
    full_name: str
    cpf: str
    birth_date: Optional[date] = None
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
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
    cpf: str
    birth_date: Optional[date]
    email: EmailStr
    phone: Optional[str]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True

# estrutura de retorno do login (padrão oauth2)
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserUpdate(BaseModel):
    """Campos que o próprio utilizador pode atualizar no seu perfil."""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    password: Optional[str] = None

class UserAdminUpdate(UserUpdate):
    """Campos que apenas o Administrador pode alterar num utilizador."""
    email: Optional[EmailStr] = None
    cpf: Optional[str] = None
    birth_date: Optional[date] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class UserCourseSync(BaseModel):
    """Recebe a lista de IDs de cursos que devem ficar liberados para o aluno."""
    course_ids: List[int]

class AdminCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class AdminCreateResponse(BaseModel):
    user: UserPublic
    temporary_password: Optional[str] = None