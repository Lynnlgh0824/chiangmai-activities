#!/bin/bash

# =================================================================
# 🚀 一键部署脚本 - Cloudflare Pages / Vercel
# =================================================================
# 使用方法：
#   1. 确保已安装 git: brew install git (macOS)
#   2. 运行: bash deploy.sh
# =================================================================

echo "🚀 清迈活动平台 - 一键部署脚本"
echo "================================"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 git 是否安装
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git 未安装${NC}"
    echo "请先安装 Git: brew install git (macOS)"
    exit 1
fi

echo -e "${GREEN}✅ Git 已安装${NC}"

# 询问部署平台
echo ""
echo "选择部署平台:"
echo "1) Cloudflare Pages (推荐，国内可访问)"
echo "2) Vercel (速度快，但国内可能较慢)"
echo "3) 仅准备代码（手动部署）"
read -p "请输入选择 (1/2/3): " platform

case $platform in
    1)
        PLATFORM="cloudflare"
        echo -e "${BLUE}📦 准备部署到 Cloudflare Pages${NC}"
        ;;
    2)
        PLATFORM="vercel"
        echo -e "${BLUE}📦 准备部署到 Vercel${NC}"

        # 检查是否安装 vercel CLI
        if ! command -v vercel &> /dev/null; then
            echo -e "${YELLOW}⚠️  Vercel CLI 未安装，正在安装...${NC}"
            npm install -g vercel
        fi
        ;;
    3)
        PLATFORM="manual"
        echo -e "${BLUE}📦 仅准备代码${NC}"
        ;;
    *)
        echo -e "${RED}❌ 无效选择${NC}"
        exit 1
        ;;
esac

# 询问 GitHub 仓库信息
echo ""
read -p "GitHub 用户名: " github_username
read -p "仓库名称 (建议: chiengmai-activities): " repo_name

if [ -z "$github_username" ] || [ -z "$repo_name" ]; then
    echo -e "${RED}❌ 用户名和仓库名不能为空${NC}"
    exit 1
fi

# 创建 .gitignore（如果不存在）
if [ ! -f .gitignore ]; then
    echo "node_modules/" > .gitignore
    echo ".DS_Store" >> .gitignore
    echo "*.log" >> .gitignore
    echo -e "${GREEN}✅ 已创建 .gitignore${NC}"
fi

# 初始化 Git 仓库（如果还没初始化）
if [ ! -d .git ]; then
    git init
    echo -e "${GREEN}✅ Git 仓库已初始化${NC}"
fi

# 添加所有文件
git add .
echo -e "${GREEN}✅ 文件已添加到暂存区${NC}"

# 提交
read -p "输入提交信息 (默认: Update website): " commit_msg
commit_msg=${commit_msg:-"Update website"}
git commit -m "$commit_msg"
echo -e "${GREEN}✅ 文件已提交${NC}"

# 添加远程仓库
REMOTE_URL="https://github.com/${github_username}/${repo_name}.git"
if git remote get-url origin &> /dev/null; then
    echo -e "${YELLOW}⚠️  远程仓库已存在，更新 URL${NC}"
    git remote set-url origin "$REMOTE_URL"
else
    git remote add origin "$REMOTE_URL"
    echo -e "${GREEN}✅ 远程仓库已添加${NC}"
fi

# 推送代码
echo ""
echo -e "${BLUE}📤 推送代码到 GitHub...${NC}"
git push -u origin main || git push -u origin master
echo -e "${GREEN}✅ 代码已推送${NC}"

# 根据平台提供部署指引
echo ""
echo "================================"
echo -e "${GREEN}✨ 部署准备完成！${NC}"
echo "================================"
echo ""

case $platform in
    cloudflare)
        echo "📝 下一步操作:"
        echo ""
        echo "1. 访问: https://dash.cloudflare.com/"
        echo "2. 登录/注册 Cloudflare 账号"
        echo "3. 选择 'Workers & Pages' → 'Create application'"
        echo "4. 选择 'Pages' → 'Connect to Git'"
        echo "5. 授权 GitHub 并选择仓库: ${github_username}/${repo_name}"
        echo "6. 配置构建设置:"
        echo "   - Build command: (留空)"
        echo "   - Build output directory: /"
        echo "7. 点击 'Save and Deploy'"
        echo ""
        echo "🎉 部署完成后，你会得到一个地址:"
        echo "   https://${repo_name}.pages.dev"
        echo ""
        echo "💡 提示:"
        echo "   - 这个地址在国内可以直接访问"
        echo "   - 每次推送代码会自动重新部署"
        ;;
    vercel)
        echo "📝 下一步操作:"
        echo ""
        echo "1. 运行部署命令:"
        echo "   vercel --prod"
        echo ""
        echo "2. 按提示登录 Vercel 账号"
        echo "3. 确认项目设置"
        echo ""
        echo "🎉 部署完成后，你会得到一个地址:"
        echo "   https://${repo_name}.vercel.app"
        echo ""
        echo "💡 提示:"
        echo "   - Vercel 在国内访问可能较慢"
        echo "   - 可以配置自定义域名和 CDN 加速"
        ;;
    manual)
        echo "📝 手动部署指南:"
        echo ""
        echo "✅ 代码已推送到 GitHub:"
        echo "   https://github.com/${github_username}/${repo_name}"
        echo ""
        echo "选择一个平台进行部署:"
        echo ""
        echo "1. Cloudflare Pages (推荐):"
        echo "   https://dash.cloudflare.com/"
        echo "   → Workers & Pages → Create → Connect to Git"
        echo ""
        echo "2. Vercel:"
        echo "   https://vercel.com/"
        echo "   → New Project → Import from Git"
        echo ""
        echo "3. Netlify:"
        echo "   https://netlify.com/"
        echo "   → Add new site → Import from Git"
        echo ""
        echo "4. Gitee Pages (国内速度快):"
        echo "   https://gitee.com/"
        echo "   → 创建仓库 → 推送代码 → 服务 → Gitee Pages"
        ;;
esac

echo ""
echo -e "${BLUE}🔗 相关资源:${NC}"
echo "   - GitHub 仓库: https://github.com/${github_username}/${repo_name}"
echo "   - 部署文档: ./docs/BEST_DEPLOYMENT_GUIDE.md"
echo ""
echo -e "${GREEN}祝部署成功！🎉${NC}"
