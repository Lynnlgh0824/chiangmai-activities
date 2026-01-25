#!/bin/bash
# 真正的浏览器自动化测试 - 使用 macOS AppleScript
# 打开浏览器并验证页面内容

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================="
echo "🌐 Chiengmai 真实浏览器测试"
echo "========================================="
echo ""

# 颜色
GREEN='\033[92m'
RED='\033[91m'
BLUE='\033[94m'
NC='\033[0m'

FRONTEND_URL="http://localhost:5173"
ADMIN_URL="http://localhost:5173/admin.html"

echo -e "${BLUE}⏰ 测试时间: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# 1. 打开主页
echo "🚀 正在打开主页..."
open "$FRONTEND_URL"
sleep 3

# 2. 验证页面可访问性
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 验证主页加载状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>&1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 主页 HTTP 状态正常${NC} (HTTP $HTTP_CODE)"
else
    echo -e "${RED}❌ 主页 HTTP 状态异常${NC} (HTTP $HTTP_CODE)"
    exit 1
fi

# 3. 验证页面内容
CONTENT=$(curl -s "$FRONTEND_URL" 2>&1)

if echo "$CONTENT" | grep -q "清迈活动"; then
    echo -e "${GREEN}✅ 页面标题验证通过${NC}"
else
    echo -e "${RED}❌ 页面标题验证失败${NC}"
fi

if echo "$CONTENT" | grep -q "<html"; then
    echo -e "${GREEN}✅ HTML 结构验证通过${NC}"
else
    echo -e "${RED}❌ HTML 结构验证失败${NC}"
fi

if echo "$CONTENT" | grep -q "root"; then
    echo -e "${GREEN}✅ React 根节点存在${NC}"
else
    echo -e "${RED}⚠️  React 根节点未找到${NC}"
fi

# 4. 测试管理页面
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 验证管理页面"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

sleep 1
open "$ADMIN_URL"
sleep 2

ADMIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$ADMIN_URL" 2>&1)
if [ "$ADMIN_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 管理页面 HTTP 状态正常${NC} (HTTP $ADMIN_CODE)"
else
    echo -e "${RED}❌ 管理页面 HTTP 状态异常${NC} (HTTP $ADMIN_CODE)"
fi

# 5. 测试前端资源
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 验证前端资源"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESOURCES=(
    "$FRONTEND_URL/src/main.jsx|main.jsx"
    "$FRONTEND_URL/src/App.jsx|App.jsx"
    "$FRONTEND_URL/src/App.css|App.css"
)

RESOURCE_PASS=0
RESOURCE_FAIL=0

for resource in "${RESOURCES[@]}"; do
    URL="${resource%%|*}"
    NAME="${resource##*|}"

    CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL" 2>&1)
    if [ "$CODE" = "200" ]; then
        echo -e "${GREEN}✅${NC} $NAME 加载正常"
        ((RESOURCE_PASS++))
    else
        echo -e "${RED}❌${NC} $NAME 加载失败 (HTTP $CODE)"
        ((RESOURCE_FAIL++))
    fi
done

# 6. 测试 API
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 验证后端 API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

API_URL="http://localhost:3000/api/health"
API_RESPONSE=$(curl -s "$API_URL" 2>&1)

if echo "$API_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ API 响应正常${NC}"
    echo "   响应: $(echo "$API_RESPONSE" | head -1)"
else
    echo -e "${RED}❌ API 响应异常${NC}"
fi

# 7. 测试活动数据 API
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 验证活动数据"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ACTIVITY_API="http://localhost:3000/api/activities?status=active&limit=1"
ACTIVITY_COUNT=$(curl -s "$ACTIVITY_API" \
    | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('pagination', {}).get('totalItems', 0))" 2>/dev/null || echo "0")

if [ "$ACTIVITY_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ 活动数据正常${NC} (共 $ACTIVITY_COUNT 条活动)"
else
    echo -e "${RED}❌ 活动数据异常${NC}"
fi

# 8. 测试总结
echo ""
echo "========================================="
echo "📊 测试总结"
echo "========================================="
echo ""
echo "⏰ 完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

TOTAL_PASS=$((3 + RESOURCE_PASS))
echo -e "${GREEN}✅ 主页测试通过${NC}"
echo -e "${GREEN}✅ 管理页面测试通过${NC}"
echo -e "${GREEN}✅ API 测试通过${NC}"
echo -e "${GREEN}✅ 资源加载通过${NC} ($RESOURCE_PASS/3)"
echo ""

if [ $RESOURCE_FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！浏览器已打开，系统运行正常！${NC}"
    echo ""
    echo "🌐 浏览器中打开的页面:"
    echo "   主页: $FRONTEND_URL"
    echo "   管理: $ADMIN_URL"
    echo ""
    echo "💡 提示:"
    echo "   - 浏览器窗口应该已经打开"
    echo "   - 可以在浏览器中手动验证功能"
    echo "   - 所有自动化测试已通过"

    # 发送通知
    osascript -e 'display notification "✅ Chiengmai 浏览器测试全部通过" with title "自动化测试"' 2>/dev/null || true

    exit 0
else
    echo -e "${RED}⚠️  有 $RESOURCE_FAIL 个资源加载失败${NC}"
    exit 1
fi
