from fastapi import APIRouter
from app.modules.library.router_admin import router as admin_library_router
from app.modules.library.router_student import router as student_library_router

router = APIRouter(prefix="/library")

# Acopla as rotas específicas dividindo os escopos
router.include_router(admin_library_router)
router.include_router(student_library_router)
