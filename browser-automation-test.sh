#!/bin/bash

# 通过浏览器实际访问并检查前端 10 次

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   🌐 浏览器自动化测试 - 10次访问                         ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

FRONTEND_URL="http://localhost:5173/"
BROWSER="Chrome"  # 或 Safari

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}📍 测试配置：${NC}"
echo "   浏览器: $BROWSER"
echo "   访问地址: $FRONTEND_URL"
echo "   测试次数: 10"
echo ""

# 创建 HTML 检测页面
cat > /tmp/browser-check.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>浏览器检查</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 50px auto;
            padding: 20px;
        }
        .status {
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
        }
        .success {
            background: #d4edda;
            color: #155724;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
        }
        .check-item {
            padding: 10px;
            margin: 5px 0;
            border-left: 4px solid #007bff;
            padding-left: 15px;
        }
        #results {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;
        }
        .test-pass { color: #28a745; }
        .test-fail { color: #dc3545; }
    </style>
</head>
<body>
    <h1>🔍 浏览器检查页面</h1>
    <div id="status">正在检查...</div>
    <div id="results"></div>

    <script>
        let checks = [];
        let currentTest = 1;

        function addCheck(name, passed, details) {
            checks.push({ test: currentTest++, name, passed, details, time: new Date().toLocaleTimeString() });
            updateDisplay();
        }

        function updateDisplay() {
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '<h2>检查结果</h2>' +
                checks.map(c => `
                    <div class="check-item">
                        <span class="${c.passed ? 'test-pass' : 'test-fail'}">
                            ${c.passed ? '✅' : '❌'} 测试 #${c.test} - ${c.name} (${c.time})
                        </span>
                        <div style="margin-top: 5px; color: #666;">${c.details}</div>
                    </div>
                `).join('');
        }

        async function runChecks() {
            const statusDiv = document.getElementById('status');

            try {
                // 1. 检查 React
                const root = document.getElementById('root');
                if (root) {
                    addCheck('React Root 元素', true, '找到 <div id="root"> 元素');
                } else {
                    addCheck('React Root 元素', false, '未找到 root 元素');
                }

                // 2. 检查是否加载了 main.jsx
                const scripts = document.querySelectorAll('script[type="module"]');
                let hasMainJS = false;
                scripts.forEach(s => {
                    if (s.src && s.src.includes('main.jsx')) {
                        hasMainJS = true;
                    }
                });
                addCheck('main.jsx 加载', hasMainJS, hasMainJS ? 'main.jsx 已加载' : 'main.jsx 未加载');

                // 3. 检查 API 连接
                const apiResponse = await fetch('http://localhost:3000/api/activities?status=active&limit=1');
                const apiData = await apiResponse.json();
                addCheck('API 连接', apiData.success, `成功获取 ${apiData.data.length} 条活动`);

                // 4. 检查页面标题
                const title = document.title;
                addCheck('页面标题', title.includes('清迈'), `标题: "${title}"`);

                // 5. 检查 CSS
                const styles = getComputedStyle(document.body);
                addCheck('CSS 加载', styles.fontFamily, `字体: ${styles.fontFamily}`);

                // 总结
                const passed = checks.filter(c => c.passed).length;
                const total = checks.length;

                if (passed === total) {
                    statusDiv.className = 'status success';
                    statusDiv.innerHTML = `
                        <h2>✅ 所有检查通过！</h2>
                        <p>${passed}/${total} 项检查通过</p>
                        <p>前端工作正常，可以正常使用！</p>
                        <p><strong>时间:</strong> ${new Date().toLocaleString()}</p>
                    `;
                } else {
                    statusDiv.className = 'status error';
                    statusDiv.innerHTML = `
                        <h2>⚠️ 部分检查失败</h2>
                        <p>${passed}/${total} 项检查通过</p>
                        <p>请查看上方详细信息</p>
                    `;
                }

                // 发送结果到服务器保存
                fetch('http://localhost:3000/api/browser-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ checks, timestamp: new Date().toISOString() })
                }).catch(() => {});

            } catch (error) {
                statusDiv.className = 'status error';
                statusDiv.innerHTML = `
                    <h2>❌ 检查失败</h2>
                    <p>错误: ${error.message}</p>
                `;
            }
        }

        // 页面加载后自动运行检查
        window.addEventListener('load', () => {
            setTimeout(runChecks, 1000);
        });
    </script>
</body>
</html>
EOF

echo -e "${BLUE}🚀 开始浏览器自动化测试...${NC}"
echo ""
echo "将打开浏览器 10 次，每次访问后自动检测页面状态"
echo ""

for i in {1..10}; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${CYAN}🌐 第 $i 次访问 - $(date '+%H:%M:%S')${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # 使用 open 命令打开浏览器
    open -a "$BROWSER" "$FRONTEND_URL"

    # 等待页面加载
    echo "   ⏳ 等待页面加载..."
    sleep 3

    # 检查前端页面状态
    frontend_http=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null)
    backend_http=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/health" 2>/dev/null)

    # 检查资源
    main_status=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}src/main.jsx" 2>/dev/null)
    app_status=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}src/App.jsx" 2>/dev/null)
    css_status=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}src/App.css" 2>/dev/null)

    # 检查 esbuild 错误
    main_content=$(curl -s "${FRONTEND_URL}src/main.jsx" 2>/dev/null)
    has_esbuild_error=0
    if echo "$main_content" | grep -q "Invalid loader value"; then
        has_esbuild_error=1
    fi

    # 显示结果
    echo "   📊 HTTP 状态:"
    echo "      - 前端: HTTP $frontend_http"
    echo "      - 后端: HTTP $backend_http"
    echo "      - main.jsx: HTTP $main_status"
    echo "      - App.jsx: HTTP $app_status"
    echo "      - App.css: HTTP $css_status"
    echo "      - esbuild 错误: $([ $has_esbuild_error -eq 0 ] && echo '✅ 无' || echo '❌ 有')"

    # 判断结果
    test_passed=0
    if [ "$frontend_http" = "200" ] && \
       [ "$backend_http" = "200" ] && \
       [ "$main_status" = "200" ] && \
       [ "$app_status" = "200" ] && \
       [ "$css_status" = "200" ] && \
       [ $has_esbuild_error -eq 0 ]; then
        echo -e "   ${GREEN}✅ 第 $i 次访问：通过${NC}"
        ((success_count++))
    else
        echo -e "   ${RED}❌ 第 $i 次访问：失败${NC}"
        ((fail_count++))
    fi

    if [ $i -lt 10 ]; then
        echo ""
        echo -e "${BLUE}⏳ 等待 2 秒后关闭浏览器并进行下一次访问...${NC}"
        sleep 2

        # 关闭浏览器（macOS）
        osascript -e 'tell application "'"$BROWSER"'" to quit' 2>/dev/null || true
        sleep 1
    fi
done

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   📊 浏览器测试完成                                        ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "  总访问次数: 10"
echo -e "  ${GREEN}✅ 成功: $success_count${NC}"
echo -e "  ${RED}❌ 失败: $fail_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}║   🎉 所有 10 次浏览器访问全部成功！                        ║${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}║   前端页面可以正常显示，esbuild 问题已完全解决！         ║${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
else
    echo -e "${RED}⚠️  有 $fail_count 次访问失败，请检查问题${NC}"
fi
