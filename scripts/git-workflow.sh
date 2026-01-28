#!/bin/bash

# ==========================================
# Git 工作流辅助脚本
# ==========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${BLUE}Git 工作流辅助脚本${NC}"
    echo -e "${BLUE}==========================================${NC}"
    echo ""
    echo "使用方法："
    echo "  ./git-workflow.sh [命令] [参数]"
    echo ""
    echo "可用命令："
    echo "  save [message]     - 快速保存更改（添加并提交）"
    echo "  undo               - 撤销最后一次提交（保留更改）"
    echo "  clean              - 清理未追踪的文件"
    echo "  sync               - 同步远程更改"
    echo "  backup [branch]    - 备份当前分支到指定分支"
    echo "  logs               - 显示提交历史"
    echo "  status             - 显示当前状态"
    echo "  help               - 显示此帮助信息"
    echo ""
}

# 快速保存更改
quick_save() {
    local message="$1"

    if [ -z "$message" ]; then
        echo -e "${RED}错误：请提供提交信息${NC}"
        echo "使用方法: ./git-workflow.sh save '你的提交信息'"
        exit 1
    fi

    echo -e "${GREEN}📝 正在保存更改...${NC}"

    # 添加所有更改
    git add -A

    # 检查是否有更改
    if git diff --cached --quiet; then
        echo -e "${YELLOW}⚠️  没有需要提交的更改${NC}"
        exit 0
    fi

    # 提交更改
    git commit -m "$message"
    echo -e "${GREEN}✅ 更改已成功保存！${NC}"

    # 显示状态
    echo ""
    git status
}

# 撤销最后一次提交
undo_commit() {
    echo -e "${YELLOW}⚠️  正在撤销最后一次提交...${NC}"
    git reset --soft HEAD^
    echo -e "${GREEN}✅ 已撤销最后一次提交，更改保留在工作区${NC}"
    echo ""
    git status
}

# 清理未追踪的文件
clean_untracked() {
    echo -e "${YELLOW}🧹 正在清理未追踪的文件...${NC}"
    echo -e "${RED}将要删除的文件：${NC}"
    git clean -n

    echo ""
    read -p "确认删除这些文件？(y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git clean -f
        echo -e "${GREEN}✅ 清理完成${NC}"
    else
        echo -e "${YELLOW}❌ 已取消清理${NC}"
    fi
}

# 同步远程更改
sync_remote() {
    echo -e "${GREEN}🔄 正在同步远程更改...${NC}"

    # 获取远程更改
    git fetch origin

    # 检查是否有远程更改
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u})
    BASE=$(git merge-base @ @{u})

    if [ $LOCAL = $REMOTE ]; then
        echo -e "${GREEN}✅ 本地已是最新${NC}"
    elif [ $LOCAL = $BASE ]; then
        echo -e "${YELLOW}⬇️  发现远程更改，正在拉取...${NC}"
        git pull origin $(git branch --show-current)
    elif [ $REMOTE = $BASE ]; then
        echo -e "${YELLOW}⬆️  本地领先远程，建议推送${NC}"
    else
        echo -e "${RED}❌ 本地和远程有分歧，需要手动合并${NC}"
    fi
}

# 备份当前分支
backup_branch() {
    local backup_branch="$1"

    if [ -z "$backup_branch" ]; then
        # 生成备份分支名（backup-时间戳）
        backup_branch="backup-$(date +%Y%m%d-%H%M%S)"
    fi

    echo -e "${GREEN}💾 正在备份当前分支到: $backup_branch${NC}"
    git branch "$backup_branch"
    echo -e "${GREEN}✅ 备份完成${NC}"
    echo ""
    echo "所有备份分支："
    git branch | grep backup
}

# 显示提交历史
show_logs() {
    echo -e "${BLUE}📜 提交历史：${NC}"
    echo ""
    git log --oneline --graph --decorate --all -10
}

# 显示当前状态
show_status() {
    echo -e "${BLUE}📊 当前状态：${NC}"
    echo ""
    git status
    echo ""
    echo -e "${BLUE}最近的提交：${NC}"
    git log --oneline -3
}

# 主函数
main() {
    case "$1" in
        save)
            quick_save "$2"
            ;;
        undo)
            undo_commit
            ;;
        clean)
            clean_untracked
            ;;
        sync)
            sync_remote
            ;;
        backup)
            backup_branch "$2"
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
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
