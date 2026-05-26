from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.core.database import get_session
from app.modules.users.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.lessons.models import Lesson
from app.modules.lessons.schemas import LessonPublic

router = APIRouter(prefix="/student", tags=["Lessons - Student"])


@router.get("/modules/{module_id}/lessons", response_model=list[LessonPublic])
def list_lessons_for_student(
	module_id: int,
	session: Session = Depends(get_session),
	current_user: User = Depends(get_current_user)
):
	statement = (
		select(Lesson)
		.where(Lesson.module_id == module_id)
		.where(Lesson.is_active == True)
		.order_by(Lesson.order)
	)
	return session.exec(statement).all()
