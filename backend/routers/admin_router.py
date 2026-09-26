"""Admin — system health dashboard with circuit breaker controls"""
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
import random

router = APIRouter(tags=["admin"])

_services = {
    "mysql-primary": {"name": "MySQL Primary", "category": "Database", "status": "healthy", "circuitBreaker": "closed", "uptime": "99.97%", "latencyMs": 12, "errorRate": 0.02, "lastCheck": None, "connections": f"{random.randint(3,8)}/10"},
    "qdrant-vector": {"name": "Qdrant Vector DB", "category": "Database", "status": "healthy", "circuitBreaker": "closed", "uptime": "99.92%", "latencyMs": 45, "errorRate": 0.05, "lastCheck": None, "connections": f"{random.randint(2,6)}/10"},
    "llm-gateway": {"name": "LLM Gateway (Groq)", "category": "AI", "status": "degraded", "circuitBreaker": "half-open", "uptime": "98.5%", "latencyMs": 1200, "errorRate": 2.1, "lastCheck": None, "connections": "N/A"},
    "auth-service": {"name": "Auth Service", "category": "Security", "status": "healthy", "circuitBreaker": "closed", "uptime": "99.99%", "latencyMs": 8, "errorRate": 0.0, "lastCheck": None, "connections": "N/A"},
    "doc-processor": {"name": "Document Processor", "category": "Pipeline", "status": "healthy", "circuitBreaker": "closed", "uptime": "99.85%", "latencyMs": 320, "errorRate": 0.8, "lastCheck": None, "connections": "N/A"},
    "embedding-service": {"name": "Embedding Service", "category": "AI", "status": "healthy", "circuitBreaker": "closed", "uptime": "99.90%", "latencyMs": 120, "errorRate": 0.3, "lastCheck": None, "connections": "N/A"},
    "cache-redis": {"name": "Redis Cache", "category": "Cache", "status": "healthy", "circuitBreaker": "closed", "uptime": "99.98%", "latencyMs": 2, "errorRate": 0.0, "lastCheck": None, "connections": f"{random.randint(1,4)}/20"},
    "webhook-dispatcher": {"name": "Webhook Dispatcher", "category": "Integration", "status": "healthy", "circuitBreaker": "closed", "uptime": "99.80%", "latencyMs": 85, "errorRate": 0.4, "lastCheck": None, "connections": "N/A"},
}

@router.get("/api/admin/services")
def list_services():
    now = datetime.utcnow().isoformat()
    for s in _services.values():
        s["lastCheck"] = now
    return {"services": list(_services.values()), "total": len(_services)}

class CircuitBreakerAction(BaseModel):
    action: str  # "open", "close", "half-open", "retry"

@router.post("/api/admin/circuit-breaker/{service_id}")
def circuit_breaker(service_id: str, body: CircuitBreakerAction):
    if service_id not in _services:
        return {"error": "Service not found"}
    svc = _services[service_id]
    if body.action == "retry":
        svc["circuitBreaker"] = "half-open"
        svc["status"] = "degraded"
    elif body.action == "open":
        svc["circuitBreaker"] = "open"
        svc["status"] = "unhealthy"
    elif body.action == "close":
        svc["circuitBreaker"] = "closed"
        svc["status"] = "healthy"
    else:
        svc["circuitBreaker"] = body.action
    svc["lastCheck"] = datetime.utcnow().isoformat()
    return svc

@router.get("/api/admin/system-stats")
def system_stats():
    return {
        "cpu": round(random.uniform(15, 65), 1),
        "memory": round(random.uniform(40, 75), 1),
        "disk": round(random.uniform(30, 60), 1),
        "networkIn": f"{random.randint(10, 100)} MB/s",
        "networkOut": f"{random.randint(5, 50)} MB/s",
        "activeConnections": random.randint(20, 150),
        "queuedJobs": random.randint(0, 15),
        "uptime": f"{random.randint(10, 90)} days",
    }
