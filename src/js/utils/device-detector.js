/**
 * 设备检测模块
 * 负责检测设备类型和运行模式
 * 从 index.html 迁移而来，符合架构规范
 */

export class DeviceDetector {
    /**
     * 检测设备类型和运行模式
     * @returns {Object} { mode: 'h5'|'pc', isMobile: boolean }
     */
    static detect() {
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
            .test(navigator.userAgent);
        const isH5Mode = mode === 'h5' || (mode === null && isMobile);

        return {
            mode: isH5Mode ? 'h5' : 'pc',
            isMobile
        };
    }

    /**
     * 应用设备相关的 CSS 类到 body
     * 用于样式适配
     */
    static applyClasses() {
        const { mode, isMobile } = this.detect();

        // 等待 DOM 加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this._applyClasses(mode, isMobile);
            });
        } else {
            this._applyClasses(mode, isMobile);
        }
    }

    /**
     * 内部方法：实际应用类名
     * @private
     */
    static _applyClasses(mode, isMobile) {
        document.body.classList.add(`mode-${mode}`);
        if (isMobile) {
            document.body.classList.add('is-mobile');
        }
        console.log('🔍 检测到显示模式:', mode.toUpperCase(), '| 移动设备:', isMobile);
    }

    /**
     * 获取当前运行模式
     * @returns {string} 'h5' | 'pc'
     */
    static getMode() {
        return this.detect().mode;
    }

    /**
     * 判断是否为移动设备
     * @returns {boolean}
     */
    static isMobile() {
        return this.detect().isMobile;
    }
}

// 导出全局常量（兼容旧代码）
export const CHIENGMAI_MODE = DeviceDetector.getMode();
export const CHIENGMAI_IS_MOBILE = DeviceDetector.isMobile();

// 兼容 window 全局变量（如果需要）
if (typeof window !== 'undefined') {
    window.CHIENGMAI_MODE = CHIENGMAI_MODE;
    window.CHIENGMAI_IS_MOBILE = CHIENGMAI_IS_MOBILE;
}
