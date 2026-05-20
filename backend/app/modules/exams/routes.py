from fastapi import APIRouter
from app.modules.exams.router_admin import router as admin_exams_router
from app.modules.exams.router_student import router as student_exams_router

router = APIRouter(prefix="/exams")

# Acopla as rotas específicas dividindo os escopos
router.include_router(admin_exams_router)
router.include_router(student_exams_router)
