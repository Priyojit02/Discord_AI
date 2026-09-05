#!/bin/bash

echo "🚀 Starting Discord Full-Stack Suite..."

# Start Spring Boot backend
echo "▶ Starting Spring Boot backend on :8080..."
cd backend && mvn spring-boot:run &
BACKEND_PID=$!
cd ..

# Start Python AI Service
echo "▶ Starting Python AI Service (MVC + Bedrock Claude Sonnet) on :8000..."
cd ai_service && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
AI_PID=$!
cd ..

# Wait for backend to be ready
echo "⏳ Waiting for Spring Boot backend..."
until curl -s http://localhost:8080/api/auth/login > /dev/null 2>&1; do
  sleep 2
done

# Start Next.js frontend
echo "▶ Starting Next.js frontend on :3000..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Discord Clone is running with AI Service Layer!"
echo "   Frontend:       http://localhost:3000"
echo "   Spring Backend: http://localhost:8080"
echo "   Python AI API:  http://localhost:8000"
echo "   AI Docs:        http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers."

trap "kill $BACKEND_PID $AI_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
