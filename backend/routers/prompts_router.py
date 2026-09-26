"""Prompt management — CRUD + diff generation for prompt playground"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

router = APIRouter(tags=["prompts"])

_prompts = {
    "p-001": {"id": "p-001", "name": "RAG System Prompt", "category": "System", "content": "You are an Enterprise AI Assistant powered by a Multi-Agent RAG system.\nYou help employees find information from company documents, policies, financial reports, and technical documentation.\nAlways provide clear, structured, and cited answers using markdown formatting.\nBe professional, concise, and helpful.", "version": 5, "isActive": True, "createdAt": "2026-06-01T10:00:00Z", "updatedAt": "2026-09-10T14:30:00Z", "avgScore": 0.92, "usageCount": 4200},
    "p-002": {"id": "p-002", "name": "SQL Agent Prompt", "category": "Agent", "content": "You are a SQL query generator for enterprise databases.\nConvert natural language questions into safe, read-only SQL queries.\nAlways use parameterized queries. Never generate DELETE, UPDATE, INSERT, or DROP statements.\nLimit results to 100 rows maximum.", "version": 3, "isActive": True, "createdAt": "2026-07-15T08:00:00Z", "updatedAt": "2026-09-05T11:00:00Z", "avgScore": 0.88, "usageCount": 1800},
    "p-003": {"id": "p-003", "name": "Reviewer Prompt", "category": "Agent", "content": "You are a quality reviewer for AI-generated answers.\nCheck the answer for:\n1. Faithfulness to source documents\n2. Hallucination detection\n3. Citation accuracy\n4. Completeness of response\nReturn a JSON score object.", "version": 2, "isActive": True, "createdAt": "2026-08-01T12:00:00Z", "updatedAt": "2026-08-28T16:00:00Z", "avgScore": 0.95, "usageCount": 3500},
    "p-004": {"id": "p-004", "name": "Summarization Prompt", "category": "Utility", "content": "Summarize the following document chunk in 2-3 concise sentences.\nPreserve key facts, figures, and proper nouns.\nDo not add information not present in the source.", "version": 1, "isActive": False, "createdAt": "2026-09-01T09:00:00Z", "updatedAt": "2026-09-01T09:00:00Z", "avgScore": 0.85, "usageCount": 600},
}

@router.get("/api/prompts")
def list_prompts(category: str = "All"):
    items = list(_prompts.values())
    if category != "All":
        items = [p for p in items if p["category"] == category]
    categories = sorted(set(p["category"] for p in _prompts.values()))
    return {"prompts": items, "categories": categories}

class PromptCreate(BaseModel):
    name: str
    category: str
    content: str

@router.post("/api/prompts")
def create_prompt(body: PromptCreate):
    pid = f"p-{str(uuid.uuid4())[:3]}"
    prompt = {
        "id": pid, "name": body.name, "category": body.category, "content": body.content,
        "version": 1, "isActive": True, "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat(), "avgScore": 0, "usageCount": 0,
    }
    _prompts[pid] = prompt
    return prompt

class DiffRequest(BaseModel):
    originalContent: str
    modifiedContent: str

@router.post("/api/prompts/diff")
def diff_prompts(body: DiffRequest):
    """Generate a line-by-line diff between two prompt versions."""
    orig_lines = body.originalContent.splitlines()
    mod_lines = body.modifiedContent.splitlines()
    diff = []
    max_lines = max(len(orig_lines), len(mod_lines))
    for i in range(max_lines):
        orig = orig_lines[i] if i < len(orig_lines) else None
        mod = mod_lines[i] if i < len(mod_lines) else None
        if orig == mod:
            diff.append({"type": "unchanged", "line": i + 1, "content": orig})
        elif orig is None:
            diff.append({"type": "added", "line": i + 1, "content": mod})
        elif mod is None:
            diff.append({"type": "removed", "line": i + 1, "content": orig})
        else:
            diff.append({"type": "removed", "line": i + 1, "content": orig})
            diff.append({"type": "added", "line": i + 1, "content": mod})
    orig_tokens = sum(len(l.split()) for l in orig_lines)
    mod_tokens = sum(len(l.split()) for l in mod_lines)
    return {"diff": diff, "originalTokens": orig_tokens, "modifiedTokens": mod_tokens}
