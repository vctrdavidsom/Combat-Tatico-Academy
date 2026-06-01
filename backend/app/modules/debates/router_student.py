from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.database import get_session
from app.modules.users.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.lessons.models import Lesson
from app.modules.courses.models import Enrollment
from app.modules.debates.models import DebateMessage
from app.modules.debates.schemas import DebateMessageCreate, DebateMessagePublic

router = APIRouter(prefix="/student", tags=["Debates - Student"])


def ensure_lesson_access(lesson_id: int, session: Session, current_user: User) -> Lesson:
    lesson = session.get(Lesson, lesson_id)
    if not lesson or not lesson.is_active:
        raise HTTPException(status_code=404, detail="Aula nao encontrada.")

    course_id = lesson.module.course_id if lesson.module else None
    if course_id is None:
        raise HTTPException(status_code=404, detail="Curso nao encontrado.")

    enrollment = session.exec(
        select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_id
        )
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="Curso nao liberado para este aluno.")

    return lesson


def build_public(message: DebateMessage, user_name: str) -> DebateMessagePublic:
    return DebateMessagePublic(
        id=message.id,
        lesson_id=message.lesson_id,
        user_id=message.user_id,
        user_name=user_name,
        content=message.content,
        created_at=message.created_at,
        is_visible=message.is_visible
    )


@router.get("/lessons/{lesson_id}/messages", response_model=list[DebateMessagePublic])
def list_lesson_messages(
    lesson_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    ensure_lesson_access(lesson_id, session, current_user)

    statement = (
        select(DebateMessage, User)
        .join(User, User.id == DebateMessage.user_id)
        .where(DebateMessage.lesson_id == lesson_id)
        .where(DebateMessage.is_visible == True)
        .order_by(DebateMessage.created_at.asc())
    )
    rows = session.exec(statement).all()
    return [build_public(message, user.full_name) for message, user in rows]


@router.post(
    "/lessons/{lesson_id}/messages",
    response_model=DebateMessagePublic,
    status_code=status.HTTP_201_CREATED
)
def create_lesson_message(
    lesson_id: int,
    payload: DebateMessageCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    ensure_lesson_access(lesson_id, session, current_user)

    content = (payload.content or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Mensagem nao pode estar vazia.")

    message = DebateMessage(
        lesson_id=lesson_id,
        user_id=current_user.id,
        content=content
    )
    session.add(message)
    session.commit()
    session.refresh(message)
    return build_public(message, current_user.full_name)
