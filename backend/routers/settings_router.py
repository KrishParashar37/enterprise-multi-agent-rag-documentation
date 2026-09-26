"""User settings export/import"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Dict
from datetime import datetime

router = APIRouter(tags=["settings"])

_user_settings: Dict[str, Any] = {
    "theme": "dark",
    "language": "en",
    "notifications": {"email": True, "push": True, "slack": False},
    "defaultModel": "gpt-oss-120b",
    "maxTokens": 2048,
    "temperature": 0.7,
    "autoSave": True,
    "compactMode": False,
    "showAgentTrace": True,
    "showCitations": True,
    "dateFormat": "YYYY-MM-DD",
    "timezone": "Asia/Kolkata",
    "searchMode": "hybrid",
    "resultsPerPage": 20,
}

@router.get("/api/settings")
def get_settings():
    return {"settings": _user_settings, "lastUpdated": datetime.utcnow().isoformat()}

class SettingsUpdate(BaseModel):
    settings: Dict[str, Any]

@router.put("/api/settings")
def update_settings(body: SettingsUpdate):
    _user_settings.update(body.settings)
    return {"settings": _user_settings, "lastUpdated": datetime.utcnow().isoformat()}

@router.get("/api/settings/export")
def export_settings():
    return {
        "export": _user_settings,
        "exportedAt": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "platform": "Enterprise Multi-Agent RAG",
    }

@router.post("/api/settings/import")
def import_settings(body: SettingsUpdate):
    changes = {}
    for key, val in body.settings.items():
        if key in _user_settings and _user_settings[key] != val:
            changes[key] = {"old": _user_settings[key], "new": val}
        _user_settings[key] = val
    return {"settings": _user_settings, "changes": changes, "importedAt": datetime.utcnow().isoformat()}
