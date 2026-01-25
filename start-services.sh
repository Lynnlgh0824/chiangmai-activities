#!/bin/bash
# 启动 Chiengmai 项目服务

echo "========================================="
echo "🚀 启动 Chiengmai 项目服务"
echo "========================================="
echo ""

PROJECT_DIR="/Users/yuzhoudeshengyin/Documents/my_project/Chiengmai"
cd "$PROJECT_DIR"

echo "📡 检查服务状态..."
FRONTEND_RUNNING=$(lsof -ti:5173)
BACKEND_RUNNING=$(lsof -ti:3000)

if [ -n "$FRONTEND_RUNNING" ]; then
    echo "✅ 前端服务已在运行 (PID: $FRONTEND_RUNNING)"
else
    echo "⚠️  前端服务未运行"
fi

if [ -n "$BACKEND_RUNNING" ]; then
    echo "✅ 后端服务已在运行 (PID: $BACKEND_RUNNING)"
else
    echo "⚠️  后端服务未运行"
fi

echo ""
echo "========================================="
echo "启动命令:"
echo "========================================="
echo ""
echo "方式1: 同时启动前后端（推荐）"
echo "  cd $PROJECT_DIR"
echo "  npm run dev"
echo ""
echo "方式2: 分别启动"
echo "  # 终端1 - 启动后端"
echo "  cd $PROJECT_DIR"
echo "  npm run dev:server"
echo ""
echo "  # 终端2 - 启动前端"
echo "  cd $PROJECT_DIR"
echo "  npm run dev:client"
echo ""
echo "========================================="
echo "启动后访问:"
echo "========================================="
echo "  前端: http://localhost:5173/"
echo "  后端: http://localhost:3000/api"
echo "  管理: http://localhost:5173/admin.html"
echo ""
