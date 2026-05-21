#!/bin/bash

# MediQueue One-click Startup Script (Bash) - Single Frontend Mode

# 1. Config API Key
ENV_FILE="api/.env"
EXAMPLE_FILE="api/.env.example"

if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$EXAMPLE_FILE" ]; then cp "$EXAMPLE_FILE" "$ENV_FILE"; else touch "$ENV_FILE"; fi
fi

if ! grep -q "DEEPSEEK_API_KEY=sk-" "$ENV_FILE"; then
    echo "Please enter your DeepSeek API Key (e.g., sk-xxx):"
    read -r API_KEY
    if [[ $API_KEY == sk-* ]]; then
        if grep -q "DEEPSEEK_API_KEY=" "$ENV_FILE"; then sed -i "s/DEEPSEEK_API_KEY=.*/DEEPSEEK_API_KEY=$API_KEY/" "$ENV_FILE"; else echo "DEEPSEEK_API_KEY=$API_KEY" >> "$ENV_FILE"; fi
    fi
fi

# 2. Dependency Installation
echo "--- Installing Dependencies ---"
cd api && uv sync && cd ..
cd web && npm install && cd ..

echo "--- Starting MediQueue Full Stack ---"

# 3. Start Backend
echo "[1/2] Starting FastAPI Backend (Port 8000)..."
cd api
uv run uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 4. Start Single Frontend (Port 5173)
echo "[2/2] Starting Web Frontend (Port 5173)..."
cd web
npm run dev:doctor > frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 2

echo "------------------------------------------------"
echo "MediQueue is now running!"
echo ""
echo "Recommended:"
echo "  > Sandbox: http://127.0.0.1:5173/?view=sandbox"
echo ""
echo "Standalone:"
echo "  > Doctor:  http://127.0.0.1:5173/?view=doctor"
echo "  > TV:      http://127.0.0.1:5173/?view=tv"
echo "  > Mobile:  http://127.0.0.1:5173/?view=mobile"
echo "------------------------------------------------"
echo "Press Ctrl+C to stop all services."

cleanup() {
    echo ""
    echo "Stopping all services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    pkill -P $$ 2>/dev/null
    exit
}

trap cleanup INT
wait
