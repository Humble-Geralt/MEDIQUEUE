#!/bin/bash

# MediQueue One-click Startup Script (Bash)

# 1. Config API Key
ENV_FILE="api/.env"
EXAMPLE_FILE="api/.env.example"

if [ ! -f "$ENV_FILE" ]; then
    echo "--- First Run Configuration ---"
    if [ -f "$EXAMPLE_FILE" ]; then
        cp "$EXAMPLE_FILE" "$ENV_FILE"
    else
        touch "$ENV_FILE"
    fi
fi

if ! grep -q "DEEPSEEK_API_KEY=sk-" "$ENV_FILE"; then
    echo "Please enter your DeepSeek API Key (e.g., sk-xxx):"
    read -r API_KEY
    if [[ $API_KEY == sk-* ]]; then
        if grep -q "DEEPSEEK_API_KEY=" "$ENV_FILE"; then
            sed -i "s/DEEPSEEK_API_KEY=.*/DEEPSEEK_API_KEY=$API_KEY/" "$ENV_FILE"
        else
            echo "DEEPSEEK_API_KEY=$API_KEY" >> "$ENV_FILE"
        fi
        echo "API Key saved to $ENV_FILE"
    else
        echo "Warning: Invalid API Key format."
    fi
fi

echo "--- Starting MediQueue Full Stack ---"

# 2. Start Backend
echo "[1/2] Starting FastAPI Backend (Port 8000)..."
cd api
uv run uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 2

# 3. Start Frontends
echo "[2/2] Starting Web Frontends..."
cd web

# Use a process group to manage cleanup effectively
npm run dev:center > sandbox.log 2>&1 &
SANDBOX_PID=$!

npm run dev:doctor > doctor.log 2>&1 &
DOCTOR_PID=$!

npm run dev:tv > tv.log 2>&1 &
TV_PID=$!

npm run dev:mobile > mobile.log 2>&1 &
MOBILE_PID=$!

echo "------------------------------------------------"
echo "MediQueue is now running!"
echo "  > Sandbox: http://127.0.0.1:5176"
echo "  > Doctor:  http://127.0.0.1:5173"
echo "  > TV:      http://127.0.0.1:5174"
echo "  > Mobile:  http://127.0.0.1:5175"
echo "------------------------------------------------"
echo "Press Ctrl+C to stop all services."

# Cleanup function to kill all background processes and their children
cleanup() {
    echo ""
    echo "Stopping all services..."
    # Kill the entire process group if supported, or individual PIDs
    kill $BACKEND_PID $SANDBOX_PID $DOCTOR_PID $TV_PID $MOBILE_PID 2>/dev/null
    # Additional sweep for node/vite/uvicorn if any remain orphaned
    pkill -P $$ 2>/dev/null
    exit
}

trap cleanup INT

# Keep the script alive
wait
