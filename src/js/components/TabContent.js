/**
 * TabContent 组件
 * 负责渲染 Tab 内容区域
 */

export class TabContent {
    constructor(options = {}) {
        this.tabs = options.tabs || [0, 1, 2, 3, 4, 5];
        this.activeTab = options.activeTab || 0;
    }

    /**
     * 渲染 TabContent 组件
     * @returns {string} HTML 字符串
     */
    render() {
        return `
            <div class="tab-content">
                ${this.renderTab0()}
                ${this.renderTab1()}
                ${this.renderTab2()}
                ${this.renderTab3()}
                ${this.renderTab4()}
                ${this.renderTab5()}
            </div>
        `;
    }

    /**
     * Tab 0: 兴趣班
     */
    renderTab0() {
        return `
            <div id="tab-0" class="tab-pane ${this.activeTab === 0 ? 'active' : ''}">
                <div class="date-grid-header" id="dateHeader"></div>
                <div class="calendar-grid" id="calendarGrid"></div>
            </div>
        `;
    }

    /**
     * Tab 1: 市集
     */
    renderTab1() {
        return `
            <div id="tab-1" class="tab-pane ${this.activeTab === 1 ? 'active' : ''}">
                <div class="date-grid-header" id="dateHeader1"></div>
                <div class="calendar-grid" id="calendarGrid1"></div>
            </div>
        `;
    }

    /**
     * Tab 2: 音乐
     */
    renderTab2() {
        return `
            <div id="tab-2" class="tab-pane ${this.activeTab === 2 ? 'active' : ''}">
                <div class="date-grid-header" id="dateHeader2"></div>
                <div class="calendar-grid" id="calendarGrid2"></div>
            </div>
        `;
    }

    /**
     * Tab 3: 灵活时间活动
     */
    renderTab3() {
        return `
            <div id="tab-3" class="tab-pane ${this.activeTab === 3 ? 'active' : ''}">
                <div id="flexibleActivitiesList"></div>
            </div>
        `;
    }

    /**
     * Tab 4: 活动网站
     */
    renderTab4() {
        return `
            <div id="tab-4" class="tab-pane ${this.activeTab === 4 ? 'active' : ''}">
                <div class="websites-container" id="websitesContainer"></div>
            </div>
        `;
    }

    /**
     * Tab 5: 攻略信息
     */
    renderTab5() {
        return `
            <div id="tab-5" class="tab-pane ${this.activeTab === 5 ? 'active' : ''}">
                <div class="guide-content" id="guideContent"></div>
            </div>
        `;
    }

    /**
     * 切换到指定 Tab
     * @param {number} tabId - Tab ID
     */
    switchTab(tabId) {
        this.activeTab = tabId;

        // 隐藏所有 Tab
        const allPanes = document.querySelectorAll('.tab-pane');
        allPanes.forEach(pane => {
            pane.classList.remove('active');
        });

        // 显示目标 Tab
        const targetPane = document.getElementById(`tab-${tabId}`);
        if (targetPane) {
            targetPane.classList.add('active');
        }

        // 触发切换事件（如果有）
        this.onTabChange?.(tabId);
    }

    /**
     * 获取指定 Tab 的容器
     * @param {number} tabId - Tab ID
     * @returns {HTMLElement|null}
     */
    getTabContainer(tabId) {
        return document.getElementById(`tab-${tabId}`);
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
