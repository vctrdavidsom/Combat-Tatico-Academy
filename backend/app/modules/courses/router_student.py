from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.database import get_session
from app.modules.users.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.courses.models import Course, Enrollment
from app.modules.courses.schemas import CourseDetailPublic, ModuleDetailPublic
from app.modules.exams.models import Exam, Question
from app.modules.exams.schemas import ExamPublic, QuestionPublic

router = APIRouter(prefix="/student", tags=["Courses - Student"])


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

@router.get("/courses", response_model=list[CourseDetailPublic])
def list_student_courses(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Lista todos os cursos disponíveis para o aluno logado."""
    statement = (
        select(Course)
        .join(Enrollment, Enrollment.course_id == Course.id)
        .where(Enrollment.user_id == current_user.id)
        .where(Course.is_active == True)
    )
    courses = session.exec(statement).all()
    response: list[CourseDetailPublic] = []
    for course in courses:
        final_exam: ExamPublic | None = None
        modules: list[ModuleDetailPublic] = []
        for module in course.modules:
            exams = [build_exam_public(exam) for exam in module.exams]
            for exam in exams:
                if exam.type == "final" and final_exam is None:
                    final_exam = exam
                    break
            modules.append(
                ModuleDetailPublic(
                    id=module.id,
                    title=module.title,
                    description=module.description,
                    order=module.order,
                    course_id=module.course_id,
                    lessons=module.lessons,
                    exams=exams
                )
            )
        response.append(
            CourseDetailPublic(
                id=course.id,
                code=course.code,
                name=course.name,
                description=course.description,
                duration=course.duration,
                thumbnail_url=course.thumbnail_url,
                is_active=course.is_active,
                modules=modules,
                final_exam=final_exam
            )
        )
    return response

@router.get("/courses/{course_id}", response_model=CourseDetailPublic)
def get_student_course_details(
    course_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Retorna o conteúdo programático (módulos) do curso para o aluno."""
    course = session.get(Course, course_id)
    if not course or not course.is_active:
        raise HTTPException(status_code=404, detail="Curso não disponível.")
    final_exam: ExamPublic | None = None
    modules: list[ModuleDetailPublic] = []
    for module in course.modules:
        exams = [build_exam_public(exam) for exam in module.exams]
        for exam in exams:
            if exam.type == "final" and final_exam is None:
                final_exam = exam
                break
        modules.append(
            ModuleDetailPublic(
                id=module.id,
                title=module.title,
                description=module.description,
                order=module.order,
                course_id=module.course_id,
                lessons=module.lessons,
                exams=exams
            )
        )
    return CourseDetailPublic(
        id=course.id,
        code=course.code,
        name=course.name,
        description=course.description,
        duration=course.duration,
        thumbnail_url=course.thumbnail_url,
        is_active=course.is_active,
        modules=modules,
        final_exam=final_exam
    )