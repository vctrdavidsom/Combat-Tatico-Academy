from fastapi import APIRouter
from app.modules.lessons.router_admin import router as admin_router
from app.modules.lessons.router_student import router as student_router

router = APIRouter(prefix="/lessons")

router.include_router(admin_router)
router.include_router(student_router)