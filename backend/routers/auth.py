from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import LoginRequest
import hashlib, os, jwt
from datetime import datetime, timedelta

router = APIRouter()
SECRET = os.getenv("SECRET_KEY", "enterprise-secret-2025")

DEMO_USERS = {
    "rahul@enterprise.com":  {"id":"user-001","name":"Rahul Sharma", "role":"ADMIN"},
    "priya@enterprise.com":  {"id":"user-002","name":"Priya Singh",  "role":"MANAGER"},
    "amit@enterprise.com":   {"id":"user-003","name":"Amit Kumar",   "role":"ANALYST"},
    "sneha@enterprise.com":  {"id":"user-004","name":"Sneha Gupta",  "role":"EMPLOYEE"},
}

def make_token(payload: dict) -> str:
    payload["exp"] = datetime.utcnow() + timedelta(days=7)
    return jwt.encode(payload, SECRET, algorithm="HS256")

@router.post("/api/auth/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    # Try DB first
    user = db.query(User).filter(User.email == body.email).first()
    if user:
        hashed = hashlib.sha256(body.password.encode()).hexdigest()
        if user.password_hash != hashed:
            raise HTTPException(401, "Invalid credentials")
        token = make_token({"id": user.id, "email": user.email, "role": user.role, "name": user.name})
        return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}}

    # Demo fallback
    demo = DEMO_USERS.get(body.email)
    if not demo or body.password != "password":
        raise HTTPException(401, "Invalid credentials")
    token = make_token({**demo, "email": body.email})
    return {"token": token, "user": {**demo, "email": body.email}}
