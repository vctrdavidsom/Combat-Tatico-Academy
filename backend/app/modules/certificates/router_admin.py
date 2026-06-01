from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.core.database import get_session
from app.modules.users.dependencies import get_current_admin
from app.modules.users.models import User
from app.modules.courses.models import Course
from app.modules.certificates.models import Certificate
from app.modules.certificates.schemas import CertificateCreate, CertificatePublic

router = APIRouter(prefix="/admin", tags=["Certificates - Admin"])

@router.post("/users/{user_id}/courses/{course_id}/certificates", response_model=CertificatePublic, status_code=status.HTTP_201_CREATED)
def upload_certificate(
    user_id: int,
    course_id: int,
    certificate_in: CertificateCreate,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Aluno nao encontrado.")

    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Curso nao encontrado.")
    
    db_certificate = Certificate.model_validate({
        **certificate_in.model_dump(),
        "user_id": user_id,
        "course_id": course_id
    })
    session.add(db_certificate)
    session.commit()
    session.refresh(db_certificate)
    return db_certificate

@router.get("/users/{user_id}/certificates", response_model=list[CertificatePublic])
def list_user_certificates(
    user_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Aluno nao encontrado.")
    
    statement = select(Certificate).where(Certificate.user_id == user_id)
    certificates = session.exec(statement).all()
    return certificates

@router.delete("/certificates/{certificate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certificate(
    certificate_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    certificate = session.get(Certificate, certificate_id)
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificado nao encontrado.")
    
    session.delete(certificate)
    session.commit()
    return None
