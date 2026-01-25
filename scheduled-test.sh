#!/bin/bash
# Chiengmai 项目定时测试脚本
# 用途：定期自动运行浏览器测试
# 使用方法：./scheduled-test.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================="
echo "⏰ Chiengmai 定时自动化测试"
echo "========================================="
echo ""

# 运行自动化测试
if [ -f "./auto-browser-test.py" ]; then
    python3 ./auto-browser-test.py
elif [ -f "./auto-browser-test.sh" ]; then
    bash ./auto-browser-test.sh
else
    echo "❌ 找不到测试脚本"
    exit 1
fi

# 测试结果
TEST_RESULT=$?

# 发送通知（macOS）
if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ 测试通过" | osascript -e 'display notification "Chiengmai 测试" with message "✅ 测试通过"' 2>/dev/null || true
else
    echo "❌ 测试失败" | osascript -e 'display notification "Chiengmai 测试" with message "❌ 测试失败"' 2>/dev/null || true
fi

exit $TEST_RESULT
