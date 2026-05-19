from sqlmodel import create_engine, SQLModel, Session
from app.core.config import settings

# 1. O Motor (Engine)
# Ele usa a URL que configuramos no .env
engine = create_engine(settings.DATABASE_URL, echo=True)

# 2. Inicializador do Banco
def init_db():
    # Esta função lê todos os nossos 'models' e cria as tabelas no Neon
    SQLModel.metadata.create_all(engine)

# 3. Gerador de Sessão (O porteiro)
def get_session():
    # O 'with' garante que a sessão seja fechada automaticamente ao final
    with Session(engine) as session:
        yield session