#!/bin/bash

echo "🚀 启动开发服务器并诊断..."

# 启动服务
npm run dev > /tmp/vite-output.log 2>&1 &
DEV_PID=$!

echo "✅ 服务已启动 (PID: $DEV_PID)"
echo "⏳ 等待 8 秒让服务完全启动..."

sleep 8

# 检查日志
echo ""
echo "📋 Vite 服务器日志:"
echo "=========================================="
tail -50 /tmp/vite-output.log
echo "=========================================="

# 测试主页
echo ""
echo "🔍 测试主页加载..."
node test-real-rendering.js

# 清理
kill $DEV_PID 2>/dev/null

echo ""
echo "✅ 诊断完成"
