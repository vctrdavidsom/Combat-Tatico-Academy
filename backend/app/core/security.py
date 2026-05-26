from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

# 1. Configuração do Hash de Senha (Bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 2. Funções de Hash
def get_password_hash(password: str) -> str:
    """Transforma a senha em um hash seguro, respeitando o limite do Bcrypt."""
    # O Bcrypt tem um limite físico de 72 bytes. 
    # Cortamos aqui para evitar que o sistema trave na criação do admin.
    safe_password = password[:72] 
    return pwd_context.hash(safe_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha digitada bate com o hash salvo."""
    return pwd_context.verify(plain_password, hashed_password)

# 3. Criação do Token de Acesso (JWT)
def create_access_token(
    subject: Union[str, Any],
    expires_delta: timedelta = None,
    extra_claims: dict[str, Any] | None = None
) -> str:
    """Gera um token assinado para o usuário."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    # O 'sub' (subject) geralmente é o ID ou Email do usuário
    to_encode = {"exp": expire, "sub": str(subject)}
    if extra_claims:
        to_encode.update(extra_claims)
    
    # Assina o token com a nossa SECRET_KEY do .env
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt