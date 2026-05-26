from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from sqlmodel import Session, select
from app.core.database import get_session
from app.modules.users.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.courses.models import Enrollment
from app.modules.exams.models import Exam, Question, Alternative, ExamLog
from app.modules.exams.schemas import ExamPublic, QuestionPublic, ExamLogCreate, ExamLogPublic

router = APIRouter(prefix="/student", tags=["Exams - Student"])


def normalize_answer(value: object):
	if isinstance(value, str):
		try:
			return int(value)
		except ValueError:
			return value
	return value


def calculate_exam_score(exam: Exam, answers: dict[int, str | int]):
	objective_total = 0.0
	total_points = 0.0
	score_points = 0.0
	has_essay = False

	for question in exam.questions:
		weight = question.weight or 1
		total_points += weight

		if question.type != "multiple":
			has_essay = True
			continue

		objective_total += weight
		correct_index = None
		for index, alt in enumerate(question.alternatives):
			if alt.is_correct:
				correct_index = index
				break
		answer_value = normalize_answer(answers.get(question.id))
		if correct_index is not None and answer_value == correct_index:
			score_points += weight

	score_percent = 0
	if objective_total > 0:
		score_percent = round((score_points / objective_total) * 100)

	resolved_total = exam.total_points if exam.total_points is not None else total_points
	return {
		"score_percent": score_percent,
		"score_points": round(score_points, 2),
		"total_points": round(resolved_total, 2),
		"has_essay": has_essay
	}


def build_question_public(question: Question) -> QuestionPublic:
	options = [alt.text for alt in question.alternatives]
	correct_index = None
	for index, alt in enumerate(question.alternatives):
		if alt.is_correct:
			correct_index = index
			break
	return QuestionPublic(
		id=question.id,
		type=question.type,
		prompt=question.prompt,
		options=options,
		correct_index=correct_index,
		weight=question.weight,
		order=question.order
	)


def build_exam_public(exam: Exam) -> ExamPublic:
	questions = [build_question_public(question) for question in exam.questions]
	return ExamPublic(
		id=exam.id,
		title=exam.title,
		type=exam.type,
		draw_count=exam.draw_count,
		attempt_limit=exam.attempt_limit,
		total_points=exam.total_points,
		cut_score=exam.cut_score,
		duration_minutes=exam.duration_minutes,
		start_date=exam.start_date,
		due_date=exam.due_date,
		is_active=exam.is_active,
		module_id=exam.module_id,
		questions=questions
	)


@router.get("/exams/{exam_id}", response_model=ExamPublic)
def get_exam_for_student(
	exam_id: int,
	session: Session = Depends(get_session),
	current_user: User = Depends(get_current_user)
):
	exam = session.get(Exam, exam_id)
	if not exam or not exam.is_active:
		raise HTTPException(status_code=404, detail="Exame nao encontrado.")

	now = datetime.utcnow()
	if exam.start_date and now < exam.start_date:
		raise HTTPException(status_code=403, detail="Exame ainda nao liberado.")
	if exam.due_date and now > exam.due_date:
		raise HTTPException(status_code=403, detail="Exame expirado.")

	course_id = exam.module.course_id if exam.module else None
	if course_id is not None:
		enrollment = session.exec(
			select(Enrollment).where(
				Enrollment.user_id == current_user.id,
				Enrollment.course_id == course_id
			)
		).first()
		if not enrollment:
			raise HTTPException(status_code=403, detail="Curso nao liberado para este aluno.")

	return build_exam_public(exam)


@router.post("/exams/{exam_id}/submit", response_model=ExamLogPublic, status_code=status.HTTP_201_CREATED)
def submit_exam(
	exam_id: int,
	payload: ExamLogCreate,
	session: Session = Depends(get_session),
	current_user: User = Depends(get_current_user)
):
	exam = session.get(Exam, exam_id)
	if not exam or not exam.is_active:
		raise HTTPException(status_code=404, detail="Exame nao encontrado.")

	now = datetime.utcnow()
	if exam.start_date and now < exam.start_date:
		raise HTTPException(status_code=403, detail="Exame ainda nao liberado.")
	if exam.due_date and now > exam.due_date:
		raise HTTPException(status_code=403, detail="Exame expirado.")

	course_id = exam.module.course_id if exam.module else None
	module_id = exam.module_id
	if course_id is not None:
		enrollment = session.exec(
			select(Enrollment).where(
				Enrollment.user_id == current_user.id,
				Enrollment.course_id == course_id
			)
		).first()
		if not enrollment:
			raise HTTPException(status_code=403, detail="Curso nao liberado para este aluno.")

	attempts_used = session.exec(
		select(ExamLog).where(
			ExamLog.user_id == current_user.id,
			ExamLog.exam_id == exam_id
		)
	).all()
	if exam.attempt_limit and len(attempts_used) >= exam.attempt_limit:
		raise HTTPException(status_code=403, detail="Limite de tentativas atingido.")

	computed = calculate_exam_score(exam, payload.answers)
	cut_score = exam.cut_score if exam.cut_score is not None else 70
	result = "apto" if computed["score_percent"] >= cut_score else "nao_apto"
	status_value = "pendente" if computed["has_essay"] else "corrigido"

	log = ExamLog(
		user_id=current_user.id,
		exam_id=exam_id,
		course_id=course_id,
		module_id=module_id,
		answers=payload.answers,
		score_percent=computed["score_percent"],
		score_points=computed["score_points"],
		total_points=computed["total_points"],
		has_essay=computed["has_essay"],
		status=status_value,
		result=result,
		attempt_number=len(attempts_used) + 1,
		max_attempts=payload.max_attempts,
		cut_score=cut_score
	)
	session.add(log)
	session.commit()
	session.refresh(log)
	return log


@router.get("/logs", response_model=list[ExamLogPublic])
def list_exam_logs_for_student(
	session: Session = Depends(get_session),
	current_user: User = Depends(get_current_user)
):
	statement = select(ExamLog).where(ExamLog.user_id == current_user.id)
	return session.exec(statement.order_by(ExamLog.submitted_at.desc())).all()
