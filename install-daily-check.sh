#!/bin/bash
# 一键安装每日检查系统

echo "🔧 Chiengmai 项目每日检查系统安装"
echo "===================================="
echo ""

PROJECT_DIR="/Users/yuzhoudeshengyin/Documents/my_project/Chiengmai"
cd "$PROJECT_DIR"

# 1. 创建日志目录
echo "📁 创建日志目录..."
mkdir -p logs
echo "✅ 日志目录创建完成"
echo ""

# 2. 赋予执行权限
echo "🔐 设置脚本权限..."
chmod +x daily-check.sh
chmod +x quick-check.sh
chmod +x test-enhanced-fixed.sh
echo "✅ 权限设置完成"
echo ""

# 3. 安装 Launch Agent
echo "⏰ 安装定时任务..."
cp com.chiengmai.dailycheck.plist ~/Library/LaunchAgents/
if [ $? -eq 0 ]; then
    echo "✅ 配置文件复制成功"

    # 加载任务
    launchctl load ~/Library/LaunchAgents/com.chiengmai.dailycheck.plist 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ 定时任务加载成功"
    else
        echo "⚠️  定时任务加载可能失败，请手动执行："
        echo "   launchctl load ~/Library/LaunchAgents/com.chiengmai.dailycheck.plist"
    fi
else
    echo "❌ 配置文件复制失败"
    exit 1
fi
echo ""

# 4. 验证安装
echo "🔍 验证安装..."
launchctl list | grep chiengmai > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ 定时任务已成功安装并运行"
    echo ""
    echo "📋 系统信息："
    echo "   • 检查时间：每天 10:00"
    echo "   • 脚本位置：$PROJECT_DIR/daily-check.sh"
    echo "   • 日志位置：$PROJECT_DIR/logs/"
    echo ""
    echo "🎯 使用方式："
    echo "   • 自动运行：每天 10:00 自动提醒"
    echo "   • 手动检查：运行 ./quick-check.sh"
    echo "   • 查看日志：cat logs/daily-check-\$(date +%Y%m%d).log"
    echo ""
    echo "📖 详细说明：查看 docs/定时检查系统设置.md"
    echo ""
    echo "💡 提示：您现在可以运行 ./quick-check.sh 测试系统"
else
    echo "⚠️  无法验证定时任务状态"
    echo "   请手动检查：launchctl list | grep chiengmai"
fi
