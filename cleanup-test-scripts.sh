#!/bin/bash
# 清理冗余测试脚本
# 使用方法: ./cleanup-test-scripts.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

GREEN='\033[92m'
RED='\033[91m'
YELLOW='\033[93m'
BLUE='\033[94m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      清理 Chiengmai 项目冗余测试脚本                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 创建备份目录
BACKUP_DIR=".backups/test-scripts-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}⚠️  以下脚本将被移至备份目录: ${BACKUP_DIR}${NC}"
echo ""

# 要删除的冗余脚本（移到备份目录）
REDUNDANT_SCRIPTS=(
    "test-all.sh"          # 已被 test-all.py 替代
    "test-enhanced.sh"     # 已被 test-all.py 替代
    "test-enhanced-fixed.sh"  # 已被 test-all.py 替代
    "start-services.sh"    # 功能与 restart-services.sh 重复
    "test-popup.sh"        # 一次性任务，已完成
)

# 移动冗余脚本
for script in "${REDUNDANT_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        echo -e "${YELLOW}• ${script}${NC}"
        mv "$script" "$BACKUP_DIR/"
    fi
done

echo ""
echo -e "${GREEN}✅ 清理完成！${NC}"
echo ""
echo -e "${BLUE}当前测试脚本:${NC}"
echo -e "  ${GREEN}✅${NC} test-all.py   - 统一测试脚本（推荐）"
echo -e "  ${GREEN}✅${NC} test.sh       - Bash 快捷方式"
echo -e "  ${GREEN}✅${NC} quick-check.sh - 快速检查"
echo ""
echo -e "${BLUE}备份位置:${NC} ${BACKUP_DIR}"
echo ""
echo -e "${BLUE}使用方法:${NC}"
echo -e "  ${GREEN}npm run test${NC}      - 运行完整测试"
echo -e "  ${GREEN}npm run test:fast${NC}  - 快速测试"
echo -e "  ${GREEN}./test.sh${NC}          - 直接运行测试"
echo ""
