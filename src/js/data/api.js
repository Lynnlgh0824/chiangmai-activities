/**
 * API 数据层
 * 统一管理所有 API 请求
 */

export class API {
    /**
     * 获取活动列表
     */
    static async getActivities(limit = 1000) {
        try {
            const response = await fetch(`http://localhost:3000/api/activities?limit=${limit}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
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
                throw new Error(`HTTP ${response.status}`);
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
            const response = await fetch(`/api/activities/search?q=${encodeURIComponent(keyword)}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const result = await response.json();
            return result.data || result;
        } catch (error) {
            console.error('搜索失败:', error);
            throw error;
        }
    }
}
