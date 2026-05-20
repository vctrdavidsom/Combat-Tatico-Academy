from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.core.database import get_session
from app.modules.users.dependencies import get_current_admin
from app.modules.users.models import User
from app.modules.library.models import LibraryMaterial
from app.modules.library.schemas import (
    LibraryMaterialCreate, LibraryMaterialUpdate, LibraryMaterialPublic
)

router = APIRouter(prefix="/admin", tags=["Library - Admin"])


# ==========================================
# CRUD - MATERIAIS DA BIBLIOTECA
# ==========================================

@router.post("/materials", response_model=LibraryMaterialPublic, status_code=status.HTTP_201_CREATED)
def create_library_material(
    material_in: LibraryMaterialCreate,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Cria um novo material na biblioteca global."""
    db_material = LibraryMaterial.model_validate(material_in)
    session.add(db_material)
    session.commit()
    session.refresh(db_material)
    return db_material


@router.get("/materials", response_model=list[LibraryMaterialPublic])
def admin_list_materials(
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Lista todos os materiais da biblioteca (inclui ativos e inativos)."""
    statement = select(LibraryMaterial)
    return session.exec(statement).all()


@router.get("/materials/{material_id}", response_model=LibraryMaterialPublic)
def admin_get_material(
    material_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Busca os detalhes de um material específico para edição."""
    material = session.get(LibraryMaterial, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado.")
    return material


@router.patch("/materials/{material_id}", response_model=LibraryMaterialPublic)
def update_library_material(
    material_id: int,
    material_in: LibraryMaterialUpdate,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Atualiza dados de um material específico."""
    db_material = session.get(LibraryMaterial, material_id)
    if not db_material:
        raise HTTPException(status_code=404, detail="Material não encontrado.")
    
    material_data = material_in.model_dump(exclude_unset=True)
    for key, value in material_data.items():
        setattr(db_material, key, value)
    
    session.add(db_material)
    session.commit()
    session.refresh(db_material)
    return db_material


@router.delete("/materials/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_library_material(
    material_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Remove um material da biblioteca."""
    db_material = session.get(LibraryMaterial, material_id)
    if not db_material:
        raise HTTPException(status_code=404, detail="Material não encontrado.")
    
    session.delete(db_material)
    session.commit()
    return None
