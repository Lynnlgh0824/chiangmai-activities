#!/bin/bash
# 数据同步脚本 - 自动同步 data 到 public/data 并部署

set -e

echo "🔄 开始同步活动数据..."

# 1. 复制数据文件到 public 目录
echo "📁 复制 data/ → public/data/"
cp -f data/items.json public/data/
cp -f data/guide.json public/data/

# 2. 显示更改
echo "📊 数据文件已同步："
echo "  - items.json ($(wc -l < data/items.json) 行)"
echo "  - guide.json ($(wc -l < data/guide.json) 行)"

# 3. 询问是否部署
echo ""
echo "是否要部署到线上？(y/n)"
read -r answer

if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
    echo "🚀 开始部署..."
    vercel --prod
    echo "✅ 部署完成！"
    echo "🌐 访问: https://chiengmai-activities.vercel.app"
else
    echo "⏭️  跳过部署"
    echo "💡 提示: 数据已准备好，可以稍后手动提交到 Git"
fi
