#!/bin/bash

################################################################################
# Git安全检查脚本
# 功能：检查提交前是否包含敏感信息
# 使用：添加到pre-commit hook或手动运行
################################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Git 安全检查${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# 检查1：检查.env文件是否被提交
echo -e "${YELLOW}检查1: .env 文件${NC}"
if git diff --cached --name-only | grep -q "^\.env$"; then
    echo -e "${RED}❌ 错误: .env 文件将被提交！${NC}"
    echo -e "${RED}请立即取消提交：git reset HEAD .env${NC}"
    exit 1
else
    echo -e "${GREEN}✅ 通过: .env 文件未被提交${NC}"
fi
echo ""

# 检查2：检查是否包含常见的敏感信息模式
echo -e "${YELLOW}检查2: 敏感信息模式${NC}"

# 定义敏感模式（正则表达式）
SENSITIVE_PATTERNS=(
    "FEISHU_APP_SECRET\s*=\s*[a-zA-Z0-9]{20,}"
    "password\s*=\s*[\"']?[a-zA-Z0-9]{8,}"
    "api[_-]?key\s*=\s*[\"']?[a-zA-Z0-9]{20,}"
    "secret\s*=\s*[\"']?[a-zA-Z0-9]{20,}"
    "token\s*=\s*[\"']?[a-zA-Z0-9]{20,}"
)

FOUND_SECRETS=0

for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if git diff --cached | grep -iE "$pattern" > /dev/null; then
        echo -e "${RED}❌ 警告: 检测到可能的敏感信息${NC}"
        echo -e "${RED}模式: $pattern${NC}"
        FOUND_SECRETS=1
    fi
done

if [ $FOUND_SECRETS -eq 0 ]; then
    echo -e "${GREEN}✅ 通过: 未检测到敏感信息${NC}"
else
    echo -e "${RED}请检查并移除敏感信息后再提交${NC}"
    exit 1
fi
echo ""

# 检查3：检查私有目录是否被添加
echo -e "${YELLOW}检查3: 私有目录${NC}"

PRIVATE_DIRS=(
    "internal-notes/"
    "daily-logs/"
)

for dir in "${PRIVATE_DIRS[@]}"; do
    if git diff --cached --name-only | grep -q "^$dir"; then
        echo -e "${YELLOW}⚠️  警告: $dir 将被提交${NC}"
        echo -e "${YELLOW}该目录应该被 .gitignore 忽略${NC}"
    fi
done

echo -e "${GREEN}✅ 通过: 私有目录检查完成${NC}"
echo ""

# 检查4：检查是否有大文件
echo -e "${YELLOW}检查4: 大文件检查${NC}"

LARGE_FILES=$(git diff --cached --name-only | while read file; do
    if [ -f "$file" ]; then
        SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
        if [ "$SIZE" -gt 1048576 ]; then  # 1MB
            echo "$file ($(($SIZE / 1024 / 1024))MB)"
        fi
    fi
done)

if [ -n "$LARGE_FILES" ]; then
    echo -e "${YELLOW}⚠️  检测到大文件:${NC}"
    echo "$LARGE_FILES"
    echo -e "${YELLOW}建议: 使用 Git LFS 或不提交大文件${NC}"
else
    echo -e "${GREEN}✅ 通过: 无大文件${NC}"
fi
echo ""

# 最终总结
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}✅ 安全检查通过！${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "提示："
echo "  - 将此脚本添加到 .git/hooks/pre-commit 可自动运行"
echo "  - 或手动运行: ./scripts/git-security-check.sh"
echo ""

exit 0
