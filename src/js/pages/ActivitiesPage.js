/**
 * ActivitiesPage - Page 层
 * 负责活动数据的获取、状态管理和业务逻辑
 *
 * 职责：
 * - 数据获取 (fetch)
 * - 状态管理 (filters, activities)
 * - 业务判断 (筛选、分类、排序)
 * - 通知组件更新
 *
 * 不负责：
 * - DOM 操作
 * - 样式处理
 * - 具体展示逻辑
 */

import { API } from '../data/api.js';
import { DateHelper } from '../utils/dateHelper.js';
import { APICache } from '../utils/api-cache.js';
import { PerfMonitor } from '../utils/error-tracker.js';

export class ActivitiesPage {
    constructor(options = {}) {
        // 状态管理
        this.state = {
            // 原始数据
            allActivities: [],
            // 当前筛选条件
            filters: {
                category: '全部',
                price: '全部',
                day: null,
                search: ''
            },
            // 当前 Tab (0=兴趣班, 1=市集, 2=音乐, 3=灵活时间, 4=网站, 5=攻略)
            currentTab: 0,
            // 分页相关
            currentWeekOffset: 0,
            isPageFirstLoad: true
        };

        // 配置
        this.config = {
            // 兴趣班Tab的分类白名单
            interestCategories: ['瑜伽', '冥想', '舞蹈', '泰拳', '音乐', '文化艺术', '健身'],
            // 分类颜色映射
            categoryColors: {
                '瑜伽': '#FF6B6B',
                '冥想': '#4ECDC4',
                '户外探险': '#FFE66D',
                '文化艺术': '#95E1D3',
                '美食体验': '#F38181',
                '节庆活动': '#AA96DA',
                '其他': '#667eea'
            }
        };

        // 回调函数（用于通知组件更新）
        this.callbacks = {
            onDataLoaded: options.onDataLoaded || (() => {}),
            onFiltersChange: options.onFiltersChange || (() => {}),
            onTabChange: options.onTabChange || (() => {})
        };

        // 活动颜色缓存
        this.activityColorsCache = {};
        this.activityColorPalette = this._generateColorPalette();
    }

    // ============================================
    // 数据获取层
    // ============================================

    /**
     * 获取活动数据
     */
    async fetchActivities() {
        try {
            PerfMonitor.start('fetchActivities');

            const result = await APICache.fetch('http://localhost:3000/api/activities?limit=1000');

            PerfMonitor.end('fetchActivities');

            if (result.success && result.data) {
                this.state.allActivities = this._processActivities(result.data);
                this._updateTabCounts();
                this._initCategoryFilters();

                console.log('✅ 已加载', this.state.allActivities.length, '个活动');
                this.callbacks.onDataLoaded(this.state.allActivities);
                return this.state.allActivities;
            }
        } catch (error) {
            console.error('❌ 获取活动失败:', error);
            throw error;
        }
    }

    // ============================================
    // 业务逻辑层
    // ============================================

    /**
     * 处理活动数据
     * @private
     */
    _processActivities(rawData) {
        const processed = [];

        rawData.forEach(item => {
            // 过滤掉非"进行中"状态的活动
            if (item.status !== '进行中') {
                return;
            }

            const days = this._parseDaysFromWeekdays(item.weekdays);

            // 如果有多个星期，为每个星期创建一个副本
            if (days && days.length > 0) {
                days.forEach(day => {
                    processed.push({
                        id: item.id || item._id,
                        originalId: item.id || item._id,
                        name: item.title,
                        title: item.title,
                        category: item.category,
                        price: item.price,
                        priceMin: item.priceMin,
                        priceMax: item.priceMax,
                        location: item.location,
                        time: item.time,
                        description: item.description,
                        day: day,
                        frequency: item.frequency || 'weekly',
                        source: item.source || null,
                        flexibleTime: item.flexibleTime || '否',
                        color: this._getActivityColor(item.id || item._id)
                    });
                });
            } else {
                // 没有星期信息或临时活动
                processed.push({
                    id: item.id || item._id,
                    name: item.title,
                    title: item.title,
                    category: item.category,
                    price: item.price,
                    location: item.location,
                    time: item.time,
                    description: item.description,
                    day: null,
                    frequency: 'once',
                    source: item.source || null,
                    flexibleTime: item.flexibleTime || '否',
                    color: this._getActivityColor(item.id || item._id)
                });
            }
        });

        return processed;
    }

    /**
     * 解析 weekdays 字符串
     * @private
     */
    _parseDaysFromWeekdays(weekdays) {
        if (!weekdays) return [];

        const dayMap = {
            '周日': 0, '周日 ': 0,
            '周一': 1, '周一 ': 1,
            '周二': 2, '周二 ': 2,
            '周三': 3, '周三 ': 3,
            '周四': 4, '周四 ': 4,
            '周五': 5, '周五 ': 5,
            '周六': 6, '周六 ': 6
        };

        const days = [];
        const parts = weekdays.split(',');

        parts.forEach(part => {
            const trimmed = part.trim();
            if (dayMap.hasOwnProperty(trimmed)) {
                days.push(dayMap[trimmed]);
            }
        });

        return days;
    }

    /**
     * 根据活动ID获取颜色
     * @private
     */
    _getActivityColor(id) {
        if (this.activityColorsCache[id]) {
            return this.activityColorsCache[id];
        }

        const hash = id.toString().split('').reduce((acc, char) => {
            return acc + char.charCodeAt(0);
        }, 0);

        const colorIndex = hash % this.activityColorPalette.length;
        const color = this.activityColorPalette[colorIndex];

        this.activityColorsCache[id] = color;
        return color;
    }

    /**
     * 生成颜色调色板
     * @private
     */
    _generateColorPalette() {
        return [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
            '#F7DC6F', '#BB8FCE', '#85C1E9', '#F1948A', '#82E0AA',
            '#E59866', '#D7BDE2', '#A3E4D7', '#FAD7A0', '#F5B7B1',
            '#AED6F1', '#ABEBC6', '#F9E79F', '#D2B4DE', '#E8DAEF'
        ];
    }

    // ============================================
    // 筛选和查询层
    // ============================================

    /**
     * 获取当前 Tab 的活动
     */
    getActivitiesForTab(tabId) {
        let activities = this.state.allActivities;

        // 根据 Tab 筛选
        switch (tabId) {
            case 0: // 兴趣班
                activities = activities.filter(a =>
                    this.config.interestCategories.includes(a.category)
                );
                break;
            case 1: // 市集
                activities = activities.filter(a => a.category === '市集');
                break;
            case 2: // 音乐
                activities = activities.filter(a => a.category === '音乐');
                break;
            case 3: // 灵活时间
                activities = activities.filter(a => a.flexibleTime === '是');
                break;
            case 4: // 活动网站
            case 5: // 攻略
                activities = [];
                break;
        }

        // 应用其他筛选条件
        activities = this._applyFilters(activities);

        return activities;
    }

    /**
     * 应用筛选条件
     * @private
     */
    _applyFilters(activities) {
        const { filters } = this.state;

        // 分类筛选
        if (filters.category && filters.category !== '全部') {
            activities = activities.filter(a => a.category === filters.category);
        }

        // 价格筛选
        if (filters.price && filters.price !== '全部') {
            activities = activities.filter(a => {
                const price = a.priceMin || 0;
                switch (filters.price) {
                    case '免费': return price === 0;
                    case '0-100': return price >= 0 && price <= 100;
                    case '100-300': return price > 100 && price <= 300;
                    case '300-500': return price > 300 && price <= 500;
                    case '500+': return price > 500;
                    default: return true;
                }
            });
        }

        // 日期筛选
        if (filters.day !== null) {
            activities = activities.filter(a => a.day === filters.day);
        }

        // 搜索筛选
        if (filters.search) {
            const keyword = filters.search.toLowerCase();
            activities = activities.filter(a =>
                a.title.toLowerCase().includes(keyword) ||
                a.location.toLowerCase().includes(keyword) ||
                a.category.toLowerCase().includes(keyword)
            );
        }

        return activities;
    }

    /**
     * 设置筛选条件
     */
    setFilter(type, value) {
        this.state.filters[type] = value;
        this.callbacks.onFiltersChange(this.state.filters);
    }

    /**
     * 获取可用的分类列表
     */
    getAvailableCategories() {
        const categories = new Set(this.state.allActivities.map(a => a.category));
        return ['全部', ...Array.from(categories)];
    }

    /**
     * 获取今天的活动
     */
    getTodayActivities() {
        const today = DateHelper.getTodayDayOfWeek();
        return this.state.allActivities.filter(a => a.day === today);
    }

    /**
     * 获取指定日期的活动
     */
    getActivitiesForDay(day) {
        return this.state.allActivities.filter(a => a.day === day);
    }

    // ============================================
    // Tab 管理
    // ============================================

    /**
     * 切换 Tab
     */
    switchTab(tabId) {
        this.state.currentTab = tabId;
        this.callbacks.onTabChange(tabId);
    }

    /**
     * 获取当前 Tab
     */
    getCurrentTab() {
        return this.state.currentTab;
    }

    /**
     * 更新 Tab 计数
     * @private
     */
    _updateTabCounts() {
        const counts = {
            0: this.state.allActivities.filter(a =>
                this.config.interestCategories.includes(a.category)).length,
            1: this.state.allActivities.filter(a => a.category === '市集').length,
            2: this.state.allActivities.filter(a => a.category === '音乐').length,
            3: this.state.allActivities.filter(a => a.flexibleTime === '是').length,
            4: 0, // 活动网站
            5: 0  // 攻略
        };

        this.state.tabCounts = counts;
    }

    /**
     * 获取 Tab 计数
     */
    getTabCounts() {
        return this.state.tabCounts || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }

    /**
     * 初始化分类筛选器
     * @private
     */
    _initCategoryFilters() {
        const categories = this.getAvailableCategories();
        this.state.availableCategories = categories;
    }

    /**
     * 获取可用分类
     */
    getCategories() {
        return this.state.availableCategories || ['全部'];
    }

    // ============================================
    // 生命周期
    // ============================================

    /**
     * 初始化页面
     */
    async init() {
        await this.fetchActivities();
        console.log('✅ ActivitiesPage 初始化完成');
    }

    /**
     * 销毁页面
     */
    destroy() {
        this.state.allActivities = [];
        this.state.filters = {
            category: '全部',
            price: '全部',
            day: null,
            search: ''
        };
        this.activityColorsCache = {};
        console.log('✅ ActivitiesPage 已销毁');
    }
}
