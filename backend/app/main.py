from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlmodel import Session
from app.core.database import init_db, engine
from app.modules.users.models import User
from app.modules.users.utils import create_first_admin
from app.modules.users.routes import router as users_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Iniciando backend: Verificando banco de dados...")
    # 1. Cria as tabelas no Neon (se não existirem)
    init_db()
    print("Banco de dados inicializado.")
    
    # 2. Tenta criar o Admin padrão
    try:
        with Session(engine) as session:
            create_first_admin(session)
    except Exception as e:
        print(f"Erro ao criar admin inicial: {e}")
        
    yield
    print("Encerrando backend.")

app = FastAPI(
    title="Combat Tático Academy API",
    description="Motor administrativo e educacional para gestão de cursos e exames",
    version="1.0.0",
    lifespan=lifespan
)
app.include_router(users_router)

# Rota de teste simples (Sem roteadores externos por enquanto)
@app.get("/", tags=["Health Check"])
async def root():
    return {
        "status": "Operacional",
        "sistema": "Combat Tático Academy",
        "modulo": "Core"
    }