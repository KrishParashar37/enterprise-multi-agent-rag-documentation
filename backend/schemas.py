"""Pydantic request/response schemas"""
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

# ── Auth ──────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: dict

# ── User ──────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: str  # plain str — email-validator not required
    password: str
    role: str = "EMPLOYEE"

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    class Config: from_attributes = True

class UserUpdate(BaseModel):
    name:      Optional[str]  = None
    role:      Optional[str]  = None
    is_active: Optional[bool] = None

# ── Document ──────────────────────────────────────
class DocumentCreate(BaseModel):
    name:         str
    type:         str
    department:   Optional[str] = None
    category:     Optional[str] = None
    description:  Optional[str] = None
    access_level: str = "employee"

class DocumentResponse(BaseModel):
    id:           str
    name:         str
    original_name:str
    type:         str
    status:       str
    department:   Optional[str]
    category:     Optional[str]
    chunk_count:  int
    page_count:   int
    file_size:    int
    access_level: str
    tags:         List[str]
    description:  Optional[str]
    created_at:   datetime
    updated_at:   datetime
    class Config: from_attributes = True

class DocumentUpdate(BaseModel):
    name:         Optional[str] = None
    status:       Optional[str] = None
    department:   Optional[str] = None
    description:  Optional[str] = None
    access_level: Optional[str] = None

# ── Conversation ──────────────────────────────────
class ConversationCreate(BaseModel):
    title:    str = "New Conversation"
    category: Optional[str] = None

class ConversationUpdate(BaseModel):
    title:       Optional[str]  = None
    is_pinned:   Optional[bool] = None
    is_archived: Optional[bool] = None

class ConversationResponse(BaseModel):
    id:          str
    title:       str
    is_pinned:   bool
    is_archived: bool
    category:    Optional[str]
    created_at:  datetime
    updated_at:  datetime
    class Config: from_attributes = True

# ── Chat ──────────────────────────────────────────
class ChatMessage(BaseModel):
    role:    str
    content: str

class ChatRequest(BaseModel):
    messages:        List[ChatMessage]
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    conversation_id: str
    message_id:      str
    answer:          str
    citations:       List[dict]
    agent_trace:     List[dict]
    tokens_used:     int
    latency_ms:      int
    model:           str

# ── Message ───────────────────────────────────────
class MessageResponse(BaseModel):
    id:              str
    role:            str
    content:         str
    citations:       List[Any]
    agent_trace:     List[Any]
    tokens_used:     Optional[int]
    latency_ms:      Optional[int]
    created_at:      datetime
    class Config: from_attributes = True

class FeedbackRequest(BaseModel):
    message_id: str
    feedback:   int  # 1 = thumbs up, -1 = thumbs down

# ── Search ────────────────────────────────────────
class SearchRequest(BaseModel):
    query:        str
    mode:         str = "hybrid"   # hybrid / semantic / keyword
    department:   str = "All"
    type:         str = "All"
    min_relevance:float = 0.0
    limit:        int = 10

class SearchResult(BaseModel):
    id:            str
    document_name: str
    department:    str
    type:          str
    page:          int
    section:       str
    excerpt:       str
    relevance:     float
    date:          str

# ── Evaluation ────────────────────────────────────
class EvaluationCreate(BaseModel):
    dataset_name:     str
    question:         str
    expected_answer:  str
    generated_answer: str

class EvaluationResponse(BaseModel):
    id:               str
    dataset_name:     Optional[str]
    question:         str
    expected_answer:  Optional[str]
    generated_answer: str
    faithfulness:     Optional[float]
    answer_relevance: Optional[float]
    context_recall:   Optional[float]
    citation_accuracy:Optional[float]
    overall_score:    Optional[float]
    passed:           Optional[bool]
    created_at:       datetime
    class Config: from_attributes = True
