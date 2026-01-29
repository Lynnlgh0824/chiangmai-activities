/**
 * FilterSection 组件
 * 负责渲染筛选区域（分类和价格）
 */

export class FilterSection {
    constructor(options = {}) {
        this.categories = options.categories || ['全部'];
        this.priceRanges = options.priceRanges || [
            { label: '全部', value: '全部' },
            { label: '免费', value: '免费' },
            { label: '0-100', value: '0-100' },
            { label: '100-300', value: '100-300' },
            { label: '300-500', value: '300-500' },
            { label: '500+', value: '500+' }
        ];
    }

    /**
     * 渲染 FilterSection 组件
     * @returns {string} HTML 字符串
     */
    render() {
        return `
            <div class="filter-section">
                <div class="filter-row">
                    ${this.renderCategoryFilter()}
                    ${this.renderPriceFilter()}
                </div>
            </div>
        `;
    }

    /**
     * 渲染分类筛选器
     * @returns {string} HTML 字符串
     */
    renderCategoryFilter() {
        const categoryChips = this.categories.map((cat, index) => `
            <div
                class="filter-chip ${index === 0 ? 'active' : ''}"
                onclick="window.setFilter?.('category', '${cat}')"
            >
                ${cat}
            </div>
        `).join('');

        return `
            <div class="filter-group">
                <span class="filter-label">分类:</span>
                <div class="filter-chips" id="categoryChips">
                    ${categoryChips}
                </div>
            </div>
        `;
    }

    /**
     * 渲染价格筛选器
     * @returns {string} HTML 字符串
     */
    renderPriceFilter() {
        const priceChips = this.priceRanges.map((range, index) => `
            <div
                class="filter-chip ${index === 0 ? 'active' : ''}"
                onclick="window.setFilter?.('price', '${range.value}')"
            >
                ${range.label}
            </div>
        `).join('');

        return `
            <div class="filter-group">
                <span class="filter-label">价格:</span>
                <div class="filter-chips" id="priceChips">
                    ${priceChips}
                </div>
            </div>
        `;
    }

    /**
     * 更新分类选项
     * @param {Array} categories - 新的分类列表
     */
    updateCategories(categories) {
        this.categories = categories;
        const container = document.getElementById('categoryChips');
        if (container) {
            container.innerHTML = categories.map((cat, index) => `
                <div
                    class="filter-chip ${index === 0 ? 'active' : ''}"
                    onclick="window.setFilter?.('category', '${cat}')"
                >
                    ${cat}
                </div>
            `).join('');
        }
    }

    /**
     * 设置选中的筛选器
     * @param {string} type - 'category' | 'price'
     * @param {string} value - 选中的值
     */
    setActive(type, value) {
        const containerId = type === 'category' ? 'categoryChips' : 'priceChips';
        const container = document.getElementById(containerId);

        if (container) {
            const chips = container.querySelectorAll('.filter-chip');
            chips.forEach(chip => {
                chip.classList.remove('active');
                if (chip.textContent.trim() === value) {
                    chip.classList.add('active');
                }
            });
        }
    }
}
