#!/bin/bash
# Chiengmai 项目完整测试脚本
# 使用方法: ./test-all-fixed.sh

set -e

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================="
echo "🧪 Chiengmai 项目完整测试"
echo "========================================="
echo ""

# 记录开始时间
START_TIME=$(date +%s)
echo "⏰ 开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 测试计数器
PASSED=0
FAILED=0

# 测试函数
run_test() {
    local test_name="$1"
    local test_command="$2"

    echo "🔍 测试: $test_name"

    if eval "$test_command" > /dev/null 2>&1; then
        echo "   ✅ 通过"
        ((PASSED++))
        return 0
    else
        echo "   ❌ 失败"
        ((FAILED++))
        return 1
    fi
}

echo "1️⃣ 服务状态测试"
echo "-------------------"
run_test "后端服务运行中" "curl -sf http://localhost:3000/api/health"
run_test "前端服务运行中" "curl -sf http://localhost:5173/"
echo ""

echo "2️⃣ API 功能测试"
echo "-------------------"
run_test "活动数据API" "curl -sf 'http://localhost:3000/api/activities?status=active&limit=1'"
run_test "健康检查API" "curl -sf http://localhost:3000/api/health"
echo ""

echo "3️⃣ 前端资源测试"
echo "-------------------"
run_test "main.jsx 可访问" "curl -sf http://localhost:5173/src/main.jsx"
run_test "App.jsx 可访问" "curl -sf http://localhost:5173/src/App.jsx"
echo ""

echo "4️⃣ 数据完整性测试"
echo "-------------------"
ACTIVITY_COUNT=$(curl -s "http://localhost:3000/api/activities?status=active&limit=1000" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['pagination']['totalItems'])" 2>/dev/null || echo "0")
if [ "$ACTIVITY_COUNT" -gt 0 ]; then
    echo "   ✅ 活动数据: $ACTIVITY_COUNT 条"
    ((PASSED++))
else
    echo "   ❌ 无法获取活动数据"
    ((FAILED++))
fi
echo ""

# 计算耗时
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "========================================="
echo "📊 测试总结"
echo "========================================="
echo ""
echo "✅ 通过: $PASSED"
echo "❌ 失败: $FAILED"
echo "⏱️  耗时: ${DURATION}秒"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 所有测试通过！"
    exit 0
else
    echo "⚠️  部分测试失败，请检查服务状态"
    exit 1
fi
