#!/bin/bash

# 完全自动化的前端检查脚本 - 10次
# 使用方法: ./auto-check-10times.sh

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   🤖 完全自动化检查 - 10次                                ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

FRONTEND_URL="http://localhost:5173/"
BACKEND_URL="http://localhost:3000/api/activities?status=active"

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 计数器
total_tests=0
pass_tests=0
fail_tests=0

# 详细检查函数
detailed_check() {
    local test_num=$1

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${CYAN}🔍 第 $test_num 次检查 - $(date '+%H:%M:%S')${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    ((total_tests++))
    local test_passed=true
    local check_results=()

    # 1. 后端健康检查
    echo -e "${BLUE}1️⃣  后端服务检查...${NC}"
    backend_start=$(date +%s%N)
    backend_http=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BACKEND_URL" 2>/dev/null)
    backend_time=$((($(date +%s%N) - backend_start) / 1000000))

    if [ "$backend_http" = "200" ]; then
        echo -e "   ${GREEN}✅ 后端正常${NC} (HTTP $backend_http, ${backend_time}ms)"
        check_results+=("backend:PASS")
    else
        echo -e "   ${RED}❌ 后端异常${NC} (HTTP $backend_http)"
        check_results+=("backend:FAIL")
        test_passed=false
    fi

    # 2. 前端主页检查
    echo -e "${BLUE}2️⃣  前端主页检查...${NC}"
    frontend_start=$(date +%s%N)
    frontend_http=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$FRONTEND_URL" 2>/dev/null)
    frontend_time=$((($(date +%s%N) - frontend_start) / 1000000))

    if [ "$frontend_http" = "200" ]; then
        echo -e "   ${GREEN}✅ 前端主页正常${NC} (HTTP $frontend_http, ${frontend_time}ms)"
        check_results+=("frontend:PASS")
    else
        echo -e "   ${RED}❌ 前端主页异常${NC} (HTTP $frontend_http)"
        check_results+=("frontend:FAIL")
        test_passed=false
    fi

    # 3. 关键资源检查
    echo -e "${BLUE}3️⃣  关键资源检查...${NC}"

    # main.jsx
    main_content=$(curl -s --max-time 5 "${FRONTEND_URL}src/main.jsx" 2>/dev/null)
    main_http=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${FRONTEND_URL}src/main.jsx" 2>/dev/null)

    # App.jsx
    app_http=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${FRONTEND_URL}src/App.jsx" 2>/dev/null)

    # App.css
    css_http=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${FRONTEND_URL}src/App.css" 2>/dev/null)

    if [ "$main_http" = "200" ] && [ "$app_http" = "200" ] && [ "$css_http" = "200" ]; then
        echo -e "   ${GREEN}✅ 所有资源加载正常${NC}"
        echo "      - main.jsx: HTTP $main_http"
        echo "      - App.jsx: HTTP $app_http"
        echo "      - App.css: HTTP $css_http"
        check_results+=("resources:PASS")
    else
        echo -e "   ${RED}❌ 资源加载失败${NC}"
        echo "      - main.jsx: HTTP $main_http"
        echo "      - App.jsx: HTTP $app_http"
        echo "      - App.css: HTTP $css_http"
        check_results+=("resources:FAIL")
        test_passed=false
    fi

    # 4. esbuild 错误检查
    echo -e "${BLUE}4️⃣  esbuild 错误检查...${NC}"
    if echo "$main_content" | grep -q "Invalid loader value"; then
        echo -e "   ${RED}❌ 发现 esbuild 错误！${NC}"
        echo "      这会导致页面无法正常显示"
        check_results+=("esbuild:ERROR")
        test_passed=false
    else
        echo -e "   ${GREEN}✅ 无 esbuild 错误${NC}"
        check_results+=("esbuild:OK")
    fi

    # 5. React 检查
    echo -e "${BLUE}5️⃣  React 组件检查...${NC}"
    if echo "$main_content" | grep -q "ReactDOM.createRoot"; then
        echo -e "   ${GREEN}✅ React 初始化代码存在${NC}"
        check_results+=("react:OK")
    else
        echo -e "   ${YELLOW}⚠️  React 初始化代码可能有问题${NC}"
        check_results+=("react:WARN")
    fi

    # 6. API 代理检查
    echo -e "${BLUE}6️⃣  API 代理检查...${NC}"
    api_via_frontend=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${FRONTEND_URL}api/activities?limit=1" 2>/dev/null)
    if [ "$api_via_frontend" = "200" ]; then
        echo -e "   ${GREEN}✅ API 代理正常${NC} (HTTP $api_via_frontend)"
        check_results+=("proxy:PASS")
    else
        echo -e "   ${RED}❌ API 代理异常${NC} (HTTP $api_via_frontend)"
        check_results+=("proxy:FAIL")
        test_passed=false
    fi

    # 7. 数据完整性检查
    echo -e "${BLUE}7️⃣  数据完整性检查...${NC}"
    api_data=$(curl -s --max-time 5 "$BACKEND_URL&limit=1000" 2>/dev/null)
    if [ -n "$api_data" ]; then
        activity_count=$(echo "$api_data" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('pagination', {}).get('totalItems', 0))" 2>/dev/null || echo "0")
        if [ "$activity_count" -gt 0 ]; then
            echo -e "   ${GREEN}✅ 数据完整${NC} ($activity_count 条活动)"
            check_results+=("data:OK")
        else
            echo -e "   ${YELLOW}⚠️  数据数量异常${NC}"
            check_results+=("data:WARN")
        fi
    else
        echo -e "   ${RED}❌ 无法获取数据${NC}"
        check_results+=("data:FAIL")
        test_passed=false
    fi

    # 8. HTML 结构检查
    echo -e "${BLUE}8️⃣  HTML 结构检查...${NC}"
    html_content=$(curl -s --max-time 5 "$FRONTEND_URL" 2>/dev/null)
    root_div_exists=$(echo "$html_content" | grep -c '<div id="root">')
    if [ "$root_div_exists" -gt 0 ]; then
        echo -e "   ${GREEN}✅ HTML 结构正常${NC}"
        echo "      - 找到 <div id=\"root\">"
        check_results+=("html:OK")
    else
        echo -e "   ${RED}❌ HTML 结构异常${NC}"
        check_results+=("html:FAIL")
        test_passed=false
    fi

    # 判断测试结果
    echo ""
    if [ "$test_passed" = true ]; then
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}✅ 第 $test_num 次检查：${NC} ${GREEN}通过${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        ((pass_tests++))
    else
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${RED}❌ 第 $test_num 次检查：${NC} ${RED}失败${NC}"
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        ((fail_tests++))
    fi

    # 保存检查结果
    echo "# Test $test_num - $(date '+%Y-%m-%d %H:%M:%S')" >> /tmp/frontend_test_results.txt
    printf "%s\n" "${check_results[@]}" >> /tmp/frontend_test_results.txt
    echo "" >> /tmp/frontend_test_results.txt
}

# 清空旧结果
> /tmp/frontend_test_results.txt

echo "🚀 开始 10 次自动检查..."
echo ""

# 运行 10 次检查
for i in {1..10}; do
    detailed_check "$i"

    if [ $i -lt 10 ]; then
        echo ""
        echo -e "${BLUE}⏳ 等待 2 秒后进行下一次检查...${NC}"
        sleep 2
    fi
done

# 最终报告
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   📊 最终测试报告                                          ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "  测试日期: $(date '+%Y-%m-%d %H:%M:%S')"
echo "  前端地址: $FRONTEND_URL"
echo "  后端地址: $BACKEND_URL"
echo ""
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  总测试次数: $total_tests"
echo -e "  ${GREEN}✅ 通过次数: $pass_tests${NC}"
echo -e "  ${RED}❌ 失败次数: $fail_tests${NC}"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 成功率计算
if [ $total_tests -gt 0 ]; then
    success_rate=$((pass_tests * 100 / total_tests))
    echo "  成功率: ${success_rate}%"
    echo ""
fi

# 结论
if [ $fail_tests -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}║   🎉🎉🎉 恭喜！所有 10 次检查全部通过！                   ║${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}║   前端工作完全正常，esbuild 问题已解决！              ║${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}💡 提示：详细检查结果已保存到: /tmp/frontend_test_results.txt${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                            ║${NC}"
    echo -e "${RED}║   ⚠️  警告：有 $fail_tests 次检查失败！                       ║${NC}"
    echo -e "${RED}║                                                            ║${NC}"
    echo -e "${RED}║   请查看上方错误信息并修复问题                            ║${NC}"
    echo -e "${RED}║                                                            ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}💡 提示：详细检查结果已保存到: /tmp/frontend_test_results.txt${NC}"
    exit 1
fi
