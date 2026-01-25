#!/bin/bash
# Chiengmai 项目自动化浏览器访问测试
# 用途：自动打开浏览器并验证页面可访问性
# 使用方法：./auto-browser-test.sh

set -e

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================="
echo "🌐 Chiengmai 自动化浏览器测试"
echo "========================================="
echo ""
echo "⏰ 开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 配置
FRONTEND_URL="http://localhost:5173"
ADMIN_URL="http://localhost:5173/admin.html"
API_URL="http://localhost:3000/api/health"
LOG_DIR="logs"
LOG_FILE="$LOG_DIR/auto-browser-$(date +%Y%m%d-%H%M%S).log"

# 创建日志目录
mkdir -p "$LOG_DIR"

# 测试计数器
PASS_COUNT=0
FAIL_COUNT=0

# 颜色定义
GREEN='\033[92m'
RED='\033[91m'
YELLOW='\033[93m'
NC='\033[0m'

# 测试函数
test_page() {
    local url="$1"
    local name="$2"

    echo -n "🔍 测试 $name... "

    # 使用 curl 测试页面
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1)

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ 通过${NC} (HTTP $HTTP_CODE)"
        ((PASS_COUNT++))
        return 0
    else
        echo -e "${RED}❌ 失败${NC} (HTTP $HTTP_CODE)"
        ((FAIL_COUNT++))
        return 1
    fi
}

# 详细测试函数
test_page_detailed() {
    local url="$1"
    local name="$2"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📄 测试: $name"
    echo "🔗 URL: $url"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # 测试可访问性
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1)

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ 页面可访问${NC} (HTTP $HTTP_CODE)"

        # 检查页面内容
        CONTENT=$(curl -s "$url" 2>&1)

        # 检查关键元素
        if echo "$CONTENT" | grep -q "清迈活动"; then
            echo -e "${GREEN}✅ 标题正确${NC}"
        else
            echo -e "${YELLOW}⚠️  标题可能有问题${NC}"
        fi

        if echo "$CONTENT" | grep -q "<html"; then
            echo -e "${GREEN}✅ HTML 结构正常${NC}"
        else
            echo -e "${YELLOW}⚠️  HTML 结构可能有问题${NC}"
        fi

        ((PASS_COUNT++))
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        return 0
    else
        echo -e "${RED}❌ 页面无法访问${NC} (HTTP $HTTP_CODE)"
        ((FAIL_COUNT++))
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        return 1
    fi
}

# 1. 测试前端主页
test_page_detailed "$FRONTEND_URL" "前端主页"

# 2. 测试管理页面
test_page_detailed "$ADMIN_URL" "管理页面"

# 3. 测试 API
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 测试: 后端 API"
echo "🔗 URL: $API_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

API_RESPONSE=$(curl -s "$API_URL" 2>&1)
if echo "$API_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ API 正常响应${NC}"
    echo "   响应: $(echo "$API_RESPONSE" | head -1)"
    ((PASS_COUNT++))
else
    echo -e "${RED}❌ API 响应异常${NC}"
    ((FAIL_COUNT++))
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 4. 测试关键资源
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 测试: 前端关键资源"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESOURCES=(
    "$FRONTEND_URL/src/main.jsx|main.jsx"
    "$FRONTEND_URL/src/App.jsx|App.jsx"
    "$FRONTEND_URL/src/App.css|App.css"
)

for resource in "${RESOURCES[@]}"; do
    URL="${resource%%|*}"
    NAME="${resource##*|}"

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL" 2>&1)

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅${NC} $NAME 加载正常"
        ((PASS_COUNT++))
    else
        echo -e "${RED}❌${NC} $NAME 加载失败 (HTTP $HTTP_CODE)"
        ((FAIL_COUNT++))
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 5. 生成测试报告
echo ""
echo "========================================="
echo "📊 测试报告"
echo "========================================="
echo ""
echo "⏰ 完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo -e "${GREEN}✅ 通过: $PASS_COUNT${NC}"
echo -e "${RED}❌ 失败: $FAIL_COUNT${NC}"
echo ""

# 保存日志
{
    echo "========================================="
    echo "测试时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "通过: $PASS_COUNT"
    echo "失败: $FAIL_COUNT"
    echo "========================================="
} >> "$LOG_FILE"

echo "📋 日志已保存到: $LOG_FILE"
echo ""

# 总体评估
TOTAL_TESTS=$((PASS_COUNT + FAIL_COUNT))
if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！系统运行正常！${NC}"
    echo ""
    echo "🌐 访问地址:"
    echo "   主页: $FRONTEND_URL"
    echo "   管理: $ADMIN_URL"
    echo "   API:  $API_URL"
    exit 0
else
    echo -e "${RED}⚠️  有 $FAIL_COUNT 个测试失败，请检查系统状态${NC}"
    echo ""
    echo "💡 建议操作:"
    echo "   1. 检查服务是否运行: npm run dev"
    echo "   2. 重启服务: ./restart-fixed.sh"
    echo "   3. 查看详细日志: cat $LOG_FILE"
    exit 1
fi
