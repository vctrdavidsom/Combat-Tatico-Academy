from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.core.database import get_session
from app.modules.users.dependencies import get_current_admin
from app.modules.users.models import User
from app.modules.courses.models import Module
from app.modules.lessons.models import Lesson
from app.modules.lessons.schemas import LessonCreate, LessonUpdate, LessonPublic

router = APIRouter(prefix="/admin", tags=["Lessons - Admin"])


@router.post("/modules/{module_id}/lessons", response_model=LessonPublic, status_code=status.HTTP_201_CREATED)
def create_lesson(
	module_id: int,
	lesson_in: LessonCreate,
	session: Session = Depends(get_session),
	current_admin: User = Depends(get_current_admin)
):
	module = session.get(Module, module_id)
	if not module:
		raise HTTPException(status_code=404, detail="Modulo nao encontrado.")

	db_lesson = Lesson(
		title=lesson_in.title,
		type=lesson_in.type,
		video_id=lesson_in.video_id,
		duration=lesson_in.duration,
		material_pdf_url=lesson_in.material_pdf_url,
		material_link_url=lesson_in.material_link_url,
		order=lesson_in.order or 1,
		is_active=lesson_in.is_active if lesson_in.is_active is not None else True,
		module_id=module_id
	)
	session.add(db_lesson)
	session.commit()
	session.refresh(db_lesson)
	return db_lesson


@router.get("/modules/{module_id}/lessons", response_model=list[LessonPublic])
def list_lessons_by_module(
	module_id: int,
	session: Session = Depends(get_session),
	current_admin: User = Depends(get_current_admin)
):
	statement = select(Lesson).where(Lesson.module_id == module_id).order_by(Lesson.order)
	return session.exec(statement).all()


@router.get("/lessons/{lesson_id}", response_model=LessonPublic)
def get_lesson(
	lesson_id: int,
	session: Session = Depends(get_session),
	current_admin: User = Depends(get_current_admin)
):
	lesson = session.get(Lesson, lesson_id)
	if not lesson:
		raise HTTPException(status_code=404, detail="Aula nao encontrada.")
	return lesson


@router.patch("/lessons/{lesson_id}", response_model=LessonPublic)
def update_lesson(
	lesson_id: int,
	lesson_in: LessonUpdate,
	session: Session = Depends(get_session),
	current_admin: User = Depends(get_current_admin)
):
	lesson = session.get(Lesson, lesson_id)
	if not lesson:
		raise HTTPException(status_code=404, detail="Aula nao encontrada.")

	lesson_data = lesson_in.model_dump(exclude_unset=True)
	for key, value in lesson_data.items():
		setattr(lesson, key, value)

	session.add(lesson)
	session.commit()
	session.refresh(lesson)
	return lesson


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson(
	lesson_id: int,
	session: Session = Depends(get_session),
	current_admin: User = Depends(get_current_admin)
):
	lesson = session.get(Lesson, lesson_id)
	if not lesson:
		raise HTTPException(status_code=404, detail="Aula nao encontrada.")
	session.delete(lesson)
	session.commit()
	return None
