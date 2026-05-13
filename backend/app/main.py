from fastapi import FastAPI

app = FastAPI(title="Combat Tático Academy API")

@app.get("/")
def read_root():
    return {"status": "Operacional", "sistema": "Combat Tático Academy"}

@app.get("/health")
def health_check():
    return {"database": "pendente", "api": "online"}