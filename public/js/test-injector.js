/**
 * 移动端优化验收测试 - 注入脚本
 * 使用方法：在浏览器控制台运行此脚本，或在主页面中引入
 */

(function() {
    'use strict';

    // 避免重复注入
    if (document.getElementById('mobile-test-panel')) {
        console.log('测试面板已存在，请点击页面右上角的测试按钮');
        return;
    }

    // 测试套件
    const testSuites = [
        {
            name: '1️⃣ 结构验收',
            tests: [
                {
                    name: '搜索+筛选合并',
                    severity: 1,
                    check: () => {
                        const filterBtn = document.querySelector('.filter-trigger-btn');
                        if (!filterBtn) return { pass: false, message: '未找到筛选按钮（.filter-trigger-btn）' };
                        if (!filterBtn.innerHTML.includes('⚙️')) return { pass: false, message: '筛选按钮不包含齿轮图标⚙️' };
                        return { pass: true, message: '✓ 搜索+筛选已合并' };
                    }
                },
                {
                    name: '分类Tab结构（4个+更多）',
                    severity: 1,
                    check: () => {
                        const tabs = document.querySelectorAll('.tabs-nav .tab-item');
                        const moreBtn = document.querySelector('.tab-more');
                        const dropdown = document.getElementById('tabDropdown');
                        if (!moreBtn) return { pass: false, message: '缺少"更多"按钮（.tab-more）' };
                        if (!dropdown) return { pass: false, message: '缺少Tab下拉菜单（#tabDropdown）' };
                        if (tabs.length < 5) return { pass: false, message: `Tab数量不足，期望至少5个，实际${tabs.length}个` };
                        const dropdownItems = dropdown.querySelectorAll('.dropdown-item');
                        if (dropdownItems.length !== 2) return { pass: false, message: `下拉菜单项数量错误，期望2个，实际${dropdownItems.length}个` };
                        return { pass: true, message: `✓ Tab结构正确：${tabs.length}个Tab（包含更多）+ ${dropdownItems.length}个下拉项` };
                    }
                },
                {
                    name: '日期选择器存在',
                    severity: 1,
                    check: () => {
                        const dateHeader = document.querySelector('.date-grid-header');
                        if (!dateHeader) return { pass: false, message: '日期选择器容器不存在（.date-grid-header）' };
                        return { pass: true, message: '✓ 日期选择器存在' };
                    }
                },
                {
                    name: '活动列表容器存在',
                    severity: 1,
                    check: () => {
                        const calendarGrid = document.getElementById('calendarGrid');
                        if (!calendarGrid) return { pass: false, message: '活动列表容器不存在（#calendarGrid）' };
                        return { pass: true, message: '✓ 活动列表容器存在' };
                    }
                }
            ]
        },
        {
            name: '2️⃣ 交互验收',
            tests: [
                {
                    name: 'Tab切换函数存在',
                    severity: 1,
                    check: () => {
                        if (typeof window.switchTab === 'function') return { pass: true, message: '✓ switchTab函数存在' };
                        return { pass: false, message: 'switchTab函数不存在' };
                    }
                },
                {
                    name: '下拉菜单切换函数存在',
                    severity: 1,
                    check: () => {
                        if (typeof window.toggleTabDropdown === 'function') return { pass: true, message: '✓ toggleTabDropdown函数存在' };
                        return { pass: false, message: 'toggleTabDropdown函数不存在' };
                    }
                },
                {
                    name: '下拉菜单切换Tab函数存在',
                    severity: 1,
                    check: () => {
                        if (typeof window.switchTabFromDropdown === 'function') return { pass: true, message: '✓ switchTabFromDropdown函数存在' };
                        return { pass: false, message: 'switchTabFromDropdown函数不存在' };
                    }
                },
                {
                    name: '关闭下拉菜单函数存在',
                    severity: 1,
                    check: () => {
                        if (typeof window.closeTabDropdown === 'function') return { pass: true, message: '✓ closeTabDropdown函数存在' };
                        return { pass: false, message: 'closeTabDropdown函数不存在' };
                    }
                }
            ]
        },
        {
            name: '3️⃣ 响应式验收',
            tests: [
                {
                    name: '响应式布局（CSS媒体查询）',
                    severity: 1,
                    check: () => {
                        const desktopOnly = document.querySelector('.desktop-only');
                        const mobileOnly = document.querySelector('.mobile-only');
                        if (!desktopOnly && !mobileOnly) return { pass: false, message: '未找到响应式控制类（.desktop-only / .mobile-only）' };
                        return { pass: true, message: '✓ 响应式布局CSS存在' };
                    }
                },
                {
                    name: '移动端"更多"按钮可见',
                    severity: 2,
                    mobileOnly: true,
                    check: () => {
                        const moreBtn = document.querySelector('.tab-more');
                        if (!moreBtn) return { pass: false, message: '"更多"按钮不存在' };
                        const display = window.getComputedStyle(moreBtn).display;
                        if (display === 'none') return { pass: false, message: '移动端"更多"按钮不可见（display: none）' };
                        return { pass: true, message: '✓ 移动端"更多"按钮可见' };
                    }
                },
                {
                    name: 'PC端显示完整6个Tab',
                    severity: 2,
                    desktopOnly: true,
                    check: () => {
                        const allTabs = document.querySelectorAll('.tabs-nav .tab-item');
                        if (allTabs.length !== 6) return { pass: false, message: `PC端Tab数量错误：${allTabs.length}/6` };
                        return { pass: true, message: `✓ PC端显示完整${allTabs.length}个Tab` };
                    }
                }
            ]
        }
    ];

    // 创建测试面板
    function createTestPanel() {
        const panel = document.createElement('div');
        panel.id = 'mobile-test-panel';
        panel.innerHTML = `
            <style>
                #mobile-test-panel {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    width: 400px;
                    max-height: 80vh;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    z-index: 99999;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    overflow: hidden;
                }
                #mobile-test-panel.minimized {
                    height: 50px;
                    overflow: hidden;
                }
                #mobile-test-panel .test-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: move;
                    user-select: none;
                }
                #mobile-test-panel .test-header h3 {
                    margin: 0;
                    font-size: 14px;
                }
                #mobile-test-panel .test-actions {
                    display: flex;
                    gap: 8px;
                }
                #mobile-test-panel .test-actions button {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
                #mobile-test-panel .test-actions button:hover {
                    background: rgba(255,255,255,0.3);
                }
                #mobile-test-panel .test-content {
                    padding: 16px;
                    overflow-y: auto;
                    max-height: calc(80vh - 50px);
                }
                #mobile-test-panel .test-item {
                    padding: 12px;
                    margin: 8px 0;
                    border-radius: 8px;
                    border-left: 4px solid #ddd;
                    background: #f8f9fa;
                }
                #mobile-test-panel .test-item.pass {
                    border-left-color: #28a745;
                    background: #f0fff4;
                }
                #mobile-test-panel .test-item.fail {
                    border-left-color: #dc3545;
                    background: #fff5f5;
                }
                #mobile-test-panel .test-item.severity-1 {
                    border-left-width: 4px;
                }
                #mobile-test-panel .test-item.severity-2 {
                    border-left-width: 3px;
                }
                #mobile-test-panel .test-item h4 {
                    margin: 0 0 8px 0;
                    font-size: 13px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                #mobile-test-panel .test-item p {
                    margin: 0;
                    font-size: 11px;
                    color: #666;
                    font-family: 'Courier New', monospace;
                }
                #mobile-test-panel .status-badge {
                    padding: 2px 8px;
                    border-radius: 8px;
                    font-size: 10px;
                    font-weight: 600;
                }
                #mobile-test-panel .status-pass {
                    background: #d4edda;
                    color: #155724;
                }
                #mobile-test-panel .status-fail {
                    background: #f8d7da;
                    color: #721c24;
                }
                #mobile-test-panel .summary {
                    margin-top: 16px;
                    padding: 16px;
                    background: #e7f3ff;
                    border-radius: 8px;
                }
                #mobile-test-panel .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    text-align: center;
                }
                #mobile-test-panel .summary-card .number {
                    font-size: 24px;
                    font-weight: 700;
                    color: #667eea;
                }
                #mobile-test-panel .summary-card .label {
                    font-size: 11px;
                    color: #666;
                }
                #mobile-test-panel .run-btn {
                    width: 100%;
                    padding: 12px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-bottom: 16px;
                }
                #mobile-test-panel .run-btn:hover {
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }
                #mobile-test-panel .suite-section {
                    margin: 12px 0;
                }
                #mobile-test-panel .suite-section h3 {
                    font-size: 14px;
                    margin: 0 0 8px 0;
                    color: #333;
                }
            </style>

            <div class="test-header">
                <h3>📱 移动端测试面板</h3>
                <div class="test-actions">
                    <button onclick="toggleMinimize()">_</button>
                    <button onclick="closeTestPanel()">×</button>
                </div>
            </div>

            <div class="test-content">
                <button class="run-btn" onclick="runMobileTests()">▶️ 运行测试</button>
                <div id="testResults"></div>
            </div>
        `;

        document.body.appendChild(panel);

        // 使面板可拖动
        makeDraggable(panel);
    }

    function makeDraggable(element) {
        const header = element.querySelector('.test-header');
        let isDragging = false;
        let currentX, currentY, initialX, initialY;

        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            if (e.target.tagName === 'BUTTON') return;
            initialX = e.clientX - element.offsetLeft;
            initialY = e.clientY - element.offsetTop;
            isDragging = true;
        }

        function drag(e) {
            if (!isDragging) return;
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            element.style.left = currentX + 'px';
            element.style.top = currentY + 'px';
            element.style.right = 'auto';
        }

        function dragEnd() {
            isDragging = false;
        }
    }

    function toggleMinimize() {
        const panel = document.getElementById('mobile-test-panel');
        panel.classList.toggle('minimized');
    }

    function closeTestPanel() {
        const panel = document.getElementById('mobile-test-panel');
        panel.remove();
    }

    function runMobileTests() {
        const resultsDiv = document.getElementById('testResults');
        resultsDiv.innerHTML = '<p style="text-align: center; color: #666;">运行中...</p>';

        const results = { total: 0, pass: 0, fail: 0, problems: [] };
        const isMobile = window.innerWidth <= 768;

        let html = '';

        testSuites.forEach(suite => {
            html += '<div class="suite-section">';
            html += `<h3>${suite.name}</h3>`;

            suite.tests.forEach(test => {
                // 检查是否应该跳过此测试
                if (test.mobileOnly && !isMobile) {
                    return;
                }
                if (test.desktopOnly && isMobile) {
                    return;
                }

                results.total++;

                try {
                    const result = test.check();

                    if (result.pass) {
                        results.pass++;
                        html += `
                            <div class="test-item pass severity-${test.severity}">
                                <h4>${test.name} <span class="status-badge status-pass">✓ 通过</span></h4>
                                <p>${result.message}</p>
                            </div>
                        `;
                    } else {
                        results.fail++;
                        results.problems.push({ test: test.name, message: result.message, severity: test.severity });
                        html += `
                            <div class="test-item fail severity-${test.severity}">
                                <h4>${test.name} <span class="status-badge status-fail">✗ 失败</span></h4>
                                <p>${result.message}</p>
                            </div>
                        `;
                    }
                } catch (error) {
                    results.fail++;
                    results.problems.push({ test: test.name, message: `错误: ${error.message}`, severity: 1 });
                    html += `
                        <div class="test-item fail severity-1">
                            <h4>${test.name} <span class="status-badge status-fail">✗ 错误</span></h4>
                            <p>测试执行出错: ${error.message}</p>
                        </div>
                    `;
                }
            });

            html += '</div>';
        });

        // 添加总结
        html += `
            <div class="summary">
                <div class="summary-grid">
                    <div class="summary-card">
                        <div class="number">${results.total}</div>
                        <div class="label">总测试</div>
                    </div>
                    <div class="summary-card">
                        <div class="number" style="color: #28a745;">${results.pass}</div>
                        <div class="label">通过</div>
                    </div>
                    <div class="summary-card">
                        <div class="number" style="color: #dc3545;">${results.fail}</div>
                        <div class="label">失败</div>
                    </div>
                </div>
            </div>
        `;

        resultsDiv.innerHTML = html;

        // 控制台输出
        console.log('%c📱 移动端测试完成', 'font-size: 16px; font-weight: bold;');
        console.log(`总计: ${results.total} | 通过: ${results.pass} | 失败: ${results.fail}`);
        if (results.problems.length > 0) {
            console.warn('%c⚠️ 发现的问题:', 'font-weight: bold; color: #dc3545;');
            results.problems.forEach(p => {
                console.warn(`  [${p.test}] ${p.message}`);
            });
        }
    }

    // 初始化
    createTestPanel();
    console.log('%c📱 移动端测试面板已加载', 'font-size: 14px; font-weight: bold; color: #667eea;');
    console.log('点击右上角的"运行测试"按钮开始测试');

})();
