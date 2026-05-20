from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.core.database import get_session
from app.modules.users.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.exams.models import Exam, ExamResult, StudentAnswer, Alternative, Question, ExamResultStatus
from app.modules.exams.schemas import (
    ExamStudentPublic, ExamResultCreate, ExamResultPublic, ExamResultDetailPublic
)

router = APIRouter(prefix="/student", tags=["Exams - Student"])


@router.get("/exams/{exam_id}", response_model=ExamStudentPublic)
def get_exam_structure(
    exam_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna a estrutura completa do exame otimizada para o frontend.
    Inclui questões e alternativas, mas SEM indicar quais respostas estão corretas.
    Ideal para alimentar a barra lateral de navegação e o sistema de progressão sequencial.
    """
    exam = session.get(Exam, exam_id)
    if not exam or not exam.is_active:
        raise HTTPException(status_code=404, detail="Exame não disponível.")
    
    return exam


@router.post("/exams/{exam_id}/submit", response_model=ExamResultPublic, status_code=status.HTTP_201_CREATED)
def submit_exam_result(
    exam_id: int,
    result_in: ExamResultCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Recebe as respostas do aluno e gera o registro do resultado do exame.
    
    Regra de Negócio:
    - O sistema NÃO emite certificados diretamente
    - Apenas calcula a nota e registra o status (PASSED/FAILED)
    - Um sistema certificador externo consumirá estes resultados
    
    Fluxo:
    1. Valida o exame e recupera o aluno
    2. Processa cada resposta do aluno
    3. Calcula a nota baseado em acertos
    4. Define status (PASSED/FAILED) conforme passing_score
    5. Registra o resultado no banco
    """
    exam = session.get(Exam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exame não encontrado.")
    
    # Validação: o exam_id da requisição deve coincidir com o da URL
    if result_in.exam_id != exam_id:
        raise HTTPException(status_code=400, detail="Exam ID mismatch na requisição.")
    
    # ============================================
    # 1. Processamento de Respostas
    # ============================================
    total_questions = 0
    correct_answers = 0
    student_answers_list = []
    
    # Obtém todas as questões do exame para validação
    statement = select(Question).where(Question.exam_id == exam_id, Question.is_active == True)
    questions = session.exec(statement).all()
    total_questions = len(questions)
    
    if total_questions == 0:
        raise HTTPException(status_code=400, detail="Exame não possui questões ativas.")
    
    # Processa cada resposta enviada
    for answer_data in result_in.answers:
        question = session.get(Question, answer_data.question_id)
        if not question or question.exam_id != exam_id:
            raise HTTPException(status_code=400, detail=f"Questão {answer_data.question_id} inválida para este exame.")
        
        # Valida a alternativa se foi selecionada
        if answer_data.alternative_id:
            alternative = session.get(Alternative, answer_data.alternative_id)
            if not alternative or alternative.question_id != answer_data.question_id:
                raise HTTPException(status_code=400, detail=f"Alternativa inválida para a questão {answer_data.question_id}.")
            
            # Verifica se a alternativa é correta
            if alternative.is_correct:
                correct_answers += 1
        
        student_answers_list.append(answer_data)
    
    # ============================================
    # 2. Cálculo de Nota
    # ============================================
    score = (correct_answers / total_questions * 100) if total_questions > 0 else 0
    passed = score >= exam.passing_score
    status = ExamResultStatus.PASSED if passed else ExamResultStatus.FAILED
    
    # ============================================
    # 3. Criação do Resultado
    # ============================================
    db_exam_result = ExamResult(
        exam_id=exam_id,
        user_id=current_user.id,
        score=score,
        status=status,
        total_time_seconds=result_in.total_time_seconds
    )
    
    session.add(db_exam_result)
    session.flush()  # Para obter o ID do resultado
    
    # ============================================
    # 4. Registro de Respostas Individuais
    # ============================================
    for answer_data in student_answers_list:
        db_student_answer = StudentAnswer(
            exam_result_id=db_exam_result.id,
            question_id=answer_data.question_id,
            alternative_id=answer_data.alternative_id,
            answer_time_seconds=answer_data.answer_time_seconds
        )
        session.add(db_student_answer)
    
    session.commit()
    session.refresh(db_exam_result)
    
    return db_exam_result


@router.get("/exams/{exam_id}/results", response_model=list[ExamResultPublic])
def list_exam_results(
    exam_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todos os resultados do aluno para um exame específico.
    Permite visualizar histórico de tentativas.
    """
    # Valida que o exame existe
    exam = session.get(Exam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exame não encontrado.")
    
    # Retorna resultados apenas deste aluno
    statement = select(ExamResult).where(
        (ExamResult.exam_id == exam_id) & (ExamResult.user_id == current_user.id)
    )
    return session.exec(statement).all()


@router.get("/results/{result_id}", response_model=ExamResultDetailPublic)
def get_exam_result_detail(
    result_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna o detalhe completo de um resultado de exame (com respostas).
    Apenas o aluno que fez o exame pode visualizar seu próprio resultado.
    """
    result = session.get(ExamResult, result_id)
    if not result:
        raise HTTPException(status_code=404, detail="Resultado não encontrado.")
    
    # Verifica permissão: aluno só pode ver seus próprios resultados
    if result.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado a este resultado."
        )
    
    return result
