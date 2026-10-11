@echo off
echo Starting all backend FastAPI microservices...

npx concurrently -n user,profile,ai-skin -c blue,green,magenta ^
  "python -m uvicorn app.main:app --reload --port 8000 --app-dir backend/user-service" ^
  "python -m uvicorn app.main:app --reload --port 8002 --app-dir backend/profile-service" ^
  "python -m uvicorn app.main:app --reload --port 8003 --app-dir backend/ai-skin-service"
