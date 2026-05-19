from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.security import get_password_hash, verify_password, create_access_token
from app.modules.users.models import User
from app.modules.users.schemas import UserCreate, UserPublic, UserLogin, Token

# Seus roteadores vazios atuais (apenas para manter a árvore de diretórios acoplada)
from app.modules.users.router_admin import router as admin_router
from app.modules.users.router_student import router as student_router

router = APIRouter(prefix="/users", tags=["Users"])

# --- ROTAS PÚBLICAS ---

@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, session: Session = Depends(get_session)):
    # Evita duplicação de e-mail no banco
    statement = select(User).where(User.email == user_in.email)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="E-mail já cadastrado no sistema."
        )

    db_user = User(
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, session: Session = Depends(get_session)):
    statement = select(User).where(User.email == user_credentials.email)
    user = session.exec(statement).first()

    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Gera o JWT assinando com o e-mail (ou o ID se preferir)
    access_token = create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer"}


# --- ACOPLAMENTO DOS SUB-MÓDULOS ---
# Rotas específicas dentro de router_admin usarão o prefixo /users/admin
router.include_router(admin_router)
# Rotas específicas dentro de router_student usarão o prefixo /users/student
router.include_router(student_router)