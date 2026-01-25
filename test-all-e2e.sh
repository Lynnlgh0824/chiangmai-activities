#!/bin/bash

# 清迈活动平台 - 综合自动化测试脚本
# 运行所有测试：单元测试、API 测试、E2E 测试

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 检查服务是否运行
check_services() {
    print_header "检查服务状态"

    # 检查前端服务
    if curl -s http://localhost:5173 > /dev/null; then
        print_success "前端服务运行中 (http://localhost:5173)"
    else
        print_error "前端服务未运行，请先运行 'npm run dev'"
        exit 1
    fi

    # 检查后端服务
    if curl -s http://localhost:3000/api/health > /dev/null; then
        print_success "后端服务运行中 (http://localhost:3000)"
    else
        print_error "后端服务未运行，请先运行 'npm start'"
        exit 1
    fi
}

# 运行单元测试
run_unit_tests() {
    print_header "运行单元测试"

    if npm run test:run -- --reporter=verbose; then
        print_success "单元测试通过"
    else
        print_error "单元测试失败"
        return 1
    fi
}

# 运行 API 测试
run_api_tests() {
    print_header "运行 API 集成测试"

    if npm run test:run -- src/test/comprehensive-api.test.js --reporter=verbose; then
        print_success "API 测试通过"
    else
        print_error "API 测试失败"
        return 1
    fi
}

# 运行 E2E 测试
run_e2e_tests() {
    print_header "运行端到端 (E2E) 测试"

    if npx playwright test --reporter=list; then
        print_success "E2E 测试通过"

        # 显示测试报告
        print_warning "测试报告已生成: playwright-report/index.html"
    else
        print_error "E2E 测试失败"
        print_warning "查看测试报告: npx playwright show-report"
        return 1
    fi
}

# 生成测试报告
generate_report() {
    print_header "生成测试报告"

    # 运行覆盖率测试
    if npm run test:coverage; then
        print_success "测试覆盖率报告已生成"
        print_warning "查看覆盖率: open coverage/index.html"
    fi
}

# 主函数
main() {
    print_header "清迈活动平台 - 综合测试套件"
    echo "测试时间: $(date '+%Y-%m-%d %H:%M:%S')"

    # 解析命令行参数
    TEST_TYPE="${1:-all}"

    case $TEST_TYPE in
        unit)
            check_services
            run_unit_tests
            ;;
        api)
            check_services
            run_api_tests
            ;;
        e2e)
            check_services
            run_e2e_tests
            ;;
        coverage)
            check_services
            generate_report
            ;;
        all)
            check_services
            run_unit_tests
            run_api_tests
            run_e2e_tests
            generate_report
            ;;
        *)
            echo "用法: $0 [unit|api|e2e|coverage|all]"
            echo ""
            echo "选项:"
            echo "  unit      - 只运行单元测试"
            echo "  api       - 只运行 API 测试"
            echo "  e2e       - 只运行 E2E 测试"
            echo "  coverage  - 生成测试覆盖率报告"
            echo "  all       - 运行所有测试（默认）"
            exit 1
            ;;
    esac

    print_header "测试完成"
    print_success "所有测试已执行完毕"
}

# 运行主函数
main "$@"
