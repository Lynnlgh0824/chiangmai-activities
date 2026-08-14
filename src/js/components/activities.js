        let allActivities = [];
        let currentFilters = {
            category: '全部',
            price: '全部',
            day: null, // 选中的日期（0=周日, 1=周一, ..., 6=周六）
            search: ''
        };

        // 获取今天的星期几（0=周日, 1=周一, ..., 6=周六）
        const todayDay = new Date().getDay();

        // 标志：防止页面初次加载时自动触发滚动选中
        let isPageFirstLoad = true;

        // 保存当前周的日期数据（全局，供其他函数使用）
        let weekDates = [];

        // 当前周的偏移量（0=本周, -1=上周, 1=下周）
        let currentWeekOffset = 0;

        const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

        // 兴趣班Tab包含的分类（白名单）
        const interestCategories = ['瑜伽', '冥想', '舞蹈', '泰拳', '音乐', '文化艺术', '健身'];

        const categoryColors = {
            '瑜伽': '#FF6B6B',
            '冥想': '#4ECDC4',
            '户外探险': '#FFE66D',
            '文化艺术': '#95E1D3',
            '美食体验': '#F38181',
            '节庆活动': '#AA96DA',
            '其他': '#667eea'
        };

        // 预设的活动颜色组（活泼明亮的颜色）
        const activityColorPalette = [
            '#FF6B6B', // 鲜红
            '#4ECDC4', // 青色
            '#45B7D1', // 天蓝
            '#FFA07A', // 橙粉
            '#98D8C8', // 薄荷绿
            '#F7DC6F', // 明黄
            '#BB8FCE', // 淡紫
            '#85C1E9', // 浅蓝
            '#F1948A', // 珊瑚红
            '#82E0AA', // 绿色
            '#E59866', // 橙色
            '#D7BDE2', // 淡紫兰
            '#A3E4D7', // 蓝绿
            '#FAD7A0', // 杏黄
            '#F5B7B1', // 粉红
            '#AED6F1', // 淡天蓝
            '#ABEBC6', // 草绿
            '#F9E79F', // 淡黄
            '#D2B4DE', // 兰紫
            '#E8DAEF', // 浅紫
            '#73C6B6', // 青绿
            '#F0B27A', // 金橙
            '#C39BD3', // 紫罗兰
            '#7FB3D5', // 中蓝
            '#76D7C4', // 青色
            '#FADBD8', // 浅粉
            '#D5F5E3', // 淡绿
            '#FCF3CF', // 浅黄
            '#EBDEF0', // 淡紫
            '#D6EAF8', // 浅蓝
            '#D1F2EB', // 淡青
            '#FF9FF3', // 亮粉
            '#54A0FF', // 亮蓝
            '#5FFF67', // 亮绿
            '#FFD93D', // 金黄
            '#6BCB77', // 鲜绿
            '#4D96FF', // 鲜蓝
            '#FF6B9D', // 玫红
            '#C44DFF', // 亮紫
            '#FFB84D', // 活力橙
            '#00D9FF', // 青蓝
            '#FF5E78'  // 活力红
        ];

        // 根据活动ID获取颜色（使用预设色板）
        const activityColorsCache = {};
        function getActivityColor(id) {
            if (activityColorsCache[id]) {
                return activityColorsCache[id];
            }

            // 使用ID生成索引，确保同一活动总是获得相同颜色
            const hash = id.toString().split('').reduce((acc, char) => {
                return acc + char.charCodeAt(0);
            }, 0);

            const colorIndex = hash % activityColorPalette.length;
            const color = activityColorPalette[colorIndex];

            activityColorsCache[id] = color;
            return color;
        }

        // 从 API 获取活动数据（带缓存和性能监控）
        async function fetchActivities() {
            try {
                // 使用性能监控
                PerfMonitor.start('fetchActivities');

                // 使用APICache的fetch方法（自动缓存）
                const result = await APICache.fetch('/api/activities?limit=1000');

                PerfMonitor.end('fetchActivities');

                if (result.success && result.data) {
                    // 处理活动数据：为每个星期创建单独的活动副本
                    // 同时过滤掉暂停和草稿状态的活动
                allActivities = [];
                result.data.forEach(item => {
                    // 过滤掉非"进行中"状态的活动
                    if (item.status !== '进行中') {
                        console.log('🚫 过滤活动:', item.title, '状态:', item.status);
                        return; // 跳过suspended和draft状态的活动
                    }
                    const days = parseDaysFromWeekdays(item.weekdays);

                    // 如果有多个星期，为每个星期创建一个副本
                    if (days && days.length > 0) {
                        days.forEach(day => {
                          allActivities.push({
                            id: item.id || item._id,
                            originalId: item.id || item._id, // 保存原始ID用于详情查看
                            name: item.title,
                            title: item.title,
                            category: item.category,
                            price: item.price,
                            location: item.location,
                            time: item.time,
                            description: item.description,
                            day: day,
                            frequency: item.frequency || 'weekly',
                            source: item.source || null, // 保存完整的source对象
                            flexibleTime: item.flexibleTime || '否'
                          });
                        });
                      } else {
                        // 没有星期信息或临时活动，保持原样
                        allActivities.push({
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
                          source: item.source || null, // 保存完整的source对象
                          flexibleTime: item.flexibleTime || '否'
                        });
                      }
                });

                console.log('📦 活动数据处理完成:');
                console.log('  - API返回:', result.data.length, '个活动');
                console.log('  - 创建副本:', allActivities.length, '个活动记录');
                console.log('  - 按日期分布:');
                for (let i = 0; i < 7; i++) {
                  const count = allActivities.filter(a => a.day === i).length;
                  const dayName = i === 0 ? '周日' : ['周一', '周二', '周三', '周四', '周五', '周六'][i-1];
                  console.log(`    ${dayName}: ${count} 个活动`);
                }

                // 更新Tab数量
                updateTabCounts();

                    // 初始化分类筛选器
                    initCategoryFilters();

                    // 默认选中Tab 0（兴趣班）
                    currentTab = 0;

                    // 刷新 = 重置为"全部"状态，显示当前Tab的活动
                    // 不默认选中任何日期，让用户看到完整的周视图
                    currentFilters.day = null;
                    currentFilters.category = '全部';
                    currentFilters.price = '全部';
                    currentFilters.search = '';

                    console.log('📍 默认选中Tab 0（兴趣班）');

                    // 渲染视图（会根据currentTab自动筛选）
                    updateViews();

                    // ✅ 页面初次加载完成后，启用滚动自动选中
                    // 延迟一段时间，确保视图完全渲染
                    setTimeout(() => {
                        isPageFirstLoad = false;
                        console.log('✅ 页面加载完成，滚动自动选中已启用');
                    }, 1000);

                    console.log('✅ 已加载', allActivities.length, '个活动');
                    console.log('📅 今天是:', dayNames[todayDay]);
                }
            } catch (error) {
                console.error('❌ 加载失败:', error);
                document.getElementById('calendarGrid').innerHTML =
                    '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#999;">加载失败，请刷新页面重试</div>';
            }
        }

        // 解析 weekdays 数组获取所有 day 数字
        function parseDaysFromWeekdays(weekdays) {
            if (!weekdays || !Array.isArray(weekdays)) return [];

            const dayMap = { '周日': 0, '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6 };
            const days = [];

            // 返回所有匹配的 day
            for (let day of weekdays) {
                if (dayMap[day] !== undefined) {
                  days.push(dayMap[day]);
                }
            }
            return days;
        }

        // 解析 weekdays 数组获取 day 数字（保留原函数用于详情显示）
        function parseDayFromWeekdays(weekdays) {
            const days = parseDaysFromWeekdays(weekdays);
            return days && days.length > 0 ? days[0] : null;
        }

        // =====================================================
        // 时间排序工具函数
        // =====================================================

        /**
         * 提取时间的开始部分
         * @param {string} timeStr - 时间字符串，如 "16:00-19:00"
         * @returns {object} - { hour, minute, original }
         */
        function extractStartTime(timeStr) {
            if (!timeStr || timeStr === '灵活时间') {
                return { hour: 99, minute: 99, original: timeStr || '灵活时间' };
            }

            // 提取第一个时间 HH:MM
            const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
            if (match) {
                return {
                    hour: parseInt(match[1], 10),
                    minute: parseInt(match[2], 10),
                    original: timeStr
                };
            }

            return { hour: 99, minute: 99, original: timeStr };
        }

        /**
         * 提取时间的结束部分
         * @param {string} timeStr - 时间字符串，如 "16:00-19:00"
         * @returns {object} - { hour, minute, isOvernight }
         */
        function extractEndTime(timeStr) {
            if (!timeStr || timeStr === '灵活时间') {
                return { hour: 99, minute: 99, isOvernight: false, original: timeStr || '灵活时间' };
            }

            // 查找结束时间部分（第二个时间）
            const parts = timeStr.split('-');
            if (parts.length >= 2) {
                const endTimeStr = parts[1].trim();
                const match = endTimeStr.match(/^(\d{1,2}):(\d{2})/);
                if (match) {
                    let hour = parseInt(match[1], 10);
                    let minute = parseInt(match[2], 10);
                    let isOvernight = false;

                    // 特殊处理：00:00 表示当天的24:00（最晚）
                    if (hour === 0 && minute === 0) {
                        hour = 24;
                        minute = 0;
                        isOvernight = true;
                    }

                    return { hour, minute, isOvernight, original: endTimeStr };
                }
            }

            // 如果没有结束时间（单一时间点），返回开始时间
            const start = extractStartTime(timeStr);
            return { hour: start.hour, minute: start.minute, isOvernight: false, original: timeStr };
        }

        /**
         * 比较两个时间字符串
         * @param {string} timeA - 时间A
         * @param {string} timeB - 时间B
         * @returns {number} - -1 (A在前), 0 (相同), 1 (B在前)
         */
        function compareTimes(timeA, timeB) {
            const extractedA = extractStartTime(timeA);
            const extractedB = extractStartTime(timeB);

            // 优先级1: 按开始时间的数字值比较
            if (extractedA.hour !== extractedB.hour) {
                return extractedA.hour - extractedB.hour;
            }

            if (extractedA.minute !== extractedB.minute) {
                return extractedA.minute - extractedB.minute;
            }

            // 开始时间相同，继续比较
            // 优先级2: 单一时间点排在时间段前面
            const isRangeA = extractedA.original.includes('-');
            const isRangeB = extractedB.original.includes('-');

            if (isRangeA && !isRangeB) return 1;   // A是范围，B是点 → B在前
            if (!isRangeA && isRangeB) return -1;  // A是点，B是范围 → A在前

            // 优先级3: 如果都是时间段（或都是单一时间点），按结束时间排序
            if (isRangeA && isRangeB) {
                const endA = extractEndTime(extractedA.original);
                const endB = extractEndTime(extractedB.original);

                // 按结束时间排序（早结束的在前）
                if (endA.hour !== endB.hour) {
                    return endA.hour - endB.hour;
                }

                if (endA.minute !== endB.minute) {
                    return endA.minute - endB.minute;
                }

                // 结束时间也相同，保持原顺序
                return 0;
            }

            // 都是单一时间点，保持原顺序
            return 0;
        }

        // 更新Tab数量显示（仅用于控制台调试）
        function updateTabCounts() {
            // 兴趣班：瑜伽、冥想、舞蹈、泰拳、文化艺术、健身（排除音乐）
            const interestCategories = ['瑜伽', '冥想', '舞蹈', '泰拳', '文化艺术', '健身'];
            const interestActivities = allActivities.filter(a =>
                interestCategories.includes(a.category)
            );

            // 市集
            const marketActivities = allActivities.filter(a =>
                a.category === '市集'
            );

            // 音乐
            const musicActivities = allActivities.filter(a =>
                a.category === '音乐'
            );

            // 灵活时间活动
            const flexibleActivities = allActivities.filter(a =>
                a.flexibleTime === '是' || a.time === '灵活时间'
            );

            // 活动网站：有source字段且包含url的活动
            const websiteActivities = allActivities.filter(a =>
                a.source && a.source.url && a.source.url.length > 0
            );

            console.log('📊 Tab数量统计（控制台）:');
            console.log('  - 兴趣班:', interestActivities.length);
            console.log('  - 市集:', marketActivities.length);
            console.log('  - 音乐:', musicActivities.length);
            console.log('  - 灵活时间活动:', flexibleActivities.length);
            console.log('  - 活动网站:', websiteActivities.length);
            console.log('  - 攻略信息: 1 (页面)');
        }

        // 初始化分类筛选器