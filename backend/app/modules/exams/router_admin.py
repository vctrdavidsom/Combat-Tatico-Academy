from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, delete
from app.core.database import get_session
from app.modules.users.dependencies import get_current_admin
from app.modules.users.models import User
from app.modules.courses.models import Module
from app.modules.exams.models import Exam, Question, Alternative, ExamLog
from app.modules.exams.schemas import (
	ExamCreate, ExamUpdate, ExamPublic,
	QuestionPublic, ExamLogPublic, ExamLogUpdate
)

router = APIRouter(prefix="/admin", tags=["Exams - Admin"])


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


@router.post("/modules/{module_id}/exams", response_model=ExamPublic, status_code=status.HTTP_201_CREATED)
def create_exam(
	module_id: int,
	exam_in: ExamCreate,
	session: Session = Depends(get_session),
	current_admin: User = Depends(get_current_admin)
):
	module = session.get(Module, module_id)
	if not module:
		raise HTTPException(status_code=404, detail="Modulo nao encontrado.")

	exam = Exam(
		title=exam_in.title,
		type=exam_in.type,
		draw_count=exam_in.draw_count,
		attempt_limit=exam_in.attempt_limit,
		total_points=exam_in.total_points,
		cut_score=exam_in.cut_score,
		duration_minutes=exam_in.duration_minutes,
		start_date=exam_in.start_date,
		due_date=exam_in.due_date,
		is_active=exam_in.is_active if exam_in.is_active is not None else True,
		module_id=module_id
	)
	session.add(exam)
	session.commit()
	session.refresh(exam)

	for question_in in exam_in.questions:
		question = Question(
			type=question_in.type,
			prompt=question_in.prompt,
			weight=question_in.weight,
			order=question_in.order or 1,
			exam_id=exam.id
		)
		session.add(question)
		session.commit()
		session.refresh(question)

		for index, option in enumerate(question_in.options):
			is_correct = question_in.correct_index == index
			alternative = Alternative(
				text=option,
				is_correct=is_correct,
				question_id=question.id
			)
			session.add(alternative)
		session.commit()

	session.refresh(exam)
	return build_exam_public(exam)


@router.get("/modules/{module_id}/exams", response_model=list[ExamPublic])
def list_exams_by_module(
	module_id: int,
	session: Session = Depends(get_session),
	current_admin: User = Depends(get_current_admin)
):
	statement = select(Exam).where(Exam.module_id == module_id)
	exams = session.exec(statement).all()
	return [build_exam_public(exam) for exam in exams]


@router.get("/exams/{exam_id}", response_model=ExamPublic)
def get_exam(
	exam_id: int,
	session: Session = Depends(get_session),
	current_admin: User = Depends(get_current_admin)
):
	exam = session.get(Exam, exam_id)
	if not exam:
		raise HTTPException(status_code=404, detail="Exame nao encontrado.")
	return build_exam_public(exam)


@router.patch("/exams/{exam_id}", response_model=ExamPublic)
def update_exam(
	exam_id: int,
	exam_in: ExamUpdate,
	session: Session = Depends(get_session),
	current_admin: User = Depends(get_current_admin)
):
	exam = session.get(Exam, exam_id)
	if not exam:
		raise HTTPException(status_code=404, detail="Exame nao encontrado.")

	exam_data = exam_in.model_dump(exclude_unset=True)
	questions_payload = exam_data.pop("questions", None)

	for key, value in exam_data.items():
		setattr(exam, key, value)

	session.add(exam)
	session.commit()

	if questions_payload is not None:
		session.exec(delete(Alternative).where(Alternative.question_id.in_(
			select(Question.id).where(Question.exam_id == exam.id)
		)))
		session.exec(delete(Question).where(Question.exam_id == exam.id))
		session.commit()

		def read_field(item, key, default=None):
			if isinstance(item, dict):
				return item.get(key, default)
			return getattr(item, key, default)

		for question_in in questions_payload:
			question_type = read_field(question_in, "type", "multiple")
			prompt = read_field(question_in, "prompt", "")
			weight = read_field(question_in, "weight", 1)
			order = read_field(question_in, "order", 1)
			options = read_field(question_in, "options", []) or []
			correct_index = read_field(question_in, "correct_index", None)

			question = Question(
				type=question_type,
				prompt=prompt,
				weight=weight,
				order=order or 1,
				exam_id=exam.id
			)
			session.add(question)
			session.commit()
			session.refresh(question)

			for index, option in enumerate(options):
				is_correct = correct_index == index
				alternative = Alternative(
					text=option,
					is_correct=is_correct,
					question_id=question.id
				)
				session.add(alternative)
			session.commit()

	session.refresh(exam)
	return build_exam_public(exam)


@router.delete("/exams/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(
	exam_id: int,
	session: Session = Depends(get_session),
	current_admin: User = Depends(get_current_admin)
):
	exam = session.get(Exam, exam_id)
	if not exam:
		raise HTTPException(status_code=404, detail="Exame nao encontrado.")
	session.delete(exam)
	session.commit()
	return None


@router.get("/logs", response_model=list[ExamLogPublic])
def list_exam_logs(
	user_id: int | None = None,
	exam_id: int | None = None,
	session: Session = Depends(get_session),
	current_admin: User = Depends(get_current_admin)
):
	statement = select(ExamLog)
	if user_id is not None:
		statement = statement.where(ExamLog.user_id == user_id)
	if exam_id is not None:
		statement = statement.where(ExamLog.exam_id == exam_id)
	logs = session.exec(statement.order_by(ExamLog.submitted_at.desc())).all()
	return logs


@router.patch("/logs/{log_id}", response_model=ExamLogPublic)
def update_exam_log(
	log_id: int,
	log_in: ExamLogUpdate,
	session: Session = Depends(get_session),
	current_admin: User = Depends(get_current_admin)
):
	log = session.get(ExamLog, log_id)
	if not log:
		raise HTTPException(status_code=404, detail="Registro nao encontrado.")

	log_data = log_in.model_dump(exclude_unset=True)
	for key, value in log_data.items():
		setattr(log, key, value)

	session.add(log)
	session.commit()
	session.refresh(log)
	return log
