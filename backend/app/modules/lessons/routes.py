from fastapi import APIRouter
from app.modules.lessons.router_admin import router as admin_lessons_router
from app.modules.lessons.router_student import router as student_lessons_router

router = APIRouter(prefix="/lessons")

# Acopla as rotas específicas dividindo os escopos
router.include_router(admin_lessons_router)
router.include_router(student_lessons_router)
