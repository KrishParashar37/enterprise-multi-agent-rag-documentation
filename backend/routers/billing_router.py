"""Billing — token usage breakdown and sunburst data"""
from fastapi import APIRouter
from datetime import datetime, timedelta
import random

router = APIRouter(tags=["billing"])

@router.get("/api/billing/usage")
def billing_usage(period: str = "30d"):
    days = 30 if period == "30d" else 7 if period == "7d" else 90
    now = datetime.utcnow()
    daily = []
    for i in range(days):
        dt = now - timedelta(days=days - 1 - i)
        daily.append({
            "date": dt.strftime("%Y-%m-%d"),
            "inputTokens": random.randint(50000, 200000),
            "outputTokens": random.randint(20000, 80000),
            "cost": round(random.uniform(15.0, 55.0), 2),
            "queries": random.randint(200, 800),
        })
    return {
        "daily": daily,
        "totalCost": round(sum(d["cost"] for d in daily), 2),
        "totalTokens": sum(d["inputTokens"] + d["outputTokens"] for d in daily),
        "totalQueries": sum(d["queries"] for d in daily),
        "period": period,
    }

@router.get("/api/billing/breakdown")
def billing_breakdown():
    """Hierarchical breakdown: Model → Agent → User for sunburst chart."""
    models = ["gpt-oss-120b", "llama-3.3-70b", "text-embedding-3-small"]
    agents = ["SUPERVISOR", "RETRIEVAL", "SQL", "RESEARCH", "REVIEWER"]
    users = ["ananya.roy", "john.smith", "priya.patel", "dev-team", "support-bot"]

    breakdown = []
    for model in models:
        model_cost = 0
        children = []
        for agent in agents:
            agent_cost = 0
            user_children = []
            for user in users:
                cost = round(random.uniform(2.0, 45.0), 2)
                tokens = random.randint(5000, 80000)
                agent_cost += cost
                user_children.append({"name": user, "cost": cost, "tokens": tokens})
            model_cost += agent_cost
            children.append({"name": agent, "cost": round(agent_cost, 2), "children": user_children})
        breakdown.append({"name": model, "cost": round(model_cost, 2), "children": children})

    return {"breakdown": breakdown, "totalCost": round(sum(m["cost"] for m in breakdown), 2)}

@router.get("/api/billing/invoices")
def billing_invoices():
    invoices = [
        {"id": "INV-2026-09", "date": "Sep 01, 2026", "amount": 840.00, "status": "Paid", "period": "August 2026"},
        {"id": "INV-2026-08", "date": "Aug 01, 2026", "amount": 720.00, "status": "Paid", "period": "July 2026"},
        {"id": "INV-2026-07", "date": "Jul 01, 2026", "amount": 680.00, "status": "Paid", "period": "June 2026"},
        {"id": "INV-2026-06", "date": "Jun 01, 2026", "amount": 590.00, "status": "Paid", "period": "May 2026"},
        {"id": "INV-2026-05", "date": "May 01, 2026", "amount": 520.00, "status": "Paid", "period": "April 2026"},
    ]
    return {"invoices": invoices}
