from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import AgentRun

router = APIRouter()

@router.get("")
def get_agents(limit: int = 20, db: Session = Depends(get_db)):
    runs = db.query(AgentRun).order_by(AgentRun.created_at.desc()).limit(limit).all()
    stats = db.query(
        AgentRun.agent_name,
        func.count(AgentRun.id).label("total_runs"),
        func.avg(AgentRun.latency_ms).label("avg_latency"),
        func.sum(AgentRun.cost).label("total_cost"),
    ).group_by(AgentRun.agent_name).all()

    return {
        "runs": [{"id": r.id, "traceId": r.trace_id, "agentName": r.agent_name,
                  "status": r.status, "model": r.model, "latencyMs": r.latency_ms,
                  "cost": r.cost, "query": r.query, "error": r.error,
                  "createdAt": r.created_at} for r in runs],
        "stats": [{"name": s.agent_name, "runs": s.total_runs,
                   "avgLatency": round(s.avg_latency or 0, 2),
                   "totalCost": round(s.total_cost or 0, 4)} for s in stats],
    }
