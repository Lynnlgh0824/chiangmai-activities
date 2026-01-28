#!/bin/bash

################################################################################
# 自动提交系统快速安装脚本
# 功能：一键配置每天0点自动提交
################################################################################

set -e

PROJECT_DIR="/Users/yuzhoudeshengyin/Documents/my_project/Chiengmai"
CRON_JOB="0 0 * * * $PROJECT_DIR/scripts/daily-auto-commit.sh >> $PROJECT_DIR/logs/cron.log 2>&1"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "每日自动提交系统 - 快速安装"
echo "=========================================="
echo ""

# 检查crontab
echo "1️⃣  检查当前crontab..."
if crontab -l 2>/dev/null | grep -q "daily-auto-commit.sh"; then
    echo -e "${YELLOW}⚠️  Crontab已存在${NC}"
    echo "当前配置:"
    crontab -l | grep "daily-auto-commit.sh"
    echo ""
    read -p "是否覆盖？(y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "安装已取消"
        exit 0
    fi

    # 删除旧的crontab
    crontab -l | grep -v "daily-auto-commit.sh" | crontab -
fi

# 添加新的crontab
echo "2️⃣  配置crontab..."
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
echo -e "${GREEN}✅ Crontab配置完成${NC}"
echo ""

# 验证配置
echo "3️⃣  验证配置..."
echo "当前crontab:"
crontab -l | grep "daily-auto-commit"
echo ""

# 创建日志目录
echo "4️⃣  创建日志目录..."
mkdir -p "$PROJECT_DIR/logs"
echo -e "${GREEN}✅ 日志目录已创建${NC}"
echo ""

# 测试脚本
echo "5️⃣  测试脚本..."
echo "运行测试..."
if "$PROJECT_DIR/scripts/daily-auto-commit.sh" --test 2>/dev/null || true; then
    echo -e "${GREEN}✅ 脚本测试通过${NC}"
else
    echo -e "${YELLOW}⚠️  脚本测试跳过（可能没有--test选项）${NC}"
fi
echo ""

# 完成
echo "=========================================="
echo -e "${GREEN}✅ 安装完成！${NC}"
echo "=========================================="
echo ""
echo "📋 配置信息:"
echo "  - 执行时间: 每天0点"
echo "  - 脚本路径: $PROJECT_DIR/scripts/daily-auto-commit.sh"
echo "  - 日志目录: $PROJECT_DIR/logs"
echo ""
echo "📚 查看指南:"
echo "  cat $PROJECT_DIR/DAILY-AUTO-COMMIT-GUIDE.md"
echo ""
echo "🔧 常用命令:"
echo "  查看crontab:    crontab -l"
echo "  手动运行:       ./scripts/daily-auto-commit.sh"
echo "  查看日志:       cat logs/daily-auto-commit-\$(date +%Y%m%d).log"
echo "  查看报告:       cat logs/daily-report-\$(date +%Y%m%d).md"
echo ""
echo "⏰ 等待明天0点自动执行，或手动运行测试"
echo ""
