/**
 * TabsNav 组件
 * 负责渲染 Tab 导航
 */

// Tab 配置（常量）
const TABS_CONFIG = [
    { id: 0, icon: '📚', label: '兴趣班' },
    { id: 1, icon: '🏪', label: '市集' },
    { id: 2, icon: '🎵', label: '音乐' },
    { id: 3, icon: '🕐', label: '灵活时间' },
    { id: 4, icon: '🌐', label: '活动网站' },
    { id: 5, icon: '📖', label: '攻略' }
];

export class TabsNav {
    constructor(options = {}) {
        this.tabs = options.tabs || TABS_CONFIG;
        this.activeTab = options.activeTab || 0;
        this.counts = options.counts || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }

    /**
     * 渲染 TabsNav 组件
     * @returns {string} HTML 字符串
     */
    render() {
        const tabsHtml = this.tabs.map(tab => `
            <div
                class="tab-item ${tab.id === this.activeTab ? 'active' : ''}"
                data-tab="${tab.id}"
                onclick="window.switchTab?.(${tab.id})"
            >
                <span class="tab-icon">${tab.icon}</span>
                ${tab.label}
                <span class="tab-count">(${this.counts[tab.id] || 0})</span>
            </div>
        `).join('');

        return `
            <div class="tabs-nav">
                ${tabsHtml}
            </div>
        `;
    }

    /**
     * 切换到指定 Tab
     * @param {number} tabId - Tab ID
     */
    switchTab(tabId) {
        this.activeTab = tabId;

        // 更新 UI
        const tabs = document.querySelectorAll('.tab-item');
        tabs.forEach(tab => {
            const tabNumber = parseInt(tab.dataset.tab);
            if (tabNumber === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // 触发切换事件（如果有）
        this.onTabChange?.(tabId);
    }

    /**
     * 更新 Tab 的计数
     * @param {number} tabId - Tab ID
     * @param {number} count - 新的计数
     */
    updateCount(tabId, count) {
        this.counts[tabId] = count;

        const tab = document.querySelector(`.tab-item[data-tab="${tabId}"]`);
        if (tab) {
            const countEl = tab.querySelector('.tab-count');
            if (countEl) {
                countEl.textContent = `(${count})`;
            }
        }
    }

    /**
     * 批量更新所有 Tab 的计数
     * @param {Object} counts - 计数对象 { 0: 10, 1: 5, ... }
     */
    updateAllCounts(counts) {
        this.counts = { ...this.counts, ...counts };

        Object.keys(counts).forEach(tabId => {
            this.updateCount(parseInt(tabId), counts[tabId]);
        });
    }

    /**
     * 设置 Tab 切换回调
     * @param {Function} callback - 回调函数
     */
    onTabChange(callback) {
        this._tabChangeCallback = callback;
    }

    /**
     * 获取当前激活的 Tab
     * @returns {number} Tab ID
     */
    getActiveTab() {
        return this.activeTab;
    }
}

// 导出 Tab 配置供外部使用
export { TABS_CONFIG };
