from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.core.database import get_session
from app.modules.users.dependencies import get_current_admin
from app.modules.users.models import User
from app.modules.courses.models import Course, Module
from app.modules.courses.schemas import (
    CourseCreate, CourseUpdate, CoursePublic, CourseDetailPublic,
    ModuleCreate, ModuleUpdate, ModulePublic
)

router = APIRouter(prefix="/admin", tags=["Courses - Admin"])

# ==========================================
# CRUD - CURSOS
# ==========================================

@router.post("/courses", response_model=CoursePublic, status_code=status.HTTP_201_CREATED)
def create_course(
    course_in: CourseCreate, 
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Cria um novo curso."""
    db_course = Course.model_validate(course_in)
    session.add(db_course)
    session.commit()
    session.refresh(db_course)
    return db_course


@router.get("/courses", response_model=list[CoursePublic])
def admin_list_courses(
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Lista todos os cursos para a tabela do painel (inclui ativos e inativos)."""
    statement = select(Course)
    return session.exec(statement).all()


@router.get("/courses/{course_id}", response_model=CourseDetailPublic)
def admin_get_course(
    course_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Busca os detalhes de um curso específico para edição."""
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")
    return course


@router.patch("/courses/{course_id}", response_model=CoursePublic)
def update_course(
    course_id: int,
    course_in: CourseUpdate,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Atualiza atributos de um curso parcialmente."""
    db_course = session.get(Course, course_id)
    if not db_course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")
    
    # Transforma os dados enviados em dicionário excluindo o que for None
    course_data = course_in.model_dump(exclude_unset=True)
    for key, value in course_data.items():
        setattr(db_course, key, value)
        
    session.add(db_course)
    session.commit()
    session.refresh(db_course)
    return db_course


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Remove um curso e todos os seus módulos vinculados (Cascade)."""
    db_course = session.get(Course, course_id)
    if not db_course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")
    
    session.delete(db_course)
    session.commit()
    return None


# ==========================================
# CRUD - MÓDULOS
# ==========================================

@router.post("/courses/{course_id}/modules", response_model=ModulePublic, status_code=status.HTTP_201_CREATED)
def create_module_for_course(
    course_id: int,
    module_in: ModuleCreate,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Cria um módulo dentro de um curso específico."""
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")
    
    db_module = Module(
        title=module_in.title,
        description=module_in.description,
        order=module_in.order,
        course_id=course_id
    )
    session.add(db_module)
    session.commit()
    session.refresh(db_module)
    return db_module


@router.patch("/modules/{module_id}", response_model=ModulePublic)
def update_module(
    module_id: int,
    module_in: ModuleUpdate,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Atualiza dados de um módulo específico."""
    db_module = session.get(Module, module_id)
    if not db_module:
        raise HTTPException(status_code=404, detail="Módulo não encontrado.")
    
    module_data = module_in.model_dump(exclude_unset=True)
    for key, value in module_data.items():
        setattr(db_module, key, value)
        
    session.add(db_module)
    session.commit()
    session.refresh(db_module)
    return db_module


@router.delete("/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(
    module_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Remove um módulo do sistema."""
    db_module = session.get(Module, module_id)
    if not db_module:
        raise HTTPException(status_code=404, detail="Módulo não encontrado.")
    
    session.delete(db_module)
    session.commit()
    return None