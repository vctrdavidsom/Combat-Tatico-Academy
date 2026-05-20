from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.core.database import get_session
from app.modules.users.dependencies import get_current_admin
from app.modules.users.models import User
from app.modules.courses.models import Module
from app.modules.exams.models import Exam, Question, Alternative
from app.modules.exams.schemas import (
    ExamCreate, ExamUpdate, ExamPublic, ExamDetailPublic,
    QuestionCreate, QuestionUpdate, QuestionPublic,
    AlternativeCreate, AlternativeUpdate, AlternativePublic
)

router = APIRouter(prefix="/admin", tags=["Exams - Admin"])


# ==========================================
# CRUD - EXAMES
# ==========================================

@router.post("/modules/{module_id}/exams", response_model=ExamPublic, status_code=status.HTTP_201_CREATED)
def create_exam(
    module_id: int,
    exam_in: ExamCreate,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Cria um novo exame dentro de um módulo específico."""
    module = session.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Módulo não encontrado.")
    
    db_exam = Exam(
        title=exam_in.title,
        description=exam_in.description,
        passing_score=exam_in.passing_score,
        time_limit_minutes=exam_in.time_limit_minutes,
        module_id=module_id
    )
    session.add(db_exam)
    session.commit()
    session.refresh(db_exam)
    return db_exam


@router.get("/exams", response_model=list[ExamPublic])
def admin_list_exams(
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Lista todos os exames para o painel (inclui ativos e inativos)."""
    statement = select(Exam)
    return session.exec(statement).all()


@router.get("/exams/{exam_id}", response_model=ExamDetailPublic)
def admin_get_exam(
    exam_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Busca os detalhes de um exame específico com suas questões."""
    exam = session.get(Exam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exame não encontrado.")
    return exam


@router.patch("/exams/{exam_id}", response_model=ExamPublic)
def update_exam(
    exam_id: int,
    exam_in: ExamUpdate,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Atualiza dados de um exame específico."""
    db_exam = session.get(Exam, exam_id)
    if not db_exam:
        raise HTTPException(status_code=404, detail="Exame não encontrado.")
    
    exam_data = exam_in.model_dump(exclude_unset=True)
    for key, value in exam_data.items():
        setattr(db_exam, key, value)
    
    session.add(db_exam)
    session.commit()
    session.refresh(db_exam)
    return db_exam


@router.delete("/exams/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(
    exam_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Remove um exame do sistema."""
    db_exam = session.get(Exam, exam_id)
    if not db_exam:
        raise HTTPException(status_code=404, detail="Exame não encontrado.")
    
    session.delete(db_exam)
    session.commit()
    return None


# ==========================================
# CRUD - QUESTÕES
# ==========================================

@router.post("/exams/{exam_id}/questions", response_model=QuestionPublic, status_code=status.HTTP_201_CREATED)
def create_question(
    exam_id: int,
    question_in: QuestionCreate,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Cria uma nova questão dentro de um exame específico."""
    exam = session.get(Exam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exame não encontrado.")
    
    db_question = Question(
        title=question_in.title,
        description=question_in.description,
        order=question_in.order,
        exam_id=exam_id
    )
    session.add(db_question)
    session.commit()
    session.refresh(db_question)
    return db_question


@router.get("/questions", response_model=list[QuestionPublic])
def admin_list_questions(
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Lista todas as questões para o painel."""
    statement = select(Question)
    return session.exec(statement).all()


@router.get("/questions/{question_id}", response_model=QuestionPublic)
def admin_get_question(
    question_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Busca os detalhes de uma questão específica."""
    question = session.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Questão não encontrada.")
    return question


@router.patch("/questions/{question_id}", response_model=QuestionPublic)
def update_question(
    question_id: int,
    question_in: QuestionUpdate,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Atualiza dados de uma questão específica."""
    db_question = session.get(Question, question_id)
    if not db_question:
        raise HTTPException(status_code=404, detail="Questão não encontrada.")
    
    question_data = question_in.model_dump(exclude_unset=True)
    for key, value in question_data.items():
        setattr(db_question, key, value)
    
    session.add(db_question)
    session.commit()
    session.refresh(db_question)
    return db_question


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Remove uma questão do sistema."""
    db_question = session.get(Question, question_id)
    if not db_question:
        raise HTTPException(status_code=404, detail="Questão não encontrada.")
    
    session.delete(db_question)
    session.commit()
    return None


# ==========================================
# CRUD - ALTERNATIVAS
# ==========================================

@router.post("/questions/{question_id}/alternatives", response_model=AlternativePublic, status_code=status.HTTP_201_CREATED)
def create_alternative(
    question_id: int,
    alternative_in: AlternativeCreate,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Cria uma nova alternativa dentro de uma questão específica."""
    question = session.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Questão não encontrada.")
    
    db_alternative = Alternative(
        text=alternative_in.text,
        order=alternative_in.order,
        is_correct=alternative_in.is_correct,
        question_id=question_id
    )
    session.add(db_alternative)
    session.commit()
    session.refresh(db_alternative)
    return db_alternative


@router.get("/alternatives", response_model=list[AlternativePublic])
def admin_list_alternatives(
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Lista todas as alternativas para o painel."""
    statement = select(Alternative)
    return session.exec(statement).all()


@router.get("/alternatives/{alternative_id}", response_model=AlternativePublic)
def admin_get_alternative(
    alternative_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Busca os detalhes de uma alternativa específica."""
    alternative = session.get(Alternative, alternative_id)
    if not alternative:
        raise HTTPException(status_code=404, detail="Alternativa não encontrada.")
    return alternative


@router.patch("/alternatives/{alternative_id}", response_model=AlternativePublic)
def update_alternative(
    alternative_id: int,
    alternative_in: AlternativeUpdate,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Atualiza dados de uma alternativa específica."""
    db_alternative = session.get(Alternative, alternative_id)
    if not db_alternative:
        raise HTTPException(status_code=404, detail="Alternativa não encontrada.")
    
    alternative_data = alternative_in.model_dump(exclude_unset=True)
    for key, value in alternative_data.items():
        setattr(db_alternative, key, value)
    
    session.add(db_alternative)
    session.commit()
    session.refresh(db_alternative)
    return db_alternative


@router.delete("/alternatives/{alternative_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alternative(
    alternative_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin)
):
    """Remove uma alternativa do sistema."""
    db_alternative = session.get(Alternative, alternative_id)
    if not db_alternative:
        raise HTTPException(status_code=404, detail="Alternativa não encontrada.")
    
    session.delete(db_alternative)
    session.commit()
    return None
