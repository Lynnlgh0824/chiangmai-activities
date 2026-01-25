#!/bin/bash
# 重启前端服务修复404问题

echo "🔄 重启前端服务..."
echo ""

PROJECT_DIR="/Users/yuzhoudeshengyin/Documents/my_project/Chiengmai"
cd "$PROJECT_DIR"

# 停止现有的Vite进程
echo "1️⃣ 停止现有Vite进程..."
pkill -f "vite" 2>/dev/null
sleep 2

# 重新启动前端
echo "2️⃣ 启动前端服务..."
npm run dev:client &

# 等待启动
echo "3️⃣ 等待服务启动..."
sleep 5

# 测试访问
echo "4️⃣ 测试访问..."
curl -I http://localhost:5173/ 2>&1 | grep "HTTP"

echo ""
echo "✅ 完成！请访问 http://localhost:5173/"
