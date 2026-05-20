from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.database import get_session
from app.modules.users.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.courses.models import Course
from app.modules.courses.schemas import CoursePublic, CourseDetailPublic

router = APIRouter(prefix="/student", tags=["Courses - Student"])

@router.get("/courses", response_model=list[CoursePublic])
def list_student_courses(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Lista todos os cursos disponíveis para o aluno logado."""
    statement = select(Course).where(Course.is_active == True)
    return session.exec(statement).all()

@router.get("/courses/{course_id}", response_model=CourseDetailPublic)
def get_student_course_details(
    course_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Retorna o conteúdo programático (módulos) do curso para o aluno."""
    course = session.get(Course, course_id)
    if not course or not course.is_active:
        raise HTTPException(status_code=404, detail="Curso não disponível.")
    return course