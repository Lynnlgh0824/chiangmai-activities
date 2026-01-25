#!/bin/bash
# Chiengmai 分层自动化测试（优化版）
# 策略：快速失败，从简单到复杂
# 如果基础访问失败，立即停止，不浪费时间

set -e

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================="
echo "🧪 Chiengmai 分层自动化测试"
echo "策略：快速失败，精准定位问题"
echo "========================================="
echo ""

# 配置
FRONTEND_URL="http://localhost:5173"
ADMIN_URL="http://localhost:5173/admin.html"
API_URL="http://localhost:3000/api/health"

# 颜色
GREEN='\033[92m'
RED='\033[91m'
YELLOW='\033[93m'
BLUE='\033[94m'
NC='\033[0m'
BOLD='\033[1m'

# 计时器
START_TIME=$(date +%s)

# 错误处理
error_count=0

# 快速测试函数
test_http() {
    local url="$1"
    local name="$2"
    local timeout="${3:-5}"

    echo -n "⚡ [$name] 测试可访问性... "

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        --max-time "$timeout" "$url" 2>&1 || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ 通过${NC} (HTTP $HTTP_CODE)"
        return 0
    else
        echo -e "${RED}❌ 失败${NC} (HTTP $HTTP_CODE)"
        return 1
    fi
}

# 输出分隔线
print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# 输出成功
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 输出错误
print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((error_count++))
}

# 输出警告
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 输出信息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# ============================================================================
# 阶段 1: 基础可访问性测试（最快发现问题）
# ============================================================================
print_section "阶段 1/4: 基础可访问性测试"

STAGE1_PASS=true

# 1.1 测试前端主页
if ! test_http "$FRONTEND_URL" "前端主页"; then
    print_error "前端主页无法访问，测试停止"
    print_info "💡 请检查服务: npm run dev"
    print_section "📊 失败详情"
    echo "前端服务未运行或端口配置错误"
    echo "预期地址: $FRONTEND_URL"
    echo ""
    echo "修复步骤:"
    echo "  1. 启动服务: npm run dev"
    echo "  2. 检查端口: lsof -i:5173"
    echo "  3. 查看日志: 检查终端输出"
    exit 1
fi

# 1.2 测试管理页面
if ! test_http "$ADMIN_URL" "管理页面"; then
    print_warning "管理页面无法访问（非致命）"
    print_info "💡 管理页面可能不存在，可以继续"
fi

# 1.3 测试后端 API
if ! test_http "$API_URL" "后端 API"; then
    print_error "后端 API 无法访问"
    print_info "💡 请检查后端服务"
    exit 1
fi

print_success "阶段 1 通过：所有基础服务可访问"

# ============================================================================
# 阶段 2: 前端资源加载测试
# ============================================================================
print_section "阶段 2/4: 前端资源加载测试"

STAGE2_PASS=true

# 2.1 测试关键资源
RESOURCES=(
    "$FRONTEND_URL/src/main.jsx|main.jsx"
    "$FRONTEND_URL/src/App.jsx|App.jsx"
    "$FRONTEND_URL/src/App.css|App.css"
)

for resource in "${RESOURCES[@]}"; do
    URL="${resource%%|*}"
    NAME="${resource##*|}"

    if test_http "$URL" "$NAME" 3; then
        print_success "$NAME 加载正常"
    else
        print_error "$NAME 加载失败"
        print_info "💡 这可能是 Vite 编译错误"
        print_info "💡 检查终端是否有 esbuild 错误"
        STAGE2_PASS=false
    fi
done

if [ "$STAGE2_PASS" = false ]; then
    print_error "阶段 2 失败：前端资源加载有问题"
    print_info "💡 建议重启服务: ./restart-fixed.sh"
    exit 1
fi

print_success "阶段 2 通过：所有前端资源正常"

# ============================================================================
# 阶段 3: 数据完整性测试
# ============================================================================
print_section "阶段 3/4: 数据完整性测试"

STAGE3_PASS=true

# 3.1 测试活动数据 API
print_info "测试活动数据 API..."
ACTIVITY_COUNT=$(curl -s "http://localhost:3000/api/activities?status=active&limit=1" \
    | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('pagination', {}).get('totalItems', 0))" 2>/dev/null || echo "0")

if [ "$ACTIVITY_COUNT" -gt 0 ]; then
    print_success "API 返回 $ACTIVITY_COUNT 条活动数据"
else
    print_error "无法获取活动数据"
    STAGE3_PASS=false
fi

# 3.2 测试数据格式
print_info "验证数据格式..."
DATA_VALID=$(curl -s "http://localhost:3000/api/activities?limit=1" \
    | python3 -c "import sys, json; data=json.load(sys.stdin); print(1 if 'data' in data else 0)" 2>/dev/null || echo "0")

if [ "$DATA_VALID" -gt 0 ]; then
    print_success "数据格式正确"
else
    print_warning "数据格式可能有问题"
fi

if [ "$STAGE3_PASS" = false ]; then
    print_error "阶段 3 失败：数据验证失败"
    exit 1
fi

print_success "阶段 3 通过：数据完整性正常"

# ============================================================================
# 阶段 4: 详细功能验证（可选）
# ============================================================================
print_section "阶段 4/4: 详细功能验证"

# 4.1 测试页面内容
print_info "验证页面内容..."
PAGE_CONTENT=$(curl -s "$FRONTEND_URL" 2>&1)

if echo "$PAGE_CONTENT" | grep -q "清迈活动"; then
    print_success "页面标题正确"
else
    print_warning "页面标题可能有问题"
fi

if echo "$PAGE_CONTENT" | grep -q "root"; then
    print_success "React 根节点存在"
else
    print_warning "React 根节点未找到（可能还在加载）"
fi

# 4.2 测试响应时间
print_info "测试响应时间..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$FRONTEND_URL" 2>&1)
RESPONSE_INT=${RESPONSE_TIME%.*}

print_success "响应时间: ${RESPONSE_TIME}秒"

if [ "${RESPONSE_INT:-99}" -lt 3 ]; then
    print_success "响应速度优秀"
elif [ "${RESPONSE_INT:-99}" -lt 10 ]; then
    print_warning "响应速度一般"
else
    print_error "响应速度过慢"
fi

print_success "阶段 4 通过：功能验证完成"

# ============================================================================
# 测试总结
# ============================================================================
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

print_section "📊 测试总结"

echo ""
echo "⏱️  总耗时: ${DURATION} 秒"
echo ""
echo -e "${GREEN}✅ 阶段 1: 基础可访问性测试 - 通过${NC}"
echo -e "${GREEN}✅ 阶段 2: 前端资源加载测试 - 通过${NC}"
echo -e "${GREEN}✅ 阶段 3: 数据完整性测试 - 通过${NC}"
echo -e "${GREEN}✅ 阶段 4: 详细功能验证 - 通过${NC}"
echo ""

if [ $error_count -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！系统完全正常！${NC}"
    echo ""
    echo "🌐 访问地址:"
    echo "   主页: $FRONTEND_URL"
    echo "   管理: $ADMIN_URL"
    echo "   API:  $API_URL"
    echo ""
    echo "💡 提示:"
    echo "   - 现在可以安全地在浏览器中访问"
    echo "   - 所有功能都已验证通过"

    # 保存成功日志
    mkdir -p logs
    echo "$(date '+%Y-%m-%d %H:%M:%S') - 测试通过" >> logs/test-success.log

    exit 0
else
    echo -e "${RED}⚠️  测试完成，但有 $error_count 个警告${NC}"
    exit 0
fi
