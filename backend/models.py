"""SQLAlchemy ORM models"""
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import uuid

def gen_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id           = Column(String(36), primary_key=True, default=gen_uuid)
    email        = Column(String(255), unique=True, nullable=False)
    name         = Column(String(255), nullable=False)
    password_hash= Column(String(255), nullable=False)
    role         = Column(String(50), default="EMPLOYEE")   # ADMIN/MANAGER/ANALYST/EMPLOYEE
    tenant_id    = Column(String(100), default="default")
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    conversations = relationship("Conversation", back_populates="user")
    documents     = relationship("Document", back_populates="owner")

class Document(Base):
    __tablename__ = "documents"
    id            = Column(String(36), primary_key=True, default=gen_uuid)
    name          = Column(String(500), nullable=False)
    original_name = Column(String(500), nullable=False)
    type          = Column(String(20), nullable=False)       # PDF/DOCX/TXT/MD/CSV
    storage_path  = Column(String(1000))
    owner_id      = Column(String(36), ForeignKey("users.id"))
    tenant_id     = Column(String(100), default="default")
    version       = Column(String(50), default="1.0")
    status        = Column(String(50), default="UPLOADING")  # UPLOADING/PROCESSING/INDEXED/FAILED
    category      = Column(String(100))
    department    = Column(String(100))
    tags          = Column(JSON, default=list)
    chunk_count   = Column(Integer, default=0)
    page_count    = Column(Integer, default=0)
    file_size     = Column(Integer, default=0)
    access_level  = Column(String(50), default="employee")
    description   = Column(Text)
    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="documents")

class Conversation(Base):
    __tablename__ = "conversations"
    id          = Column(String(36), primary_key=True, default=gen_uuid)
    user_id     = Column(String(36), ForeignKey("users.id"))
    title       = Column(String(500), default="New Conversation")
    is_pinned   = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    category    = Column(String(100))
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user     = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete")

class Message(Base):
    __tablename__ = "messages"
    id              = Column(String(36), primary_key=True, default=gen_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id"))
    role            = Column(String(20), nullable=False)  # user/assistant/system
    content         = Column(Text, nullable=False)
    citations       = Column(JSON, default=list)
    agent_trace     = Column(JSON, default=list)
    feedback        = Column(Integer)                     # 1=up, -1=down
    tokens_used     = Column(Integer, default=0)
    latency_ms      = Column(Integer, default=0)
    created_at      = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")

class AgentRun(Base):
    __tablename__ = "agent_runs"
    id              = Column(String(36), primary_key=True, default=gen_uuid)
    trace_id        = Column(String(100), nullable=False)
    agent_name      = Column(String(50), nullable=False)
    status          = Column(String(50), default="RUNNING")
    model           = Column(String(100))
    input_tokens    = Column(Integer, default=0)
    output_tokens   = Column(Integer, default=0)
    latency_ms      = Column(Integer, default=0)
    cost            = Column(Float, default=0.0)
    user_id         = Column(String(36), ForeignKey("users.id"))
    conversation_id = Column(String(36), ForeignKey("conversations.id"))
    query           = Column(Text)
    error           = Column(Text)
    run_metadata    = Column(JSON, default=dict)
    created_at      = Column(DateTime, default=datetime.utcnow)

class Evaluation(Base):
    __tablename__ = "evaluations"
    id               = Column(String(36), primary_key=True, default=gen_uuid)
    message_id       = Column(String(36), ForeignKey("messages.id"))
    dataset_name     = Column(String(200))
    question         = Column(Text, nullable=False)
    expected_answer  = Column(Text)
    generated_answer = Column(Text, nullable=False)
    faithfulness     = Column(Float)
    answer_relevance = Column(Float)
    context_recall   = Column(Float)
    citation_accuracy= Column(Float)
    overall_score    = Column(Float)
    passed           = Column(Boolean)
    created_at       = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id         = Column(String(36), primary_key=True, default=gen_uuid)
    user_id    = Column(String(36), ForeignKey("users.id"))
    title      = Column(String(255), nullable=False)
    message    = Column(Text, nullable=False)
    type       = Column(String(50), default="info")
    is_read    = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
