#!/bin/bash
# 快速手动检查脚本
# 随时可以运行，不受时间限制

PROJECT_DIR="/Users/yuzhoudeshengyin/Documents/my_project/Chiengmai"

echo "🔍 Chiengmai 项目快速健康检查"
echo "================================"
echo ""

# 切换到项目目录
cd "$PROJECT_DIR"

# 显示开始时间
echo "⏰ 开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 运行测试
python3 test-enhanced-fixed.sh

# 显示完成时间
echo ""
echo "⏰ 完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "📋 详细日志已保存到: logs/daily-check-$(date +%Y%m%d).log"
