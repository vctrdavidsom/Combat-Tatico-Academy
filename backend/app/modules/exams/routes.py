from fastapi import APIRouter
from app.modules.exams.router_admin import router as admin_router
from app.modules.exams.router_student import router as student_router

router = APIRouter(prefix="/exams")

router.include_router(admin_router)
router.include_router(student_router)