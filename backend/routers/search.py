from fastapi import APIRouter
from schemas import SearchRequest, SearchResult
from typing import List
import time, random

router = APIRouter()

CHUNKS = [
    {"id":"c1","document_name":"Employee Handbook 2025","department":"Human Resources","type":"PDF","page":42,"section":"Leave Policy","excerpt":"Employees receive **20 annual leave days** per calendar year.","date":"2025-01-15"},
    {"id":"c2","document_name":"Remote Work Policy","department":"Human Resources","type":"PDF","page":8,"section":"Hybrid Work","excerpt":"Remote employees must attend office minimum **3 days/week**.","date":"2025-02-10"},
    {"id":"c3","document_name":"Security Compliance","department":"IT Security","type":"PDF","page":12,"section":"Remote Access","excerpt":"All remote access via **VPN**. ISO 27001 compliant.","date":"2025-01-05"},
    {"id":"c4","document_name":"API Architecture v3","department":"Technology","type":"MD","page":5,"section":"REST Design","excerpt":"All APIs follow **RESTful principles**. Rate limit: 1000 req/min.","date":"2025-04-15"},
    {"id":"c5","document_name":"Q4 2024 Financial Report","department":"Finance","type":"PDF","page":3,"section":"Revenue","excerpt":"Q4 revenue: **$42.8M** (+18% YoY). EBITDA: 24.2%.","date":"2025-01-30"},
    {"id":"c6","document_name":"Sales Performance Q1","department":"Sales","type":"CSV","page":1,"section":"Regional","excerpt":"North: **$12.4M** (+22%). Total Q1: **$38.6M**.","date":"2025-04-05"},
]

def score_chunk(chunk: dict, terms: list, query: str) -> float:
    text = f"{chunk['section']} {chunk['excerpt']} {chunk['document_name']}".lower()
    score = sum(0.25 for t in terms if t in text)
    if query.lower() in text: score += 0.4
    return min(round(score, 2), 1.0)

@router.post("", response_model=dict)
def search(body: SearchRequest):
    start = time.time()
    terms = [t for t in body.query.lower().split() if len(t) > 2]
    results = []
    for c in CHUNKS:
        rel = score_chunk(c, terms, body.query)
        if rel < body.min_relevance: continue
        if body.department != "All" and c["department"] != body.department: continue
        if body.type != "All" and c["type"] != body.type: continue
        results.append({**c, "relevance": rel})
    results = sorted([r for r in results if r["relevance"] > 0], key=lambda x: -x["relevance"])[:body.limit]
    elapsed = int((time.time()-start)*1000) + 200 + random.randint(0,400)
    return {"results": results, "total": len(results), "query": body.query, "elapsedMs": elapsed}
