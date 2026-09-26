"""Real-time log streaming and search"""
from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import random, uuid

router = APIRouter(tags=["logs"])

LEVELS = ["INFO", "WARNING", "ERROR", "DEBUG"]
SERVICES = ["rag-engine", "auth-service", "vector-db", "llm-gateway", "document-processor", "api-gateway"]
MESSAGES = {
    "INFO": [
        "Query processed successfully in {ms}ms",
        "Document indexed: {doc}",
        "User {user} logged in",
        "Agent run completed: {agent}",
        "Cache hit for embedding query",
        "Health check passed",
        "Connection pool: {n}/10 active",
    ],
    "WARNING": [
        "High latency detected: {ms}ms on LLM call",
        "Rate limit approaching for tenant {tenant}",
        "Retry attempt {n}/3 for vector search",
        "Memory usage at {n}% threshold",
        "Slow query detected: {ms}ms",
    ],
    "ERROR": [
        "Failed to connect to vector database",
        "LLM API timeout after {ms}ms",
        "Document parsing failed: {doc}",
        "Authentication token expired for user {user}",
        "Circuit breaker OPEN for llm-gateway",
    ],
    "DEBUG": [
        "Embedding dimension: 1536",
        "Chunk size: {n} tokens",
        "Reranker score: 0.{n}",
        "SQL query generated: SELECT ...",
        "Cache key: emb_{tenant}_{n}",
    ],
}

def _gen_log(ts: datetime) -> dict:
    level = random.choices(LEVELS, weights=[50, 25, 10, 15])[0]
    service = random.choice(SERVICES)
    tpl = random.choice(MESSAGES[level])
    msg = tpl.format(
        ms=random.randint(50, 5000),
        doc=random.choice(["Handbook.pdf", "Q4-Report.xlsx", "API-Spec.md", "Security-Policy.pdf"]),
        user=random.choice(["ananya.roy", "john.smith", "priya.patel", "admin"]),
        agent=random.choice(["SUPERVISOR", "RETRIEVAL", "SQL", "REVIEWER"]),
        tenant=random.choice(["acme-corp", "globex", "initech"]),
        n=random.randint(1, 99),
    )
    return {
        "id": str(uuid.uuid4()),
        "timestamp": ts.isoformat(),
        "level": level,
        "service": service,
        "message": msg,
        "traceId": f"trace-{uuid.uuid4().hex[:12]}",
    }

@router.get("/api/logs")
def get_logs(
    limit: int = Query(100, le=500),
    level: str = Query("ALL"),
    service: str = Query("ALL"),
    search: str = Query(""),
):
    now = datetime.utcnow()
    logs = [_gen_log(now - timedelta(seconds=i * random.randint(1, 30))) for i in range(limit)]
    if level != "ALL":
        logs = [l for l in logs if l["level"] == level]
    if service != "ALL":
        logs = [l for l in logs if l["service"] == service]
    if search:
        logs = [l for l in logs if search.lower() in l["message"].lower()]
    return {"logs": sorted(logs, key=lambda x: x["timestamp"], reverse=True), "total": len(logs)}

@router.get("/api/logs/services")
def get_log_services():
    return {"services": SERVICES, "levels": LEVELS}
