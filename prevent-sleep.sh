#!/bin/bash
# 阻止系统睡眠（合盖继续工作）
# 使用 Ctrl+C 停止

echo "✅ 已启动防睡眠模式"
echo "💻 合盖后电脑将继续运行"
echo "⚠️  注意：这会增加电池消耗"
echo ""
echo "按 Ctrl+C 停止..."
echo ""

caffeinate -d -i -s &
CAFFEINATE_PID=$!

echo "进程 PID: $CAFFEINATE_PID"
echo ""
echo "停止方法："
echo "1. 按 Ctrl+C"
echo "2. 或运行: kill $CAFFEINATE_PID"

# 等待用户中断
wait $CAFFEINATE_PID
