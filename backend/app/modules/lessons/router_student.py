from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.database import get_session
from app.modules.users.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.lessons.models import Lesson
from app.modules.lessons.schemas import LessonPublic

router = APIRouter(prefix="/student", tags=["Lessons - Student"])


@router.get("/modules/{module_id}/lessons", response_model=list[LessonPublic])
def list_module_lessons(
    module_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Lista todas as aulas de um módulo específico para o aluno."""
    statement = select(Lesson).where(
        (Lesson.module_id == module_id) & (Lesson.is_active == True)
    ).order_by(Lesson.order)
    return session.exec(statement).all()


@router.get("/lessons/{lesson_id}", response_model=LessonPublic)
def get_student_lesson(
    lesson_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Retorna o conteúdo de uma aula específica para o aluno."""
    lesson = session.get(Lesson, lesson_id)
    if not lesson or not lesson.is_active:
        raise HTTPException(status_code=404, detail="Aula não disponível.")
    return lesson
