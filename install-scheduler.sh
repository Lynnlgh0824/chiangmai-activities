#!/bin/bash
# 配置 macOS launchd 定时任务
# 用途：让系统定期自动运行测试
# 使用方法：./install-scheduler.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PLIST_PATH="$HOME/Library/LaunchAgents/com.chiengmai.test.plist"
SCRIPT_PATH="$SCRIPT_DIR/scheduled-test.sh"

echo "========================================="
echo "⏰ 配置 Chiengmai 定时测试任务"
echo "========================================="
echo ""

# 创建 plist 文件
cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.chiengmai.test</string>

    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$SCRIPT_PATH</string>
    </array>

    <key>StartInterval</key>
    <integer>3600</integer>

    <key>RunAtLoad</key>
    <false/>

    <key>StandardOutPath</key>
    <string>$SCRIPT_DIR/logs/scheduled-test.log</string>

    <key>StandardErrorPath</key>
    <string>$SCRIPT_DIR/logs/scheduled-test-error.log</string>
</dict>
</plist>
EOF

# 创建日志目录
mkdir -p logs

echo "✅ 定时任务配置完成"
echo ""
echo "📋 配置详情:"
echo "   任务名称: com.chiengmai.test"
echo "   运行间隔: 每小时 (3600 秒)"
echo "   测试脚本: $SCRIPT_PATH"
echo "   日志位置: $SCRIPT_DIR/logs/"
echo ""
echo "🔧 管理命令:"
echo "   加载任务: launchctl load \"$PLIST_PATH\""
echo "   卸载任务: launchctl unload \"$PLIST_PATH\""
echo "   查看日志: tail -f logs/scheduled-test.log"
echo "   立即运行: launchctl start com.chiengmai.test"
echo ""
echo "⚠️  注意: 需要运行 'launchctl load' 来启动定时任务"
echo ""

# 加载任务
echo "正在加载定时任务..."
launchctl load "$PLIST_PATH" 2>&1 || echo "⚠️  加载失败，请手动执行: launchctl load \"$PLIST_PATH\""

echo "✅ 定时任务已启动！"
echo ""
echo "📊 下次运行: 1 小时后"
