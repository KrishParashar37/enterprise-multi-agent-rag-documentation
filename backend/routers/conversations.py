from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Conversation, Message
from schemas import ConversationCreate, ConversationUpdate, ConversationResponse, MessageResponse
from typing import List
import uuid
from datetime import datetime

router = APIRouter()

@router.get("", response_model=List[ConversationResponse])
def list_conversations(archived: bool = False, limit: int = 20, db: Session = Depends(get_db)):
    return db.query(Conversation).filter(Conversation.is_archived == archived)\
        .order_by(Conversation.updated_at.desc()).limit(limit).all()

@router.post("", response_model=ConversationResponse, status_code=201)
def create_conversation(body: ConversationCreate, db: Session = Depends(get_db)):
    conv = Conversation(id=str(uuid.uuid4()), title=body.title, category=body.category)
    db.add(conv); db.commit(); db.refresh(conv)
    return conv

@router.get("/{conv_id}/messages", response_model=List[MessageResponse])
def get_messages(conv_id: str, db: Session = Depends(get_db)):
    return db.query(Message).filter(Message.conversation_id == conv_id)\
        .order_by(Message.created_at.asc()).all()

@router.patch("/{conv_id}", response_model=ConversationResponse)
def update_conversation(conv_id: str, body: ConversationUpdate, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv: raise HTTPException(404, "Not found")
    for k, v in body.model_dump(exclude_none=True).items(): setattr(conv, k, v)
    conv.updated_at = datetime.utcnow()
    db.commit(); db.refresh(conv)
    return conv

@router.delete("/{conv_id}")
def delete_conversation(conv_id: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv: raise HTTPException(404, "Not found")
    db.query(Message).filter(Message.conversation_id == conv_id).delete()
    db.delete(conv); db.commit()
    return {"success": True}
