from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # --- CONFIGURAÇÕES DE INFRAESTRUTURA ---
    # URL de conexão com o banco de dados Neon
    DATABASE_URL: str
    FIRST_ADMIN_EMAIL: str
    FIRST_ADMIN_PASSWORD: str
    
    # --- CONFIGURAÇÕES DE SEGURANÇA (JWT) ---
    # Chave secreta para assinar os tokens de login
    SECRET_KEY: str
    # Algoritmo de criptografia (HS256 é o padrão tático)
    ALGORITHM: str
    # Tempo de vida do token (30 minutos por padrão)
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # --- CARREGAMENTO DO AMBIENTE ---
    # Instruímos o Pydantic a procurar o arquivo .env na raiz do projeto
    model_config = SettingsConfigDict(env_file=".env")

# Instância global para ser usada em todo o sistema
settings = Settings()