from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.core.database import get_session
from app.modules.users.dependencies import get_current_admin
from app.modules.users.models import User
from app.modules.users.schemas import UserPublic, UserAdminUpdate
from sqlmodel import delete
from app.modules.courses.models import Enrollment, Course
from app.modules.users.schemas import UserCourseSync

router = APIRouter(prefix="/admin", tags=["Users"])

@router.get("/", response_model=list[UserPublic])
def list_all_users(
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Lista todos os utilizadores registados na plataforma (Apenas Admin)."""
    statement = select(User)
    return session.exec(statement).all()


@router.get("/{user_id}", response_model=UserPublic)
def get_user_by_id(
    user_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Procura os detalhes de um utilizador específico pelo ID (Apenas Admin)."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado.")
    return user


@router.patch("/{user_id}", response_model=UserPublic)
def admin_update_user(
    user_id: int,
    user_in: UserAdminUpdate,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Modifica o estado, cargo ou dados de um utilizador (Apenas Admin)."""
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado.")
    
    # Atualiza apenas os campos enviados no corpo da requisição
    user_data = user_in.model_dump(exclude_unset=True)
    for key, value in user_data.items():
        setattr(db_user, key, value)
        
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.get("/{user_id}/courses", response_model=list[int])
def get_user_enrolled_course_ids(
    user_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """
    Retorna um array apenas com os IDs dos cursos liberados para o aluno.
    Ideal para o front-end saber quais chaves seletoras devem aparecer ligadas.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")

    statement = select(Enrollment.course_id).where(Enrollment.user_id == user_id)
    enrolled_ids = session.exec(statement).all()
    
    return enrolled_ids


@router.put("/{user_id}/courses/sync", status_code=status.HTTP_200_OK)
def sync_user_courses(
    user_id: int,
    sync_data: UserCourseSync,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """
    Sincroniza os cursos liberados para um aluno. 
    O front-end envia um array com os IDs dos cursos que estão com a chave "Ligada".
    """
    # 1. Verifica se o aluno existe
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")

    # 2. Apaga todas as liberações antigas deste aluno no banco
    statement = delete(Enrollment).where(Enrollment.user_id == user_id)
    session.exec(statement)
    
    # 3. Se a lista estiver vazia (desligou todas as chaves), apenas commita a limpeza
    if not sync_data.course_ids:
        session.commit()
        return {"message": "Todos os cursos foram bloqueados para este aluno."}

    # 4. Verifica se todos os IDs de cursos enviados realmente existem no banco
    valid_courses = session.exec(
        select(Course.id).where(Course.id.in_(sync_data.course_ids))
    ).all()
    
    if len(valid_courses) != len(sync_data.course_ids):
        raise HTTPException(status_code=400, detail="Um ou mais cursos selecionados não existem.")

    # 5. Cria as novas liberações baseadas nas chaves ligadas
    new_enrollments = [
        Enrollment(user_id=user_id, course_id=course_id) 
        for course_id in sync_data.course_ids
    ]
    
    session.add_all(new_enrollments)
    session.commit()
    
    return {"message": f"Cursos liberados atualizados com sucesso. Total: {len(new_enrollments)}"}