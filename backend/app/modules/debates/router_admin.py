from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.database import get_session
from app.modules.users.dependencies import get_current_admin
from app.modules.users.models import User
from app.modules.lessons.models import Lesson
from app.modules.debates.models import DebateMessage
from app.modules.debates.schemas import DebateMessagePublic, DebateMessageUpdate

router = APIRouter(prefix="/admin", tags=["Debates - Admin"])


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
def list_messages_for_admin(
    lesson_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula nao encontrada.")

    statement = (
        select(DebateMessage, User)
        .join(User, User.id == DebateMessage.user_id)
        .where(DebateMessage.lesson_id == lesson_id)
        .order_by(DebateMessage.created_at.asc())
    )
    rows = session.exec(statement).all()
    return [build_public(message, user.full_name) for message, user in rows]


@router.patch("/messages/{message_id}", response_model=DebateMessagePublic)
def update_message_visibility(
    message_id: int,
    payload: DebateMessageUpdate,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    message = session.get(DebateMessage, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Mensagem nao encontrada.")

    message_data = payload.model_dump(exclude_unset=True)
    for key, value in message_data.items():
        setattr(message, key, value)

    session.add(message)
    session.commit()
    session.refresh(message)

    user = session.get(User, message.user_id)
    user_name = user.full_name if user else "Usuario"
    return build_public(message, user_name)


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    message = session.get(DebateMessage, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Mensagem nao encontrada.")

    session.delete(message)
    session.commit()
    return None
