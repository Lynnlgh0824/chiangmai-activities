/**
 * Header 组件
 * 负责渲染应用头部和搜索区域
 */

export class Header {
    constructor(options = {}) {
        this.title = options.title || '✨ 清迈活动探索';
        this.placeholder = options.placeholder || '搜索活动、地点、关键词...';
    }

    /**
     * 渲染 Header 组件
     * @returns {string} HTML 字符串
     */
    render() {
        return `
            <div class="header">
                <h1>${this.title}</h1>
                <div class="search-section">
                    ${this.renderSearchInput()}
                    <button class="search-btn" onclick="window.app?.performSearch()">搜索</button>
                </div>
            </div>
        `;
    }

    /**
     * 渲染搜索输入框
     * @returns {string} HTML 字符串
     */
    renderSearchInput() {
        return `
            <div class="search-input-wrapper">
                <span class="search-icon">🔍</span>
                <input
                    type="text"
                    class="search-input"
                    id="searchInput"
                    placeholder="${this.placeholder}"
                    autocomplete="off"
                />
                <button
                    class="search-icon-btn"
                    onclick="window.app?.performSearch()"
                    aria-label="搜索"
                >
                    🔍
                </button>
            </div>
        `;
    }

    /**
     * 获取搜索关键词
     * @returns {string}
     */
    getKeyword() {
        const input = document.getElementById('searchInput');
        return input ? input.value.trim() : '';
    }

    /**
     * 清空搜索框
     */
    clear() {
        const input = document.getElementById('searchInput');
        if (input) {
            input.value = '';
        }
    }

    /**
     * 聚焦搜索框
     */
    focus() {
        const input = document.getElementById('searchInput');
        if (input) {
            input.focus();
        }
    }
}
