@echo off
echo Starting Enterprise RAG Backend...
cd /d "%~dp0backend"
python -m uvicorn main:app --reload --port 8000
