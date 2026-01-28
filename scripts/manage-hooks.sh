#!/bin/bash

################################################################################
# Git Hooks 管理脚本
# 功能：安装、卸载、查看 Git hooks
################################################################################

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$PROJECT_ROOT" ]; then
    echo -e "${RED}错误：不在 Git 仓库中${NC}"
    exit 1
fi

HOOKS_DIR="$PROJECT_ROOT/.git/hooks"
SOURCE_DIR="$PROJECT_ROOT/scripts/git-hooks"

# 显示帮助信息
show_help() {
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${BLUE}Git Hooks 管理脚本${NC}"
    echo -e "${BLUE}==========================================${NC}"
    echo ""
    echo "使用方法："
    echo "  ./scripts/manage-hooks.sh [命令]"
    echo ""
    echo "可用命令："
    echo "  install    - 安装所有 Git hooks"
    echo "  uninstall  - 卸载所有 Git hooks"
    echo "  status     - 查看 hooks 状态"
    echo "  test       - 测试 pre-commit hook"
    echo "  help       - 显示此帮助信息"
    echo ""
}

# 安装 hooks
install_hooks() {
    echo -e "${GREEN}📦 安装 Git hooks...${NC}"
    echo ""

    # 创建 pre-commit hook
    cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash

################################################################################
# Git Pre-Commit Hook
# 功能：在提交前自动运行安全检查
################################################################################

# 切换到项目根目录
cd "$(git rev-parse --show-toplevel)"

# 运行安全检查脚本
if [ -f "./scripts/git-security-check.sh" ]; then
    ./scripts/git-security-check.sh

    # 检查退出码
    if [ $? -ne 0 ]; then
        echo ""
        echo -e "\033[0;31m❌ 提交被阻止：安全检查未通过\033[0m"
        echo -e "\033[0;33m💡 提示：修复上述问题后再次尝试提交\033[0m"
        exit 1
    fi
else
    echo -e "\033[0;33m⚠️  警告：安全检查脚本不存在，跳过检查\033[0m"
fi

exit 0
EOF

    chmod +x "$HOOKS_DIR/pre-commit"
    echo -e "${GREEN}✅ pre-commit hook 已安装${NC}"

    # 创建 commit-msg hook（可选）
    cat > "$HOOKS_DIR/commit-msg" << 'EOF'
#!/bin/bash

################################################################################
# Git Commit-Message Hook
# 功能：验证提交信息格式
################################################################################

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# 检查提交信息是否为空
if [ -z "$COMMIT_MSG" ]; then
    echo -e "\033[0;31m❌ 错误：提交信息不能为空\033[0m"
    exit 1
fi

# 检查提交信息长度（建议至少 10 个字符）
if [ ${#COMMIT_MSG} -lt 10 ]; then
    echo -e "\033[0;33m⚠️  警告：提交信息太短，建议至少 10 个字符\033[0m"
fi

exit 0
EOF

    chmod +x "$HOOKS_DIR/commit-msg"
    echo -e "${GREEN}✅ commit-msg hook 已安装${NC}"

    echo ""
    echo -e "${GREEN}🎉 所有 hooks 安装完成！${NC}"
    echo -e "${BLUE}💡 现在每次提交前都会自动运行安全检查${NC}"
}

# 卸载 hooks
uninstall_hooks() {
    echo -e "${YELLOW}🗑️  卸载 Git hooks...${NC}"
    echo ""

    if [ -f "$HOOKS_DIR/pre-commit" ]; then
        rm -f "$HOOKS_DIR/pre-commit"
        echo -e "${GREEN}✅ pre-commit hook 已卸载${NC}"
    fi

    if [ -f "$HOOKS_DIR/commit-msg" ]; then
        rm -f "$HOOKS_DIR/commit-msg"
        echo -e "${GREEN}✅ commit-msg hook 已卸载${NC}"
    fi

    echo ""
    echo -e "${GREEN}✅ 所有 hooks 卸载完成${NC}"
}

# 查看 hooks 状态
show_status() {
    echo -e "${BLUE}📊 Git Hooks 状态${NC}"
    echo ""

    hooks=("pre-commit" "commit-msg" "pre-push")

    for hook in "${hooks[@]}"; do
        if [ -f "$HOOKS_DIR/$hook" ]; then
            if [ -x "$HOOKS_DIR/$hook" ]; then
                echo -e "${GREEN}✅ $hook${NC} - 已安装并可执行"
            else
                echo -e "${YELLOW}⚠️  $hook${NC} - 已安装但不可执行"
            fi
        else
            echo -e "${RED}❌ $hook${NC} - 未安装"
        fi
    done

    echo ""
    echo -e "${BLUE}Hook 目录：${NC}$HOOKS_DIR"
}

# 测试 pre-commit hook
test_hook() {
    echo -e "${BLUE}🧪 测试 pre-commit hook...${NC}"
    echo ""

    # 检查 hook 是否存在
    if [ ! -f "$HOOKS_DIR/pre-commit" ]; then
        echo -e "${RED}❌ pre-commit hook 未安装${NC}"
        echo -e "${YELLOW}💡 运行 './scripts/manage-hooks.sh install' 安装${NC}"
        exit 1
    fi

    # 创建测试文件
    TEST_FILE="$PROJECT_ROOT/test-hook-temp.js"
    echo "console.log('test');" > "$TEST_FILE"

    # 添加到暂存区
    cd "$PROJECT_ROOT"
    git add "$TEST_FILE" 2>/dev/null

    # 运行安全检查
    echo -e "${YELLOW}运行安全检查...${NC}"
    ./scripts/git-security-check.sh

    # 清理
    git reset HEAD "$TEST_FILE" 2>/dev/null
    rm -f "$TEST_FILE"

    echo ""
    echo -e "${GREEN}✅ 测试完成${NC}"
}

# 主函数
main() {
    case "$1" in
        install)
            install_hooks
            ;;
        uninstall)
            uninstall_hooks
            ;;
        status)
            show_status
            ;;
        test)
            test_hook
            ;;
        help|--help|-h|"")
            show_help
            ;;
        *)
            echo -e "${RED}错误：未知命令 '$1'${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
