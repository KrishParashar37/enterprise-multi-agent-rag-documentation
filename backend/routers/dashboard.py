from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Document, User, Conversation, AgentRun, Message

router = APIRouter()

@router.get("")
def get_dashboard(db: Session = Depends(get_db)):
    return {
        "kpis": {
            "totalDocuments":     db.query(func.count(Document.id)).scalar() or 0,
            "totalUsers":         db.query(func.count(User.id)).scalar() or 0,
            "totalConversations": db.query(func.count(Conversation.id)).scalar() or 0,
            "totalAgentRuns":     db.query(func.count(AgentRun.id)).scalar() or 0,
            "totalMessages":      db.query(func.count(Message.id)).scalar() or 0,
            "totalCost":          db.query(func.sum(AgentRun.cost)).scalar() or 0.0,
            "avgLatencyMs":       db.query(func.avg(AgentRun.latency_ms)).scalar() or 0.0,
        },
        "recentDocuments": [
            {"id": d.id, "name": d.name, "status": d.status, "type": d.type}
            for d in db.query(Document).order_by(Document.created_at.desc()).limit(5).all()
        ],
        "source": "database"
    }
