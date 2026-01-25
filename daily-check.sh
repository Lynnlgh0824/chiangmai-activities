#!/bin/bash
# 每日系统健康检查脚本
# 询问用户是否要执行测试

PROJECT_DIR="/Users/yuzhoudeshengyin/Documents/my_project/Chiengmai"
LOG_FILE="$PROJECT_DIR/logs/daily-check-$(date +%Y%m%d).log"

# 创建日志目录
mkdir -p "$PROJECT_DIR/logs"

# 记录开始时间
echo "========================================" >> "$LOG_FILE"
echo "每日系统检查 - $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# 检查时间是否在10点后
CURRENT_HOUR=$(date '+%H')
if [ "$CURRENT_HOUR" -lt 10 ]; then
    echo "当前时间早于10点，跳过检查" >> "$LOG_FILE"
    exit 0
fi

# 使用 macOS 对话框询问用户
RESULT=$(osascript <<EOF
set theResponse to button returned of (display dialog "🔔 系统检查提醒\n\n今天还没有检查 Chiengmai 项目系统。\n\n是否要立即运行健康检查？" buttons {"取消", "稍后提醒", "立即检查"} default button "立即检查" with icon note giving up after 3600)
if theResponse is equal to "missing value" then
    return "稍后提醒"
end if
return theResponse
EOF
)

# 记录用户选择
echo "用户选择: $RESULT" >> "$LOG_FILE"

case "$RESULT" in
    "立即检查")
        echo "开始执行系统检查..." >> "$LOG_FILE"

        # 切换到项目目录并运行测试
        cd "$PROJECT_DIR"

        # 运行测试并保存结果
        python3 test-enhanced-fixed.sh >> "$LOG_FILE" 2>&1

        # 显示结果通知
        if [ $? -eq 0 ]; then
            osascript -e 'display notification "✅ 系统检查通过！所有功能正常" with title "Chiengmai 系统检查"'
        else
            osascript -e 'display notification "⚠️ 系统检查发现问题，请查看日志" with title "Chiengmai 系统检查"'
        fi

        # 在终端中显示结果（如果终端打开）
        echo ""
        echo "🔔 Chiengmai 项目系统检查完成"
        echo "📋 详细日志: $LOG_FILE"
        ;;

    "稍后提醒")
        echo "用户选择稍后提醒" >> "$LOG_FILE"
        # 1小时后再次提醒
        sleep 3600
        exec "$0"  # 重新运行自己
        ;;

    "取消"|"missing value")
        echo "用户取消检查" >> "$LOG_FILE"
        exit 0
        ;;
esac
