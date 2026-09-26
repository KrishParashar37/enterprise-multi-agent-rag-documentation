"""Model comparison and benchmark data"""
from fastapi import APIRouter
import random

router = APIRouter(tags=["models"])

MODELS = [
    {"id": "gpt-oss-120b", "name": "GPT-OSS 120B", "provider": "Groq", "contextWindow": 131072, "maxOutput": 4096, "costPer1kInput": 0.0015, "costPer1kOutput": 0.002, "avgLatencyMs": 1200, "accuracy": 94.2, "speed": 78, "reasoning": 92, "coding": 88, "status": "active", "isDefault": True},
    {"id": "llama-3.3-70b", "name": "LLaMA 3.3 70B", "provider": "Groq", "contextWindow": 131072, "maxOutput": 4096, "costPer1kInput": 0.0006, "costPer1kOutput": 0.0008, "avgLatencyMs": 800, "accuracy": 89.5, "speed": 92, "reasoning": 85, "coding": 82, "status": "active", "isDefault": False},
    {"id": "mixtral-8x7b", "name": "Mixtral 8x7B", "provider": "Groq", "contextWindow": 32768, "maxOutput": 4096, "costPer1kInput": 0.0003, "costPer1kOutput": 0.0005, "avgLatencyMs": 450, "accuracy": 82.1, "speed": 96, "reasoning": 78, "coding": 75, "status": "active", "isDefault": False},
    {"id": "gemma2-9b", "name": "Gemma 2 9B", "provider": "Groq", "contextWindow": 8192, "maxOutput": 4096, "costPer1kInput": 0.0001, "costPer1kOutput": 0.0002, "avgLatencyMs": 300, "accuracy": 76.8, "speed": 98, "reasoning": 72, "coding": 70, "status": "active", "isDefault": False},
    {"id": "deepseek-r1-70b", "name": "DeepSeek R1 70B", "provider": "Groq", "contextWindow": 131072, "maxOutput": 8192, "costPer1kInput": 0.0008, "costPer1kOutput": 0.001, "avgLatencyMs": 1500, "accuracy": 91.3, "speed": 70, "reasoning": 95, "coding": 93, "status": "active", "isDefault": False},
    {"id": "text-embedding-3-small", "name": "Embedding v3 Small", "provider": "OpenAI", "contextWindow": 8191, "maxOutput": 0, "costPer1kInput": 0.00002, "costPer1kOutput": 0, "avgLatencyMs": 120, "accuracy": 0, "speed": 99, "reasoning": 0, "coding": 0, "status": "active", "isDefault": False},
]

@router.get("/api/models")
def list_models():
    return {"models": MODELS, "total": len(MODELS)}

@router.get("/api/models/compare")
def compare_models(model_a: str = "gpt-oss-120b", model_b: str = "llama-3.3-70b"):
    a = next((m for m in MODELS if m["id"] == model_a), None)
    b = next((m for m in MODELS if m["id"] == model_b), None)
    if not a or not b:
        return {"error": "Model not found"}
    # Generate benchmark results
    benchmarks = []
    categories = ["RAG QA", "Summarization", "Code Gen", "SQL Gen", "Classification", "Extraction"]
    for cat in categories:
        benchmarks.append({
            "category": cat,
            "modelA": round(random.uniform(max(70, a["accuracy"] - 10), min(100, a["accuracy"] + 5)), 1),
            "modelB": round(random.uniform(max(70, b["accuracy"] - 10), min(100, b["accuracy"] + 5)), 1),
        })
    return {"modelA": a, "modelB": b, "benchmarks": benchmarks}
