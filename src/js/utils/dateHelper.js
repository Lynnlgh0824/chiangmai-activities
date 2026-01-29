/**
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
