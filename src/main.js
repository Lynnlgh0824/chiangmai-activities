/**
 * 清迈活动平台 - 主入口文件
 * 符合架构规范：单一入口，统一管理
 */

import { DeviceDetector } from './js/utils/device-detector.js';

// =====================================================
// 防止 FOUC (Flash of Unstyled Content)
// 从 index.html 迁移而来
// =====================================================
(function preventFOUC() {
    if (document.readyState === 'loading') {
        document.documentElement.style.visibility = 'hidden';
        document.addEventListener('DOMContentLoaded', () => {
            // 延迟显示，等待应用初始化完成
            setTimeout(() => {
                document.documentElement.style.visibility = 'visible';
            }, 100);
        });
    }
})();

// =====================================================
// 设备检测和模式初始化
// =====================================================
DeviceDetector.applyClasses();

// =====================================================
// 架构护城河：开发环境下检测违规
// =====================================================
if (import.meta.env?.DEV || window.location.hostname === 'localhost') {
    const forbidden = [
        'toast',
        'dialog',
        'loading',
        'pullIndicator',
        'calendarGrid',
        'filterSection'
    ];

    window.addEventListener('DOMContentLoaded', () => {
        forbidden.forEach(id => {
            if (document.getElementById(id)) {
                console.error(`❌ 架构违规：入口层存在功能性节点 #${id}`);
                console.error(`请将 #${id} 移到组件中管理`);
                // 开发环境抛出错误，生产环境仅警告
                if (import.meta.env?.DEV) {
                    throw new Error(`架构违规：入口层存在 #${id}`);
                }
            }
        });
    });
}

// =====================================================
// 应用入口
// =====================================================
async function bootstrap() {
    try {
        // 动态导入 App 组件
        const { App } = await import('./js/app.js');

        // 创建并挂载应用
        const app = new App();
        await app.init();

        console.log('✅ 应用启动成功');
        console.log('📦 运行模式:', DeviceDetector.getMode().toUpperCase());
    } catch (error) {
        console.error('❌ 应用启动失败:', error);
        // 确保在错误情况下也能显示内容
        document.documentElement.style.visibility = 'visible';

        // 显示错误提示（生产环境友好）
        const appDiv = document.getElementById('app');
        if (appDiv) {
            appDiv.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 20px;
                    text-align: center;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                ">
                    <h2 style="color: #e74c3c; margin-bottom: 16px;">应用启动失败</h2>
                    <p style="color: #7f8c8d; max-width: 400px;">
                        抱歉，应用遇到了一些问题。请刷新页面重试，或联系技术支持。
                    </p>
                    <button onclick="location.reload()" style="
                        margin-top: 20px;
                        padding: 12px 24px;
                        background: #3498db;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 16px;
                    ">
                        重新加载
                    </button>
                </div>
            `;
        }
    }
}

// 启动应用
bootstrap();

// =====================================================
// 导出供外部使用（如果需要）
// =====================================================
export { DeviceDetector };
