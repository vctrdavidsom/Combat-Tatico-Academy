from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session, select
import base64

from app.core.database import get_session
from app.modules.users.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.certificates.models import Certificate
from app.modules.certificates.schemas import CertificatePublic

router = APIRouter(prefix="/student", tags=["Certificates - Student"])


def resolve_file_payload(payload: str) -> tuple[str, str]:
    if payload.startswith("data:"):
        header, encoded = payload.split(",", 1)
        content_type = header.split(";")[0].split(":", 1)[1] if ":" in header else "application/pdf"
        return encoded, content_type
    return payload, "application/pdf"


@router.get("/certificates", response_model=list[CertificatePublic])
def list_my_certificates(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Certificate).where(Certificate.user_id == current_user.id)
    certificates = session.exec(statement).all()
    return certificates


@router.get("/certificates/{certificate_id}/download")
def download_certificate(
    certificate_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    certificate = session.get(Certificate, certificate_id)
    if not certificate or certificate.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Certificado nao encontrado.")

    encoded, content_type = resolve_file_payload(certificate.file_content_base64)
    try:
        file_bytes = base64.b64decode(encoded)
    except Exception:
        raise HTTPException(status_code=400, detail="Certificado invalido.")

    filename = certificate.file_name or "certificado.pdf"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return Response(content=file_bytes, media_type=content_type, headers=headers)
