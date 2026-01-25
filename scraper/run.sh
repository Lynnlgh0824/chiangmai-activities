#!/bin/bash

# 小红书爬虫快速启动脚本

echo "🚀 小红书清迈活动爬虫"
echo "========================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装 Node.js"
    echo "💡 请访问 https://nodejs.org/ 安装"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo ""

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
    echo ""
fi

# 检查 Chrome
if [ -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
    echo "✅ 检测到系统 Chrome 浏览器"
else
    echo "⚠️  未检测到 Chrome，将使用 Puppeteer 内置浏览器"
fi

echo ""
echo "========================================"
echo "📝 使用说明"
echo "========================================"
echo ""
echo "1. 浏览器会自动打开小红书"
echo "2. 请在 30 秒内扫码登录"
echo "3. 登录后爬虫会自动开始工作"
echo "4. 数据保存在 data/scrapped/ 目录"
echo ""
echo "💡 按 Ctrl+C 可随时停止"
echo ""
read -p "按回车键开始..."

# 运行爬虫
node xiaohongshu-scraper.js

echo ""
echo "========================================"
echo "✅ 爬取完成！"
echo ""
echo "📂 数据保存位置:"
ls -lh ../data/scrapped/*.json 2>/dev/null || echo "  (无数据文件)"
echo ""
echo "📖 导入数据:"
echo "  node import-data.js"
echo ""
