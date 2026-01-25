#!/bin/bash
# Chiengmai 项目快速健康检查脚本
# 使用方法: ./quick-check-fixed.sh

set -e  # 遇到错误立即退出

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔍 Chiengmai 项目快速健康检查"
echo "================================"
echo ""

# 显示开始时间
echo "⏰ 开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 运行前端测试
echo "🧪 运行前端功能测试..."
bash ./test-frontend.sh

echo ""
echo "⏰ 完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "✅ 快速检查完成！"
echo ""
echo "💡 提示:"
echo "   - 如需详细测试，运行: ./test-frontend.sh"
echo "   - 如需重启服务，运行: ./restart-services.sh"
echo "   - 如需启动服务，运行: npm run dev"
