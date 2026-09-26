"""Feedback sentiment analysis and heatmap aggregation"""
from fastapi import APIRouter
from datetime import datetime, timedelta
import random

router = APIRouter(tags=["feedback"])

@router.get("/api/feedback/heatmap")
def feedback_heatmap(days: int = 90):
    """Calendar heatmap: daily thumbs up/down ratio for the last N days."""
    now = datetime.utcnow()
    data = []
    for i in range(days):
        dt = now - timedelta(days=days - 1 - i)
        ups = random.randint(5, 80)
        downs = random.randint(0, max(1, ups // 4))
        total = ups + downs
        data.append({
            "date": dt.strftime("%Y-%m-%d"),
            "weekday": dt.weekday(),
            "week": int(dt.strftime("%W")),
            "thumbsUp": ups,
            "thumbsDown": downs,
            "total": total,
            "ratio": round(ups / total, 2) if total > 0 else 0,
            "sentiment": "positive" if ups / max(total, 1) > 0.75 else "neutral" if ups / max(total, 1) > 0.5 else "negative",
        })
    return {"heatmap": data, "days": days}

@router.get("/api/feedback/sentiment")
def feedback_sentiment():
    """Aggregated sentiment stats."""
    total_up = random.randint(2000, 5000)
    total_down = random.randint(200, 800)
    total = total_up + total_down
    by_agent = [
        {"agent": "SUPERVISOR", "thumbsUp": random.randint(300, 800), "thumbsDown": random.randint(20, 100)},
        {"agent": "RETRIEVAL", "thumbsUp": random.randint(500, 1200), "thumbsDown": random.randint(50, 200)},
        {"agent": "SQL", "thumbsUp": random.randint(200, 600), "thumbsDown": random.randint(30, 150)},
        {"agent": "RESEARCH", "thumbsUp": random.randint(300, 700), "thumbsDown": random.randint(20, 80)},
        {"agent": "REVIEWER", "thumbsUp": random.randint(400, 900), "thumbsDown": random.randint(10, 60)},
    ]
    top_complaints = [
        {"text": "Answer was too vague, needed more specific citations", "count": random.randint(10, 50)},
        {"text": "Incorrect financial figures cited from Q3 report", "count": random.randint(5, 30)},
        {"text": "Response latency too high — took over 10 seconds", "count": random.randint(8, 40)},
        {"text": "Missing context from recently uploaded documents", "count": random.randint(3, 20)},
        {"text": "SQL query returned wrong department filter", "count": random.randint(2, 15)},
    ]
    return {
        "totalThumbsUp": total_up,
        "totalThumbsDown": total_down,
        "overallRatio": round(total_up / total, 2),
        "byAgent": by_agent,
        "topComplaints": sorted(top_complaints, key=lambda x: -x["count"]),
    }
