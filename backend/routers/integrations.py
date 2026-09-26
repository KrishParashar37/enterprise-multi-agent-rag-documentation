"""Integration marketplace — list, toggle, configure connectors"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid

router = APIRouter(tags=["integrations"])

INTEGRATIONS = [
    {"id": "int-001", "name": "Slack", "category": "Communication", "icon": "slack", "description": "Send RAG answers and alerts to Slack channels", "enabled": True, "status": "connected", "configuredAt": "2026-08-15T10:00:00Z", "eventsToday": 142},
    {"id": "int-002", "name": "Microsoft Teams", "category": "Communication", "icon": "teams", "description": "Teams bot for enterprise Q&A and document search", "enabled": True, "status": "connected", "configuredAt": "2026-08-20T14:30:00Z", "eventsToday": 89},
    {"id": "int-003", "name": "Jira", "category": "Project Management", "icon": "jira", "description": "Auto-create tickets from failed agent runs", "enabled": False, "status": "disconnected", "configuredAt": None, "eventsToday": 0},
    {"id": "int-004", "name": "Confluence", "category": "Knowledge Base", "icon": "confluence", "description": "Sync Confluence pages as RAG documents", "enabled": True, "status": "connected", "configuredAt": "2026-07-10T09:00:00Z", "eventsToday": 34},
    {"id": "int-005", "name": "Amazon S3", "category": "Storage", "icon": "aws", "description": "Ingest documents from S3 buckets automatically", "enabled": True, "status": "connected", "configuredAt": "2026-06-01T08:00:00Z", "eventsToday": 67},
    {"id": "int-006", "name": "Google Drive", "category": "Storage", "icon": "google-drive", "description": "Sync Google Drive folders for document indexing", "enabled": False, "status": "disconnected", "configuredAt": None, "eventsToday": 0},
    {"id": "int-007", "name": "Notion", "category": "Knowledge Base", "icon": "notion", "description": "Index Notion workspaces as knowledge sources", "enabled": False, "status": "disconnected", "configuredAt": None, "eventsToday": 0},
    {"id": "int-008", "name": "GitHub", "category": "Development", "icon": "github", "description": "Index code repositories and technical documentation", "enabled": True, "status": "connected", "configuredAt": "2026-09-01T12:00:00Z", "eventsToday": 23},
    {"id": "int-009", "name": "Zendesk", "category": "Support", "icon": "zendesk", "description": "RAG-powered answers for support ticket resolution", "enabled": False, "status": "disconnected", "configuredAt": None, "eventsToday": 0},
    {"id": "int-010", "name": "Salesforce", "category": "CRM", "icon": "salesforce", "description": "Enrich CRM data with AI-generated insights", "enabled": False, "status": "disconnected", "configuredAt": None, "eventsToday": 0},
    {"id": "int-011", "name": "Webhooks", "category": "Development", "icon": "webhook", "description": "Custom HTTP webhook for event notifications", "enabled": True, "status": "connected", "configuredAt": "2026-09-05T16:00:00Z", "eventsToday": 215},
    {"id": "int-012", "name": "Email (SMTP)", "category": "Communication", "icon": "email", "description": "Send digest reports and alerts via email", "enabled": True, "status": "connected", "configuredAt": "2026-08-01T11:00:00Z", "eventsToday": 12},
]

_store = {i["id"]: dict(i) for i in INTEGRATIONS}

@router.get("/api/integrations")
def list_integrations(category: str = "All"):
    items = list(_store.values())
    if category != "All":
        items = [i for i in items if i["category"] == category]
    categories = sorted(set(i["category"] for i in _store.values()))
    return {"integrations": items, "categories": categories, "total": len(items)}

class ToggleRequest(BaseModel):
    enabled: bool

@router.post("/api/integrations/{integration_id}/toggle")
def toggle_integration(integration_id: str, body: ToggleRequest):
    if integration_id not in _store:
        raise HTTPException(404, "Integration not found")
    _store[integration_id]["enabled"] = body.enabled
    _store[integration_id]["status"] = "connected" if body.enabled else "disconnected"
    return _store[integration_id]
