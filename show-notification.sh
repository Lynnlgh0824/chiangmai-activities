#!/bin/bash
# 显示醒目的系统检查提醒

PROJECT_DIR="/Users/yuzhoudeshengyin/Documents/my_project/Chiengmai"
cd "$PROJECT_DIR"

echo "========================================="
echo "🔔 Chiengmai 系统检查提醒"
echo "========================================="
echo ""
echo "请选择操作："
echo "  1) 立即检查系统"
echo "  2) 稍后提醒"
echo "  3) 取消"
echo ""
read -p "请输入选项 (1-3): " choice

case $choice in
    1)
        echo ""
        echo "✅ 开始运行系统检查..."
        echo ""
        python3 test-enhanced-fixed.sh
        ;;
    2)
        echo ""
        echo "⏰ 将在30分钟后再次提醒"
        echo ""
        sleep 1800
        exec "$0"
        ;;
    3)
        echo ""
        echo "❌ 已取消检查"
        ;;
    *)
        echo ""
        echo "⚠️  无效选项"
        ;;
esac
