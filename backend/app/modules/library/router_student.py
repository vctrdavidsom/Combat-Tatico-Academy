from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.core.database import get_session
from app.modules.users.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.library.models import LibraryMaterial
from app.modules.library.schemas import LibraryMaterialPublic

router = APIRouter(prefix="/student", tags=["Library - Student"])


@router.get("/materials", response_model=list[LibraryMaterialPublic])
def list_library_materials(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Lista todos os materiais disponíveis na biblioteca global para o aluno."""
    statement = select(LibraryMaterial).where(LibraryMaterial.is_active == True)
    return session.exec(statement).all()
