from fastapi import APIRouter
from app.modules.courses.router_admin import router as admin_courses_router
from app.modules.courses.router_student import router as student_courses_router

router = APIRouter(prefix="/courses")

# Acopla as rotas específicas dividindo os escopos
router.include_router(admin_courses_router)
router.include_router(student_courses_router)