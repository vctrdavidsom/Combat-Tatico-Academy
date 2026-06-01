from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.security import verify_password, get_password_hash, create_access_token
from app.modules.users.models import User, UserRole
from app.modules.users.schemas import UserCreate, UserPublic, Token, UserUpdate
from app.modules.users.dependencies import get_current_user

# Sub-roteadores
from app.modules.users.router_admin import router as admin_router
from app.modules.users.router_student import router as student_router

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, session: Session = Depends(get_session)):
    # 1. Verifica se E-mail já existe
    statement_email = select(User).where(User.email == user_in.email)
    if session.exec(statement_email).first():
        raise HTTPException(status_code=400, detail="E-mail já registado.")
        
    # 2. Verifica se CPF já existe
    statement_cpf = select(User).where(User.cpf == user_in.cpf)
    if session.exec(statement_cpf).first():
        raise HTTPException(status_code=400, detail="CPF já registado.")

    # 3. Extrai todos os dados do schema (incluindo os novos como cpf, city, etc)
    user_data = user_in.model_dump()
    user_data["role"] = UserRole.STUDENT
    raw_password = user_data.pop("password") # Tira a senha pura para criar o hash
    
    # 4. Injeta os dados no modelo User de forma dinâmica
    db_user = User(**user_data, hashed_password=get_password_hash(raw_password))
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    statement = select(User).where(User.email == form_data.username)
    user = session.exec(statement).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        subject=user.email,
        extra_claims={"role": user.role.value}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserPublic)
def get_logged_user(current_user: User = Depends(get_current_user)):
    """Retorna os dados do próprio utilizador logado baseado no Token."""
    return current_user

# --- NOVA ROTA: ATUALIZAÇÃO DO PRÓPRIO PERFIL ---
@router.patch("/me", response_model=UserPublic)
def update_own_profile(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Permite ao utilizador logado atualizar os seus dados e palavra-passe."""
    user_data = user_in.model_dump(exclude_unset=True)
    
    # Se alterou o e-mail, verifica duplicidade
    if "email" in user_data and user_data["email"] != current_user.email:
        statement = select(User).where(User.email == user_data["email"])
        if session.exec(statement).first():
            raise HTTPException(status_code=400, detail="Este e-mail já está em uso.")
            
    # Se enviou uma nova password, gera o hash antes de guardar
    if "password" in user_data:
        current_user.hashed_password = get_password_hash(user_data["password"])
        user_data.pop("password") # Remove o texto puro para não dar conflito com setattr
        
    for key, value in user_data.items():
        setattr(current_user, key, value)
        
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user

# Acopla os roteadores específicos
router.include_router(admin_router)
router.include_router(student_router)