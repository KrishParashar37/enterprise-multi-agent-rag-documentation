from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from schemas import ChatRequest
from rag_engine import run_rag_pipeline
from groq import Groq
import os, json

router = APIRouter()
GROQ_KEY = os.getenv("GROQ_API_KEY", "")
client = Groq(api_key=GROQ_KEY) if GROQ_KEY else None

# ── Streaming endpoint ────────────────────────────
@router.post("/stream")
async def chat_stream(body: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in body.messages]

    async def generate():
        if not client:
            yield f"data: {json.dumps({'content': 'No GROQ_API_KEY set. Using mock mode.'})}\n\n"
            yield "data: [DONE]\n\n"
            return
        try:
            stream = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[{"role":"system","content":"You are an Enterprise AI assistant. Be helpful and concise."}] + messages,
                temperature=0.7, max_tokens=2048, stream=True,
            )
            for chunk in stream:
                content = chunk.choices[0].delta.content or ""
                if content:
                    yield f"data: {json.dumps({'content': content})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

# ── Full RAG pipeline ─────────────────────────────
@router.post("")
def chat_rag(body: ChatRequest):
    history = [{"role": m.role, "content": m.content} for m in body.messages[:-1]]
    query   = body.messages[-1].content if body.messages else ""
    result  = run_rag_pipeline(query, history)
    return result
