from fastapi import APIRouter
from database import engine
from sqlalchemy import text

router = APIRouter()

@router.get("/api/health")
def health():
    try:
        with engine.connect() as c: c.execute(text("SELECT 1"))
        db = "connected"
    except: db = "disconnected"
    return {"status": "healthy", "database": db, "version": "1.0.0"}
