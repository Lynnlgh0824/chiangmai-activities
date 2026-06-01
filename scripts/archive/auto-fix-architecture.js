/**
 * 架构问题自动修复脚本
 * 修复检测到的架构违规问题
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

console.log('🔧 开始自动修复架构问题\n');

let fixedCount = 0;
let skippedCount = 0;

// ============================================
// 修复 1: 更新 index.html 标题
// ============================================
console.log('📝 修复 1: 更新 index.html 标题');
try {
    const indexPath = join(projectRoot, 'public/index.html');
    let content = readFileSync(indexPath, 'utf-8');

    // 替换标题中的中文
    const oldTitle = '<title>清迈指南 v1.0.7 - Chiang Mai Guide Platform</title>';
    const newTitle = '<title>Chiang Mai Guide v1.0.7</title>';

    if (content.includes(oldTitle)) {
        content = content.replace(oldTitle, newTitle);
        writeFileSync(indexPath, content, 'utf-8');
        console.log('✅ 已更新标题为英文');
        fixedCount++;
    } else {
        console.log('⏭️  标题已是英文，跳过');
        skippedCount++;
    }
} catch (error) {
    console.log(`❌ 修复失败: ${error.message}`);
}

// ============================================
// 修复 2: 创建数据层 API 包装
// ============================================
console.log('\n📝 修复 2: 创建数据层 API 包装');

const apiCode = `/**
 * API 数据层
 * 统一管理所有 API 请求
 */

export class API {
    /**
     * 获取活动列表
     */
    static async getActivities(limit = 1000) {
        try {
            const response = await fetch(\`http://localhost:3000/api/activities?limit=\${limit}\`);
            if (!response.ok) {
                throw new Error(\`HTTP \${response.status}\`);
            }
            const result = await response.json();
            return result.data || result;
        } catch (error) {
            console.error('获取活动失败:', error);
            throw error;
        }
    }

    /**
     * 获取攻略信息
     */
    static async getGuide() {
        try {
            const response = await fetch('/api/guide');
            if (!response.ok) {
                throw new Error(\`HTTP \${response.status}\`);
            }
            const result = await response.json();
            return result.data || result;
        } catch (error) {
            console.error('获取攻略失败:', error);
            throw error;
        }
    }

    /**
     * 搜索活动
     */
    static async searchActivities(keyword) {
        try {
            const response = await fetch(\`/api/activities/search?q=\${encodeURIComponent(keyword)}\`);
            if (!response.ok) {
                throw new Error(\`HTTP \${response.status}\`);
            }
            const result = await response.json();
            return result.data || result;
        } catch (error) {
            console.error('搜索失败:', error);
            throw error;
        }
    }
}
`;

try {
    const apiPath = join(projectRoot, 'src/js/data/api.js');
    writeFileSync(apiPath, apiCode, 'utf-8');
    console.log('✅ 已创建 src/js/data/api.js');
    fixedCount++;
} catch (error) {
    console.log(`❌ 创建失败: ${error.message}`);
}

// ============================================
// 修复 3: 创建日期工具类
// ============================================
console.log('\n📝 修复 3: 创建日期工具类');

const dateHelperCode = `/**
 * 日期工具类
 * 提供日期相关的业务逻辑
 */

export class DateHelper {
    /**
     * 获取今天是星期几
     * @returns {number} 0=周日, 1=周一, ..., 6=周六
     */
    static getTodayDayOfWeek() {
        return new Date().getDay();
    }

    /**
     * 获取星期几的名称
     * @param {number} dayIndex - 0-6
     * @returns {string} '周日' | '周一' | ...
     */
    static getDayName(dayIndex) {
        const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return names[dayIndex] || '未知';
    }

    /**
     * 获取本周一的日期
     * @returns {Date}
     */
    static getThisMonday() {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(today.setDate(diff));
    }

    /**
     * 获取本周所有日期
     * @returns {Array} [{ day, dayName, date }, ...]
     */
    static getThisWeekDays() {
        const monday = this.getThisMonday();
        const days = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);

            days.push({
                day: i === 6 ? 0 : i + 1,  // 0=周日, 1-6=周一到周六
                dayName: i === 6 ? '周日' : ['周一', '周二', '周三', '周四', '周五', '周六'][i],
                date: date.getDate(),
                month: date.getMonth() + 1,
                year: date.getFullYear()
            });
        }

        return days;
    }

    /**
     * 格式化时间
     * @param {string} time - "07:00-08:30"
     * @returns {Object} { start, end }
     */
    static parseTimeRange(time) {
        const [start, end] = time.split('-');
        return { start, end };
    }

    /**
     * 判断是否为今天
     * @param {number} dayOfWeek - 0-6
     * @returns {boolean}
     */
    static isToday(dayOfWeek) {
        return this.getTodayDayOfWeek() === dayOfWeek;
    }
}
`;

try {
    const dateHelperPath = join(projectRoot, 'src/js/utils/dateHelper.js');
    writeFileSync(dateHelperPath, dateHelperCode, 'utf-8');
    console.log('✅ 已创建 src/js/utils/dateHelper.js');
    fixedCount++;
} catch (error) {
    console.log(`❌ 创建失败: ${error.message}`);
}

// ============================================
// 修复 4: 更新 app.js 添加事件处理
// ============================================
console.log('\n📝 修复 4: 更新 app.js 添加事件处理');

try {
    const appPath = join(projectRoot, 'src/js/app.js');
    let appContent = readFileSync(appPath, 'utf-8');

    // 在 bindEvents 方法中添加事件处理
    const oldBindEvents = `    /**
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

        console.log('✅ 全局事件绑定完成');
    }`;

    const newBindEvents = `    /**
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
        // TODO: 实现筛选逻辑
        // 这里应该调用 Page 层的筛选方法
    }

    /**
     * 处理 Tab 切换
     */
    handleTabSwitch(tabId) {
        console.log('🔄 Tab 切换:', tabId);
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
    }`;

    if (appContent.includes(oldBindEvents)) {
        appContent = appContent.replace(oldBindEvents, newBindEvents);
        writeFileSync(appPath, appContent, 'utf-8');
        console.log('✅ 已更新 app.js 添加事件处理');
        fixedCount++;
    } else {
        console.log('⏭️  app.js 已有事件处理，跳过');
        skippedCount++;
    }
} catch (error) {
    console.log(`❌ 更新失败: ${error.message}`);
}

// ============================================
// 总结
// ============================================
console.log('\n' + '='.repeat(60));
console.log('🎉 自动修复完成!');
console.log('='.repeat(60));
console.log(`✅ 成功修复: ${fixedCount} 项`);
console.log(`⏭️  跳过: ${skippedCount} 项`);
console.log('\n📝 后续步骤:');
console.log('1. 运行 npm run dev 测试应用');
console.log('2. 检查浏览器控制台是否有错误');
console.log('3. 查看 docs/architecture-check-report.md 了解完整修复方案');
console.log('4. 继续完成 P1 和 P2 优先级的修复');
console.log('='.repeat(60));
