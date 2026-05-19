from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlmodel import Session
from app.core.config import settings
from app.core.database import get_session
from app.modules.users.models import User, UserRole

# Define o endpoint onde o OAuth2 vai buscar o token (nosso login)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")

def get_current_user(
    session: Session = Depends(get_session), 
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decodifica o payload do JWT
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Busca o usuário no banco para garantir que ele ainda existe/está ativo
    user = session.query(User).filter(User.email == email).first()
    if user is None or not user.is_active:
        raise credentials_exception
        
    return user

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Garante que o usuário autenticado tenha permissão de Admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="O usuário não tem privilégios suficientes"
        )
    return current_user