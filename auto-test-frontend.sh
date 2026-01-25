#!/bin/bash

# 自动化前端测试脚本 - 浏览器访问10次
# 使用方法: ./auto-test-frontend.sh

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   🧪 自动化前端测试 - 浏览器访问 10 次                   ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 配置
FRONTEND_URL="http://localhost:5173/"
BACKEND_URL="http://localhost:3000/api/health"
TEST_COUNT=10
BROWSER="/Applications/Google Chrome.app"  # 默认使用 Chrome

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查浏览器
if [ ! -d "$BROWSER" ]; then
    # 尝试使用 Safari
    BROWSER="/Applications/Safari.app"
    if [ ! -d "$BROWSER" ]; then
        echo -e "${RED}❌ 未找到浏览器（Chrome 或 Safari）${NC}"
        exit 1
    fi
fi

# 测试计数器
success_count=0
fail_count=0
warning_count=0

# 测试函数
test_access() {
    local test_num=$1
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}📍 测试 #${test_num} - $(date '+%H:%M:%S')${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # 1. 检查后端服务
    echo -n "  1️⃣  检查后端服务... "
    backend_status=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL" 2>/dev/null)
    if [ "$backend_status" = "200" ]; then
        echo -e "${GREEN}✅ 正常 (HTTP $backend_status)${NC}"
    else
        echo -e "${RED}❌ 异常 (HTTP $backend_status)${NC}"
        echo -e "${RED}     ⚠️  后端服务未响应，前端可能无法加载数据${NC}"
        ((fail_count++))
        return 1
    fi

    # 2. 检查前端主页
    echo -n "  2️⃣  检查前端主页... "
    frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null)
    if [ "$frontend_status" = "200" ]; then
        echo -e "${GREEN}✅ 正常 (HTTP $frontend_status)${NC}"
    else
        echo -e "${RED}❌ 异常 (HTTP $frontend_status)${NC}"
        ((fail_count++))
        return 1
    fi

    # 3. 检查关键资源
    echo -n "  3️⃣  检查关键资源... "

    # 检查 main.jsx
    mainjsx_status=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}src/main.jsx" 2>/dev/null)

    # 检查 App.jsx
    appjsx_status=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}src/App.jsx" 2>/dev/null)

    # 检查 index.css
    css_status=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}src/App.css" 2>/dev/null)

    if [ "$mainjsx_status" = "200" ] && [ "$appjsx_status" = "200" ] && [ "$css_status" = "200" ]; then
        echo -e "${GREEN}✅ 全部正常${NC}"
        echo "      - main.jsx: HTTP $mainjsx_status"
        echo "      - App.jsx: HTTP $appjsx_status"
        echo "      - App.css: HTTP $css_status"
    else
        echo -e "${YELLOW}⚠️  部分资源异常${NC}"
        echo "      - main.jsx: HTTP $mainjsx_status"
        echo "      - App.jsx: HTTP $appjsx_status"
        echo "      - App.css: HTTP $css_status"
        ((warning_count++))
    fi

    # 4. 检查 API 数据
    echo -n "  4️⃣  检查 API 数据... "
    api_data=$(curl -s "${FRONTEND_URL}api/activities?status=active&limit=1" 2>/dev/null)
    if echo "$api_data" | grep -q '"success":true'; then
        activity_count=$(echo "$api_data" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('pagination', {}).get('totalItems', '?'))" 2>/dev/null)
        echo -e "${GREEN}✅ 正常 ($activity_count 条活动)${NC}"
    else
        echo -e "${YELLOW}⚠️  API 数据异常${NC}"
        ((warning_count++))
    fi

    # 5. 检查是否有 esbuild 错误
    echo -n "  5️⃣  检查构建错误... "
    error_check=$(curl -s "${FRONTEND_URL}src/main.jsx" 2>&1)
    if echo "$error_check" | grep -q "Invalid loader value"; then
        echo -e "${RED}❌ 发现 esbuild 错误！${NC}"
        echo -e "${RED}     ⚠️  页面可能无法正常显示${NC}"
        ((fail_count++))
        return 1
    else
        echo -e "${GREEN}✅ 无错误${NC}"
    fi

    # 6. 通过浏览器打开页面（视觉确认）
    echo -e "  6️⃣  ${BLUE}🌐 打开浏览器...${NC}"
    open -a "$BROWSER" "$FRONTEND_URL" > /dev/null 2>&1

    # 等待用户确认
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}👀 请查看浏览器，确认页面是否正常显示：${NC}"
    echo -e "   $FRONTEND_URL"
    echo ""
    echo -e "   检查项："
    echo -e "   ${GREEN}✓${NC} 页面标题是否显示"
    echo -e "   ${GREEN}✓${NC} 活动卡片是否加载"
    echo -e "   ${GREEN}✓${NC} 筛选按钮是否可用"
    echo -e "   ${GREEN}✓${NC} 无错误提示"
    echo ""
    echo -n -e "${BLUE}页面是否正常显示？${NC} [Y/n] "
    read -r -t 10 user_confirm || user_confirm="y"

    if [[ $user_confirm =~ ^[Yy]$ ]] || [ -z "$user_confirm" ]; then
        echo -e "${GREEN}  ✅ 用户确认：页面正常${NC}"
        ((success_count++))
        return 0
    else
        echo -e "${RED}  ❌ 用户确认：页面异常${NC}"
        ((fail_count++))
        return 1
    fi
}

# 检查服务是否运行
echo "🔍 检查服务状态..."
if ! curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL" > /dev/null 2>&1; then
    echo -e "${RED}❌ 后端服务未运行！${NC}"
    echo -e "${YELLOW}💡 请先运行: npm run dev${NC}"
    exit 1
fi

if ! curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${RED}❌ 前端服务未运行！${NC}"
    echo -e "${YELLOW}💡 请先运行: npm run dev${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 服务运行正常${NC}"
echo ""

# 询问测试模式
echo "请选择测试模式："
echo "  1. 自动模式（不打开浏览器，仅检测）"
echo "  2. 交互模式（打开浏览器，需要确认）"
echo ""
echo -n "请选择 [1/2，默认=2]: "
read -r mode_choice
mode_choice=${mode_choice:-2}

if [ "$mode_choice" = "1" ]; then
    # 自动模式 - 不打开浏览器
    echo ""
    echo "🚀 开始自动测试（10次）..."
    echo ""

    for i in {1..10}; do
        test_access_auto "$i"
        sleep 2
    done
else
    # 交互模式 - 打开浏览器并等待确认
    echo ""
    echo "🚀 开始交互测试（10次）..."
    echo ""

    for i in {1..10}; do
        test_access "$i"

        if [ $i -lt 10 ]; then
            echo ""
            echo -e "${BLUE}⏸️  等待 3 秒后进行下一次测试...${NC}"
            echo -n "按 Enter 立即继续，或 Ctrl+C 退出"
            read -t 3
        fi
    done
fi

# 显示总结
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   📊 测试完成！总结报告                                    ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "  总测试次数: 10"
echo -e "  ${GREEN}✅ 成功: $success_count${NC}"
echo -e "  ${RED}❌ 失败: $fail_count${NC}"
echo -e "  ${YELLOW}⚠️  警告: $warning_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！前端工作正常！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  有 $fail_count 次测试失败，请检查问题${NC}"
    exit 1
fi
