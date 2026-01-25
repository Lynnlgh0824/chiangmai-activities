#!/bin/bash
# Chiengmai 项目测试脚本
# 快捷方式：统一测试入口

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色定义
GREEN='\033[92m'
RED='\033[91m'
YELLOW='\033[93m'
BLUE='\033[94m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      🏝️ Chiengmai Activities - 快速测试                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查 Python3
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 未安装${NC}"
    exit 1
fi

# 检查 requests 模块
if ! python3 -c "import requests" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  requests 模块未安装，正在安装...${NC}"
    pip3 install requests
fi

# 运行测试
echo -e "${GREEN}🧪 开始测试...${NC}"
echo ""

python3 test-all.py "$@"

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ 测试完成${NC}"
else
    echo ""
    echo -e "${RED}❌ 测试失败${NC}"
fi

exit $exit_code
