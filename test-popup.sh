#!/bin/bash
# 测试弹窗提醒

echo "🔔 准备弹出系统检查提醒..."
echo ""

# 使用 macOS 对话框
RESULT=$(osascript <<'APPLESCRIPT'
set theResponse to button returned of (display dialog "🔔 Chiengmai 系统检查提醒\n\n您想现在运行系统健康检查吗？\n\n这将测试所有功能是否正常。" buttons {"取消", "立即检查"} default button "立即检查" with icon note giving up after 120)

if theResponse is equal to "missing value" then
    return "超时"
end if

return theResponse
APPLESCRIPT
)

echo "用户选择: $RESULT"

case "$RESULT" in
    "立即检查")
        echo "开始运行系统检查..."
        echo ""
        cd /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai
        python3 test-enhanced-fixed.sh
        ;;
    "取消")
        echo "用户取消检查"
        ;;
    "超时")
        echo "对话框超时"
        ;;
esac
