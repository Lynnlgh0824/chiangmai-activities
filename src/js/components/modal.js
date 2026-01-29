        function closeModal() {
            document.getElementById('activityModal').classList.remove('active');
        }

        // 点击遮罩关闭弹窗
        document.getElementById('activityModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });

        // ESC 键关闭弹窗
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal();
            }
        });

        // =====================================================
        // 初始化
        // =====================================================

        // 生成指定周的日期数据（支持偏移量）
        function generateWeekDates(offset = 0) {
            const today = new Date();
            const currentDay = today.getDay(); // 0=周日, 1=周一, ...

            // 计算到本周一的天数差
            const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;

            // 获取本周一的日期
            const monday = new Date(today);
            monday.setDate(today.getDate() - daysToMonday + (offset * 7));

            // 生成7天的日期
            const weekDates = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date(monday);
                date.setDate(monday.getDate() + i);

                weekDates.push({
                    day: i === 6 ? 0 : i + 1, // 0=周日, 1-6=周一到周六
                    date: date.getDate(),
                    month: date.getMonth() + 1,
                    year: date.getFullYear(),
                    dayName: i === 6 ? '周日' : ['周一', '周二', '周三', '周四', '周五', '周六'][i],
                    isToday: date.getDate() === today.getDate() &&
                              date.getMonth() === today.getMonth() &&
                              date.getFullYear() === today.getFullYear()
                });
            }

            return weekDates;
        }

        // 更新日期表头
        function updateDateHeaders(headerId = 'dateGridHeader') {
            weekDates = generateWeekDates(currentWeekOffset);
            const headerContainer = document.getElementById(headerId);

            if (!headerContainer) return;

            let html = '';
            weekDates.forEach(dateInfo => {
                const todayClass = dateInfo.isToday ? ' today-header' : '';

                html += `
                    <div class="date-cell-header ${todayClass}"
                         data-day="${dateInfo.day}"
                         onclick="toggleDayFilter(${dateInfo.day})"
                         title="点击筛选${dateInfo.dayName}">
                        <span class="date-number">${dateInfo.date}</span>
                        <span class="date-weekday">${dateInfo.dayName}</span>
                    </div>
                `;
            });

            headerContainer.innerHTML = html;
        }

        // 页面加载时获取数据
        document.addEventListener('DOMContentLoaded', async function() {
            // 检查应用版本（在所有初始化之前）
            await checkAppVersion();

            // 更新日期表头
            updateDateHeaders('dateGridHeader');
            updateDateHeaders('dateGridHeaderMarket');
            updateDateHeaders('dateGridHeaderMusic');

            // 获取活动数据
            fetchActivities();

            // 搜索输入框回车监听
            document.getElementById('searchInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
        });
