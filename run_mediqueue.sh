#!/bin/bash

# MediQueue 一键启动脚本 (Bash 版)

# 1. 检查并引导配置 API Key
ENV_FILE="api/.env"
EXAMPLE_FILE="api/.env.example"

if [ ! -f "$ENV_FILE" ]; then
    echo "--- 首次运行配置 ---"
    if [ -f "$EXAMPLE_FILE" ]; then
        cp "$EXAMPLE_FILE" "$ENV_FILE"
    else
        touch "$ENV_FILE"
    fi
fi

# 检查 DEEPSEEK_API_KEY 是否已配置
if ! grep -q "DEEPSEEK_API_KEY=sk-" "$ENV_FILE"; then
    echo "请输入您的 DeepSeek API Key (例如 sk-xxx):"
    read -r API_KEY
    if [[ $API_KEY == sk-* ]]; then
        # 替换或追加 API Key
        if grep -q "DEEPSEEK_API_KEY=" "$ENV_FILE"; then
            sed -i "s/DEEPSEEK_API_KEY=.*/DEEPSEEK_API_KEY=$API_KEY/" "$ENV_FILE"
        else
            echo "DEEPSEEK_API_KEY=$API_KEY" >> "$ENV_FILE"
        fi
        echo "API Key 已保存至 $ENV_FILE"
    else
        echo "警告: 无效的 API Key 格式。程序将尝试继续运行，但 AI 评估功能可能失效。"
    fi
fi

echo "--- 正在启动 MediQueue 全栈服务 ---"

# 2. 启动后端 (后台运行)
echo "[1/2] 正在启动 FastAPI 后端 (端口 8000)..."
cd api
uv run uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 等待后端就绪
sleep 2

# 3. 启动前端各端视图
echo "[2/2] 正在启动 Web 前端服务群..."
cd web

# 启动四个前端入口
echo "  > 联动中心 (Sandbox): http://127.0.0.1:5176"
npm run dev:center > sandbox.log 2>&1 &

echo "  > 医生诊室: http://127.0.0.1:5173"
npm run dev:doctor > doctor.log 2>&1 &

echo "  > 候诊大屏: http://127.0.0.1:5174"
npm run dev:tv > tv.log 2>&1 &

echo "  > 患者移动端: http://127.0.0.1:5175"
npm run dev:mobile > mobile.log 2>&1 &

echo "------------------------------------------------"
echo "MediQueue 已全线启动！"
echo "按 Ctrl+C 停止所有服务"
echo "------------------------------------------------"

# 捕获退出信号并关闭所有后台进程
trap "kill $BACKEND_PID $(jobs -p); exit" INT
wait
