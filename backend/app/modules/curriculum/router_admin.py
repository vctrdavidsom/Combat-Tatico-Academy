from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.core.database import get_session
from app.modules.users.dependencies import get_current_admin
from app.core.links import normalize_google_drive_download_url
from app.modules.users.models import User
from app.modules.curriculum.models import LibraryItem
from app.modules.curriculum.schemas import LibraryItemCreate, LibraryItemUpdate, LibraryItemPublic
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["Library - Admin"])


@router.post("/items", response_model=LibraryItemPublic, status_code=status.HTTP_201_CREATED)
def create_library_item(
	item_in: LibraryItemCreate,
	session: Session = Depends(get_session),
	current_admin: User = Depends(get_current_admin)
):
	normalized_url = (
		normalize_google_drive_download_url(item_in.url)
		if item_in.type == "pdf"
		else item_in.url
	)
	item = LibraryItem(
		title=item_in.title,
		type=item_in.type,
		url=normalized_url,
		tags=item_in.tags,
		updated_at=datetime.utcnow()
	)
	session.add(item)
	session.commit()
	session.refresh(item)
	return item


@router.get("/items", response_model=list[LibraryItemPublic])
def list_library_items(
	session: Session = Depends(get_session),
	current_admin: User = Depends(get_current_admin)
):
	statement = select(LibraryItem).order_by(LibraryItem.updated_at.desc())
	return session.exec(statement).all()


@router.patch("/items/{item_id}", response_model=LibraryItemPublic)
def update_library_item(
	item_id: int,
	item_in: LibraryItemUpdate,
	session: Session = Depends(get_session),
	current_admin: User = Depends(get_current_admin)
):
	item = session.get(LibraryItem, item_id)
	if not item:
		raise HTTPException(status_code=404, detail="Item nao encontrado.")

	item_data = item_in.model_dump(exclude_unset=True)
	next_type = item_in.type if item_in.type is not None else item.type
	if "url" in item_data and next_type == "pdf":
		item_data["url"] = normalize_google_drive_download_url(item_data.get("url"))
	if "url" not in item_data and next_type == "pdf":
		item_data["url"] = normalize_google_drive_download_url(item.url)
	for key, value in item_data.items():
		setattr(item, key, value)
	item.updated_at = datetime.utcnow()

	session.add(item)
	session.commit()
	session.refresh(item)
	return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_library_item(
	item_id: int,
	session: Session = Depends(get_session),
	current_admin: User = Depends(get_current_admin)
):
	item = session.get(LibraryItem, item_id)
	if not item:
		raise HTTPException(status_code=404, detail="Item nao encontrado.")
	session.delete(item)
	session.commit()
	return None
