from sqlmodel import Session, select
from app.core.config import settings
from app.core.security import get_password_hash
from app.modules.users.models import User, UserRole

def create_first_admin(session: Session):
    # Verifica se já existe QUALQUER admin no sistema
    statement = select(User).where(User.role == UserRole.ADMIN)
    admin_exists = session.exec(statement).first()

    if not admin_exists:
        print("Semente Tática: Criando administrador padrão...")
        hashed_pwd = get_password_hash(settings.FIRST_ADMIN_PASSWORD)
        
        first_admin = User(
            full_name="Administrador Root",
            email=settings.FIRST_ADMIN_EMAIL,
            hashed_password=hashed_pwd,
            role=UserRole.ADMIN
        )
        
        session.add(first_admin)
        session.commit()
        print(f"Admin criado com sucesso: {settings.FIRST_ADMIN_EMAIL}")
    else:
        print("Semente Tática: Administrador já existe. Pulando...")