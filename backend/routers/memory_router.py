"""Memory timeline — conversation history for timeline view"""
from fastapi import APIRouter
from datetime import datetime, timedelta
import random, uuid

router = APIRouter(tags=["memory"])

TOPICS = ["Leave policy", "Q4 financial report", "Security compliance", "API architecture", "Remote work policy", "Sales performance", "Deployment guide", "HR benefits", "Code review standards", "Database optimization"]
AGENTS_USED = [["SUPERVISOR", "RETRIEVAL"], ["SUPERVISOR", "RETRIEVAL", "SQL"], ["SUPERVISOR", "RETRIEVAL", "REVIEWER"], ["SUPERVISOR", "RESEARCH"]]

@router.get("/api/memory/timeline")
def memory_timeline(limit: int = 50):
    now = datetime.utcnow()
    conversations = []
    for i in range(limit):
        ts = now - timedelta(hours=i * random.randint(1, 12), minutes=random.randint(0, 59))
        topic = random.choice(TOPICS)
        msg_count = random.randint(2, 12)
        agents = random.choice(AGENTS_USED)
        conversations.append({
            "id": str(uuid.uuid4()),
            "title": f"{topic} — Q&A",
            "topic": topic,
            "messageCount": msg_count,
            "agentsUsed": agents,
            "tokensUsed": random.randint(500, 8000),
            "latencyMs": random.randint(200, 5000),
            "satisfaction": random.choice(["positive", "neutral", "negative"]),
            "preview": f"User asked about {topic.lower()}. AI provided a detailed response with {random.randint(1, 4)} citations.",
            "createdAt": ts.isoformat(),
            "updatedAt": (ts + timedelta(minutes=random.randint(1, 30))).isoformat(),
        })
    return {"conversations": sorted(conversations, key=lambda x: x["createdAt"], reverse=True), "total": len(conversations)}

@router.get("/api/memory/stats")
def memory_stats():
    return {
        "totalConversations": random.randint(800, 2000),
        "totalMessages": random.randint(5000, 15000),
        "totalTokens": random.randint(2000000, 8000000),
        "avgMessagesPerConv": round(random.uniform(4.0, 8.0), 1),
        "topTopics": [
            {"topic": t, "count": random.randint(20, 200)} for t in TOPICS[:6]
        ],
        "satisfactionBreakdown": {
            "positive": random.randint(60, 80),
            "neutral": random.randint(10, 25),
            "negative": random.randint(3, 15),
        },
    }
