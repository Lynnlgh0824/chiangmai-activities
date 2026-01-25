#!/bin/bash

echo "========================================="
echo "🧪 前端功能测试"
echo "========================================="
echo ""

# 检查服务是否运行
echo "1️⃣ 检查服务状态..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/)

if [ "$BACKEND_STATUS" = "200" ]; then
    echo "   ✅ 后端服务正常 (HTTP $BACKEND_STATUS)"
else
    echo "   ❌ 后端服务异常 (HTTP $BACKEND_STATUS)"
fi

if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "   ✅ 前端服务正常 (HTTP $FRONTEND_STATUS)"
else
    echo "   ❌ 前端服务异常 (HTTP $FRONTEND_STATUS)"
fi

echo ""
echo "2️⃣ 检查 API 数据..."
ACTIVITY_COUNT=$(curl -s "http://localhost:3000/api/activities?status=active&limit=1000" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['pagination']['totalItems'])" 2>/dev/null)

if [ -n "$ACTIVITY_COUNT" ]; then
    echo "   ✅ API 返回 $ACTIVITY_COUNT 条活动数据"
else
    echo "   ❌ 无法获取活动数据"
fi

echo ""
echo "3️⃣ 检查前端资源..."
MAIN_JSX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/src/main.jsx)
APP_JSX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/src/App.jsx)
APP_CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/src/App.css)

if [ "$MAIN_JSX_STATUS" = "200" ]; then
    echo "   ✅ main.jsx 加载正常"
else
    echo "   ❌ main.jsx 加载失败"
fi

if [ "$APP_JSX_STATUS" = "200" ]; then
    echo "   ✅ App.jsx 加载正常"
else
    echo "   ❌ App.jsx 加载失败"
fi

if [ "$APP_CSS_STATUS" = "200" ]; then
    echo "   ✅ App.css 加载正常"
else
    echo "   ❌ App.css 加载失败"
fi

echo ""
echo "4️⃣ 检查 CORS 配置..."
API_FROM_FRONTEND=$(curl -s -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: GET" -X OPTIONS http://localhost:3000/api/activities -I | grep -i "access-control-allow-origin" | head -1)

if [ -n "$API_FROM_FRONTEND" ]; then
    echo "   ✅ CORS 配置正确"
    echo "   $API_FROM_FRONTEND"
else
    echo "   ⚠️  CORS 配置可能有问题"
fi

echo ""
echo "========================================="
echo "📊 测试总结"
echo "========================================="
echo ""
echo "🌐 访问地址："
echo "   前端: http://localhost:5173/"
echo "   后端: http://localhost:3000/api"
echo "   简单视图: http://localhost:3000/simple-view.html"
echo ""
echo "✅ 如果看到活动列表，说明前端完全正常！"
echo ""
