/**
 * EventBus - 事件总线
 * 实现组件之间的解耦通信
 *
 * 用法：
 * import { EventBus } from './utils/EventBus.js';
 *
 * // 监听事件
 * EventBus.on('filter:change', (data) => { ... });
 *
 * // 触发事件
 * EventBus.emit('filter:change', { type: 'category', value: '瑜伽' });
 *
 * // 取消监听
 * EventBus.off('filter:change', handler);
 */

export class EventBus {
    constructor() {
        // 存储事件监听器
        this.events = new Map();
    }

    /**
     * 监听事件
     * @param {string} event - 事件名称
     * @param {Function} handler - 处理函数
     * @returns {Function} 取消监听的函数
     */
    on(event, handler) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        this.events.get(event).push(handler);

        // 返回取消监听的函数
        return () => this.off(event, handler);
    }

    /**
     * 监听事件（只监听一次）
     * @param {string} event - 事件名称
     * @param {Function} handler - 处理函数
     */
    once(event, handler) {
        const onceHandler = (...args) => {
            handler(...args);
            this.off(event, onceHandler);
        };

        this.on(event, onceHandler);
    }

    /**
     * 取消监听事件
     * @param {string} event - 事件名称
     * @param {Function} handler - 处理函数
     */
    off(event, handler) {
        if (!this.events.has(event)) {
            return;
        }

        const handlers = this.events.get(event);
        const index = handlers.indexOf(handler);

        if (index > -1) {
            handlers.splice(index, 1);
        }

        // 如果没有监听器了，删除事件
        if (handlers.length === 0) {
            this.events.delete(event);
        }
    }

    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     */
    emit(event, data) {
        if (!this.events.has(event)) {
            return;
        }

        const handlers = this.events.get(event);

        // 异步执行，避免阻塞
        setTimeout(() => {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`❌ 事件处理错误 [${event}]:`, error);
                }
            });
        }, 0);
    }

    /**
     * 清除所有事件监听器
     */
    clear() {
        this.events.clear();
    }

    /**
     * 清除指定事件的所有监听器
     * @param {string} event - 事件名称
     */
    clearEvent(event) {
        this.events.delete(event);
    }

    /**
     * 获取指定事件的监听器数量
     * @param {string} event - 事件名称
     * @returns {number}
     */
    listenerCount(event) {
        if (!this.events.has(event)) {
            return 0;
        }
        return this.events.get(event).length;
    }

    /**
     * 获取所有事件名称
     * @returns {Array<string>}
     */
    eventNames() {
        return Array.from(this.events.keys());
    }
}

// 创建全局单例
export const eventBus = new EventBus();

// 导出便捷函数
export const on = (event, handler) => eventBus.on(event, handler);
export const once = (event, handler) => eventBus.once(event, handler);
export const off = (event, handler) => eventBus.off(event, handler);
export const emit = (event, data) => eventBus.emit(event, data);
export const clear = () => eventBus.clear();

// 事件名称常量（避免硬编码）
export const Events = {
    // 筛选相关
    FILTER_CHANGE: 'filter:change',
    FILTER_RESET: 'filter:reset',

    // Tab 相关
    TAB_CHANGE: 'tab:change',
    TAB_UPDATE_COUNT: 'tab:update-count',

    // 数据相关
    DATA_LOADED: 'data:loaded',
    DATA_LOADING: 'data:loading',
    DATA_ERROR: 'data:error',

    // 搜索相关
    SEARCH: 'search',
    SEARCH_CLEAR: 'search:clear',

    // UI 相关
    MODAL_OPEN: 'modal:open',
    MODAL_CLOSE: 'modal:close',
    TOAST_SHOW: 'toast:show',
    TOAST_HIDE: 'toast:hide',

    // 页面相关
    PAGE_READY: 'page:ready',
    PAGE_DESTROY: 'page:destroy'
};
