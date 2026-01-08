#!/bin/bash

# 一键启动前端和后端脚本

echo "Starting Frontend and Backend..."
echo ""

# 启动后端
(cd backend && npm run dev) &
BACKEND_PID=$!

# 启动前端
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# 捕获 Ctrl+C 信号
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# 等待两个进程
wait
