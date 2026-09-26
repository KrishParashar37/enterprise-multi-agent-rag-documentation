"""API Key management — create, list, revoke with scoped permissions"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid, secrets, random

router = APIRouter(tags=["api-keys"])

def _gen_key():
    return f"rag_{secrets.token_hex(24)}"

_keys = [
    {"id": str(uuid.uuid4()), "name": "Production Frontend", "key": "rag_" + "x" * 44 + "...a1b2", "keyPreview": "rag_xxxx...a1b2", "scopes": ["read", "chat"], "status": "active", "createdAt": "2026-08-01T10:00:00Z", "lastUsedAt": "2026-09-16T22:15:00Z", "requestsToday": 1420, "requestsTotal": 48200, "expiresAt": "2027-08-01T10:00:00Z", "sparkline": [random.randint(800, 1600) for _ in range(14)]},
    {"id": str(uuid.uuid4()), "name": "Mobile App", "key": "rag_" + "y" * 44 + "...c3d4", "keyPreview": "rag_yyyy...c3d4", "scopes": ["read", "chat", "search"], "status": "active", "createdAt": "2026-09-01T14:00:00Z", "lastUsedAt": "2026-09-16T21:45:00Z", "requestsToday": 560, "requestsTotal": 8400, "expiresAt": "2027-09-01T14:00:00Z", "sparkline": [random.randint(300, 700) for _ in range(14)]},
    {"id": str(uuid.uuid4()), "name": "CI/CD Pipeline", "key": "rag_" + "z" * 44 + "...e5f6", "keyPreview": "rag_zzzz...e5f6", "scopes": ["read", "write", "admin"], "status": "active", "createdAt": "2026-07-15T08:00:00Z", "lastUsedAt": "2026-09-16T18:30:00Z", "requestsToday": 89, "requestsTotal": 3200, "expiresAt": "2027-01-15T08:00:00Z", "sparkline": [random.randint(50, 150) for _ in range(14)]},
    {"id": str(uuid.uuid4()), "name": "Deprecated Key", "key": "rag_old_revoked", "keyPreview": "rag_old_...revoked", "scopes": ["read"], "status": "revoked", "createdAt": "2026-05-01T10:00:00Z", "lastUsedAt": "2026-06-15T12:00:00Z", "requestsToday": 0, "requestsTotal": 12000, "expiresAt": None, "sparkline": [0] * 14},
]
_store = {k["id"]: k for k in _keys}

VALID_SCOPES = ["read", "write", "chat", "search", "admin", "documents", "analytics"]

@router.get("/api/api-keys")
def list_api_keys():
    return {"keys": list(_store.values()), "availableScopes": VALID_SCOPES}

class CreateKeyRequest(BaseModel):
    name: str
    scopes: List[str]
    expiresInDays: Optional[int] = 365

@router.post("/api/api-keys")
def create_api_key(body: CreateKeyRequest):
    new_key = _gen_key()
    key_obj = {
        "id": str(uuid.uuid4()),
        "name": body.name,
        "key": new_key,
        "keyPreview": new_key[:8] + "..." + new_key[-4:],
        "scopes": body.scopes,
        "status": "active",
        "createdAt": datetime.utcnow().isoformat(),
        "lastUsedAt": None,
        "requestsToday": 0,
        "requestsTotal": 0,
        "expiresAt": None,
        "sparkline": [0] * 14,
    }
    _store[key_obj["id"]] = key_obj
    return {"key": key_obj, "secretKey": new_key}

@router.delete("/api/api-keys/{key_id}")
def revoke_api_key(key_id: str):
    if key_id not in _store:
        raise HTTPException(404, "API key not found")
    _store[key_id]["status"] = "revoked"
    return {"message": "Key revoked", "key": _store[key_id]}
