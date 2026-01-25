#!/bin/bash
# Chiengmai 项目服务重启脚本
# 使用方法: ./restart-fixed.sh

set -e

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔄 重启 Chiengmai 项目服务..."
echo ""

# 停止旧服务
echo "1️⃣ 停止现有服务..."
pkill -f "vite|nodemon|node.*server" 2>/dev/null || true
sleep 2

# 清除缓存
echo "2️⃣ 清除缓存..."
rm -rf node_modules/.vite dist .vite

# 启动新服务
echo "3️⃣ 启动服务..."
npm run dev &
echo ""
echo "✅ 服务已重启！"
echo ""
echo "🌐 访问地址:"
echo "   - 前端: http://localhost:5173/"
echo "   - 后端: http://localhost:3000/api"
echo ""
echo "💡 等待 5-10 秒后访问，让服务完全启动"
