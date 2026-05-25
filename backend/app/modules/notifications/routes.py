from fastapi import APIRouter
from app.modules.notifications.router_admin import router as admin_router
from app.modules.notifications.router_student import router as student_router

router = APIRouter(prefix="/notifications")

router.include_router(admin_router)
router.include_router(student_router)