#!/bin/bash
# 清迈活动指南小程序一键部署工具
# 前提：开发者工具已开服务端口 + 已扫码登录
# 用法：bash deploy.sh [check|preview|upload]

set -e

PROJECT_DIR="/Users/yuzhoudeshengyin/Documents/my_project/Chiangmai/miniprogram"
APPID="wx330f8a72f90c7076"
CLI="/Applications/wechatwebdevtools.app/Contents/MacOS/cli"
NODE="/Users/yuzhoudeshengyin/.workbuddy/binaries/node/versions/22.22.2-2/bin/node"

# 当前版本（从 app-version.json 读 VERSION）
VERSION=$(python3 -c "import json;print(json.load(open('/Users/yuzhoudeshengyin/Documents/my_project/Chiangmai/app-version.json'))['fullVersion'])")
ACTION="${1:-check}"

echo "=== Chiangmai 小程序部署工具 ==="
echo "  工程: $PROJECT_DIR"
echo "  AppID: $APPID"
echo "  版本: $VERSION"
echo "  动作: $ACTION"
echo ""

[ ! -d "$PROJECT_DIR" ] && { echo "✗ 工程目录不存在"; exit 1; }

case "$ACTION" in
  check)
    echo "[1/3] CLI 可用性..."
    "$CLI" --help > /dev/null && echo "  ✓ CLI OK"
    echo "[2/3] 开发者工具登录态..."
    if "$CLI" islogin 2>&1 | grep -q '"login":true'; then
      echo "  ✓ 已登录"
    else
      echo "  ✗ 未登录 → 打开开发者工具扫码"
      exit 1
    fi
    echo "[3/3] 代码逻辑自检..."
    cd "$PROJECT_DIR"
    "$NODE" _selftest-index.cjs 2>&1 | tail -2
    "$NODE" _selftest-h5data.cjs 2>&1 | tail -2
    ;;

  preview)
    echo "[1/2] 生成体验版预览二维码..."
    cd "$PROJECT_DIR"
    "$CLI" preview --project "$PROJECT_DIR" --qr-format base64 --qr-output "$PROJECT_DIR/preview-qr.jpg" 2>&1 | tail -3
    echo "  ✓ QR 已保存到 $PROJECT_DIR/preview-qr.jpg"
    open "$PROJECT_DIR/preview-qr.jpg" 2>/dev/null && echo "  ✓ 已自动打开预览"
    ;;

  upload)
    echo "[1/4] 上传前自检..."
    cd "$PROJECT_DIR"
    "$NODE" _selftest-index.cjs 2>&1 | tail -2

    echo "[2/4] WXSS 括号配对检查..."
    "$NODE" -e "
const fs=require('fs'),path=require('path');
function walk(d){let r=[];for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(f.isDirectory())r.push(...walk(p));else if(f.name.endsWith('.wxss')){const s=fs.readFileSync(p,'utf8');if(s.split('{').length!==s.split('}').length){console.error('  ✗',p,'括号不平衡');process.exit(1)}}}}walk(process.cwd());console.log('  ✓ WXSS 全部平衡');
"

    echo "[3/4] 上传代码到体验版（version=$VERSION）..."
    "$CLI" upload \
      --project "$PROJECT_DIR" \
      --appid "$APPID" \
      --version "$VERSION" \
      --desc "v$VERSION：CDN 化（jsDelivr + GitHub data/），免后端运维" 2>&1 | tail -3

    echo "[4/4] 完成！到 mp.weixin.qq.com → 版本管理 设为体验版"
    ;;

  *)
    echo "用法：bash deploy.sh [check|preview|upload]"
    exit 1
    ;;
esac
