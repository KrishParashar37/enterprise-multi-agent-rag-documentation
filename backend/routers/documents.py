from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Document
from schemas import DocumentCreate, DocumentUpdate, DocumentResponse
from typing import List, Optional
import os, shutil, uuid
from datetime import datetime

router = APIRouter()
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    search: str = "", department: str = "", status: str = "",
    page: int = 1, limit: int = 50, db: Session = Depends(get_db)
):
    q = db.query(Document)
    if search:     q = q.filter(Document.name.ilike(f"%{search}%"))
    if department: q = q.filter(Document.department == department)
    if status:     q = q.filter(Document.status == status)
    return q.order_by(Document.created_at.desc()).offset((page-1)*limit).limit(limit).all()

@router.post("", response_model=DocumentResponse, status_code=201)
def create_document(body: DocumentCreate, db: Session = Depends(get_db)):
    doc = Document(
        id=str(uuid.uuid4()), name=body.name, original_name=body.name,
        type=body.type, department=body.department, category=body.category,
        description=body.description, access_level=body.access_level,
        status="UPLOADING", tags=[],
    )
    db.add(doc); db.commit(); db.refresh(doc)
    return doc

@router.post("/upload", status_code=201)
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    ext = file.filename.split(".")[-1].upper() if "." in file.filename else "TXT"
    valid = ["PDF","DOCX","TXT","MD","CSV"]
    if ext not in valid: raise HTTPException(400, f"Unsupported type. Use: {valid}")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_id   = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.{ext.lower()}")
    size = 0
    with open(file_path, "wb") as f:
        content = await file.read(); size = len(content); f.write(content)

    doc = Document(
        id=file_id, name=file.filename, original_name=file.filename,
        type=ext, storage_path=file_path, file_size=size,
        status="PROCESSING", tags=[],
    )
    db.add(doc); db.commit(); db.refresh(doc)
    return {"document": {"id": doc.id, "name": doc.name, "status": doc.status, "size": size}}

@router.patch("/{doc_id}", response_model=DocumentResponse)
def update_document(doc_id: str, body: DocumentUpdate, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc: raise HTTPException(404, "Document not found")
    for k, v in body.model_dump(exclude_none=True).items(): setattr(doc, k, v)
    doc.updated_at = datetime.utcnow()
    db.commit(); db.refresh(doc)
    return doc

@router.delete("/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc: raise HTTPException(404, "Document not found")
    if doc.storage_path and os.path.exists(doc.storage_path):
        os.remove(doc.storage_path)
    db.delete(doc); db.commit()
    return {"success": True}
