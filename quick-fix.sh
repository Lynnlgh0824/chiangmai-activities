#!/bin/bash

echo "🔧 清迈活动平台 - 主页快速修复"
echo ""

echo "步骤 1: 停止所有服务..."
pkill -f "node.*vite" 2>/dev/null
pkill -f "node.*nodemon" 2>/dev/null
sleep 2
echo "✅ 服务已停止"
echo ""

echo "步骤 2: 清除 Vite 缓存..."
rm -rf node_modules/.vite
rm -rf node_modules/.vite-deps
echo "✅ 缓存已清除"
echo ""

echo "步骤 3: 重启开发服务器..."
npm run dev > /tmp/dev-server.log 2>&1 &
DEV_PID=$!
echo "✅ 服务已启动 (PID: $DEV_PID)"
echo ""

echo "等待 8 秒让服务启动..."
sleep 8

echo ""
echo "📋 服务器日志:"
tail -20 /tmp/dev-server.log
echo ""

echo "🔍 测试主页加载..."
curl -s http://localhost:5173 | head -10
echo ""

echo "✅ 修复完成！"
echo ""
echo "请在浏览器访问 http://localhost:5173 查看结果"
echo "如果还有问题，请查看 COMPLETE-FIX-GUIDE.md 获取更多方案"
