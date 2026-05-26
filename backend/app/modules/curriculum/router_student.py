from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.core.database import get_session
from app.modules.users.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.curriculum.models import LibraryItem
from app.modules.curriculum.schemas import LibraryItemPublic

router = APIRouter(prefix="/student", tags=["Library - Student"])


@router.get("/items", response_model=list[LibraryItemPublic])
def list_library_items_for_student(
	session: Session = Depends(get_session),
	current_user: User = Depends(get_current_user)
):
	statement = select(LibraryItem).order_by(LibraryItem.updated_at.desc())
	return session.exec(statement).all()
