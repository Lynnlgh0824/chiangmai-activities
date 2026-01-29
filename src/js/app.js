/**
 * 清迈活动平台 - App 根组件
 * 符合架构规范：负责生成和管理整个应用结构
 */

import { ActivitiesPage } from './pages/ActivitiesPage.js';
import { eventBus, Events } from './utils/EventBus.js';

export class App {
    constructor() {
        this.container = null;
        this.modules = {};
        this.pages = {};
        this.isInitialized = false;
    }

    /**
     * 初始化应用
     */
    async init() {
        if (this.isInitialized) {
            console.warn('⚠️ 应用已经初始化过了');
            return;
        }

        // 等待 DOM 准备就绪
        await this.waitForDOM();

        // 挂载应用
        this.mount('#app');

        // 加载模块
        await this.loadModules();

        // 初始化 Page 层
        await this.initPages();

        // 渲染 UI
        this.render();

        // 初始化各子模块
        await this.initModules();

        // 绑定事件
        this.bindEvents();

        this.isInitialized = true;
        console.log('✅ App 初始化完成');
    }

    /**
     * 等待 DOM 准备就绪
     */
    async waitForDOM() {
        return new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    /**
     * 挂载到指定选择器
     */
    mount(selector) {
        this.container = document.querySelector(selector);
        if (!this.container) {
            throw new Error(`找不到挂载点: ${selector}`);
        }
    }

    /**
     * 动态加载所有模块
     */
    async loadModules() {
        try {
            // 动态导入各组件模块
            const modules = await Promise.all([
                import('./components/Header.js'),
                import('./components/FilterSection.js'),
                import('./components/TabsNav.js'),
                import('./components/TabContent.js')
            ]);

            // 保存模块引用
            this.modules = {
                Header: modules[0].Header,
                FilterSection: modules[1].FilterSection,
                TabsNav: modules[2].TabsNav,
                TabContent: modules[3].TabContent
            };

            console.log('✅ 所有模块加载完成');
        } catch (error) {
            console.error('❌ 模块加载失败:', error);
            throw error;
        }
    }

    /**
     * 初始化 Page 层
     */
    async initPages() {
        try {
            // 创建 ActivitiesPage
            this.activitiesPage = new ActivitiesPage({
                onDataLoaded: (activities) => {
                    console.log('📦 数据已加载:', activities.length, '个活动');
                    eventBus.emit(Events.DATA_LOADED, activities);
                    this.updateTabCounts();
                },
                onFiltersChange: (filters) => {
                    console.log('🔍 筛选条件已更新:', filters);
                    eventBus.emit(Events.FILTER_CHANGE, filters);
                },
                onTabChange: (tabId) => {
                    console.log('🔄 Tab 已切换:', tabId);
                    eventBus.emit(Events.TAB_CHANGE, tabId);
                }
            });

            // 初始化页面数据
            await this.activitiesPage.init();

            console.log('✅ 所有 Page 层初始化完成');
        } catch (error) {
            console.error('❌ Page 层初始化失败:', error);
            throw error;
        }
    }

    /**
     * 更新 Tab 计数
     */
    updateTabCounts() {
        const counts = this.activitiesPage.getTabCounts();
        const tabsNav = this.container.querySelector('.tabs-nav');
        if (tabsNav) {
            const tabItems = tabsNav.querySelectorAll('.tab-item');
            tabItems.forEach(item => {
                const tabId = parseInt(item.dataset.tab);
                const countEl = item.querySelector('.tab-count');
                if (countEl && counts[tabId] !== undefined) {
                    countEl.textContent = `(${counts[tabId]})`;
                }
            });
        }
    }

    /**
     * 渲染整个应用结构
     */
    render() {
        const header = new this.modules.Header();
        const filterSection = new this.modules.FilterSection();
        const tabsNav = new this.modules.TabsNav();
        const tabContent = new this.modules.TabContent();

        this.container.innerHTML = `
            <div class="container">
                <!-- 头部 -->
                ${header.render()}

                <!-- 筛选区域 -->
                ${filterSection.render()}

                <!-- Tab导航 -->
                ${tabsNav.render()}

                <!-- Tab内容 -->
                ${tabContent.render()}
            </div>
        `;

        console.log('✅ App UI 渲染完成');
    }

    /**
     * 初始化各子模块
     */
    async initModules() {
        // 初始化 Header
        const headerEl = this.container.querySelector('.header');
        if (headerEl) {
            // Header 初始化逻辑（如果需要）
        }

        // 初始化 FilterSection
        const filterEl = this.container.querySelector('.filter-section');
        if (filterEl) {
            // FilterSection 初始化逻辑
        }

        // 初始化 TabsNav
        const tabsNavEl = this.container.querySelector('.tabs-nav');
        if (tabsNavEl) {
            // TabsNav 初始化逻辑
        }

        // 初始化 TabContent
        const tabContentEl = this.container.querySelector('.tab-content');
        if (tabContentEl) {
            // TabContent 初始化逻辑
        }

        console.log('✅ 所有子模块初始化完成');
    }

    /**
     * 绑定全局事件
     */
    bindEvents() {
        // 搜索功能
        const searchInput = this.container.querySelector('.search-input');
        const searchBtn = this.container.querySelector('.search-btn');
        const searchIconBtn = this.container.querySelector('.search-icon-btn');

        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        }

        if (searchIconBtn) {
            searchIconBtn.addEventListener('click', () => this.performSearch());
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        // 将 app 实例暴露到 window（供现有的 onclick 调用）
        // ⚠️ 这是临时方案，后续应该改用事件系统
        window.app = this;
        window.performSearch = (keyword) => this.performSearch(keyword);
        window.setFilter = (type, value) => this.handleFilterChange(type, value);
        window.switchTab = (tabId) => this.handleTabSwitch(tabId);

        console.log('✅ 全局事件绑定完成');
    }

    /**
     * 处理筛选变化
     */
    handleFilterChange(type, value) {
        console.log('🔍 筛选变化:', type, value);

        // 调用 Page 层的筛选方法
        if (this.activitiesPage) {
            this.activitiesPage.setFilter(type, value);
        }

        // 触发事件
        eventBus.emit(Events.FILTER_CHANGE, { type, value });
    }

    /**
     * 处理 Tab 切换
     */
    handleTabSwitch(tabId) {
        console.log('🔄 Tab 切换:', tabId);

        // 调用 Page 层的 Tab 切换方法
        if (this.activitiesPage) {
            this.activitiesPage.switchTab(tabId);
        }

        // 更新 UI
        const tabsNav = this.modules.TabsNav ?
            new this.modules.TabsNav() : null;
        const tabContent = this.modules.TabContent ?
            new this.modules.TabContent() : null;

        if (tabsNav) {
            tabsNav.switchTab(tabId);
        }
        if (tabContent) {
            tabContent.switchTab(tabId);
        }

        // 触发事件
        eventBus.emit(Events.TAB_CHANGE, tabId);
    }

    /**
     * 执行搜索
     */
    performSearch(keyword) {
        const searchInput = this.container.querySelector('.search-input');
        if (!searchInput) return;

        const searchKeyword = keyword || searchInput.value.trim();
        console.log('🔍 搜索关键词:', searchKeyword);

        // 调用 Page 层的搜索方法
        if (this.activitiesPage) {
            this.activitiesPage.setFilter('search', searchKeyword);
        }

        // 触发搜索事件
        eventBus.emit(Events.SEARCH, searchKeyword);
    }

    /**
     * 销毁应用
     */
    destroy() {
        // 销毁 Page 层
        if (this.activitiesPage) {
            this.activitiesPage.destroy();
        }

        // 清空事件总线
        eventBus.clear();

        if (this.container) {
            this.container.innerHTML = '';
        }

        this.modules = {};
        this.pages = {};
        this.isInitialized = false;
        console.log('✅ App 已销毁');
    }
}
