"""
Enterprise Multi-Agent RAG Platform — FastAPI Backend
Run: uvicorn main:app --reload --port 8000
Docs: http://localhost:8000/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from database import engine, Base
from routers import chat, documents, conversations, dashboard, agents, health, search, evaluation, auth
from routers import logs, integrations, api_keys, models_router, feedback_router
from routers import settings_router, billing_router, memory_router, admin_router, prompts_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    os.makedirs(os.getenv("UPLOAD_DIR", "./uploads"), exist_ok=True)
    print("✅ Backend started — http://localhost:8000/docs")
    yield

app = FastAPI(title="Enterprise RAG API", version="2.0.0", lifespan=lifespan)

app.add_middleware(CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL","http://localhost:3000"),"http://localhost:3001"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# ── Core routers ──────────────────────────────────
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(dashboard.router,     prefix="/api/dashboard")
app.include_router(chat.router,          prefix="/api/chat")
app.include_router(documents.router,     prefix="/api/documents")
app.include_router(conversations.router, prefix="/api/conversations")
app.include_router(agents.router,        prefix="/api/agents")
app.include_router(search.router,        prefix="/api/search")
app.include_router(evaluation.router,    prefix="/api/evaluation")

# ── New feature routers ───────────────────────────
app.include_router(logs.router)
app.include_router(integrations.router)
app.include_router(api_keys.router)
app.include_router(models_router.router)
app.include_router(feedback_router.router)
app.include_router(settings_router.router)
app.include_router(billing_router.router)
app.include_router(memory_router.router)
app.include_router(admin_router.router)
app.include_router(prompts_router.router)

@app.get("/")
def root():
    return {
        "service": "Enterprise Multi-Agent RAG API",
        "version": "2.0.0",
        "status":  "running",
        "docs":    "http://localhost:8000/docs",
        "health":  "http://localhost:8000/api/health",
    }
