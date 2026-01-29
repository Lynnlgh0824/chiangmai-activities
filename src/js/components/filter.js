        function initCategoryFilters() {
            // 防御性检查：确保allActivities已加载
            if (!allActivities || allActivities.length === 0) {
                console.warn("⚠️ allActivities为空，100ms后重试初始化分类筛选器");
                setTimeout(initCategoryFilters, 100);
                return;
            }

            const categories = [...new Set(allActivities.map(a => a.category))].filter(cat => cat !== '市集' && cat !== '音乐');
            const container = document.getElementById('categoryChips');

            let html = '<div class="filter-chip active" onclick="setFilter(\'category\', \'全部\')">全部</div>';
            categories.forEach(cat => {
                html += `<div class="filter-chip" onclick="setFilter('category', '${cat}')">${cat}</div>`;
            });

            container.innerHTML = html;
            console.log("✅ 分类筛选器已初始化，共", categories.length, "个分类:", categories.join(', '));
        }

        // =====================================================
        // H5分组显示功能
        // =====================================================

        /**
         * Tab与分类的映射配置（用户提供的准确分类）
         */
        const TAB_CATEGORIES = {
            0: { // 兴趣班Tab
                name: '兴趣班',
                categories: ['运动', '健身', '冥想', '泰拳', '徒步', '文化艺术', '舞蹈', '瑜伽'],
                hasCategoryFilter: true
            },
            1: { // 市集Tab
                name: '市集',
                categories: [],
                hasCategoryFilter: false
            },
            2: { // 音乐Tab
                name: '音乐',
                categories: [],
                hasCategoryFilter: false
            },
            3: { // 灵活时间Tab
                name: '灵活时间',
                categories: [],
                hasCategoryFilter: false
            },
            4: { // 活动网站Tab
                name: '活动网站',
                categories: [],
                hasCategoryFilter: false
            }
        };

        /**
         * 获取当前Tab的分类列表
         */
        function getCategoriesForTab(tabId) {
            const tabConfig = TAB_CATEGORIES[tabId];
            if (!tabConfig) {
                console.warn('⚠️ 未找到Tab配置:', tabId);
                return { categories: [], hasFilter: false };
            }

            console.log(`📋 获取Tab ${tabId}(${tabConfig.name})的分类`);

            return {
                categories: tabConfig.categories,
                hasFilter: tabConfig.hasCategoryFilter
            };
        }

        /**
         * 按日期分组渲染活动列表（H5专用）
         */
        function renderGroupedActivitiesForH5(activities, selectedDay = null) {
            console.log('📱 H5分组渲染开始，选中日期:', selectedDay);

            const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

            // 1. 按日期分组（过滤无效的 day 值）
            const groupedByDay = {};
            activities.forEach(act => {
                // 验证 day 是否有效（0-6 的数字）
                const day = Number(act.day);
                if (typeof day === 'number' && !isNaN(day) && day >= 0 && day <= 6) {
                    if (!groupedByDay[day]) {
                        groupedByDay[day] = [];
                    }
                    groupedByDay[day].push(act);
                } else {
                    console.warn('⚠️ 跳过无效日期的活动:', act);
                }
            });

            console.log('📊 分组结果:', Object.keys(groupedByDay).map(day =>
                `${dayNames[day]}: ${groupedByDay[day].length}个`
            ).join(', '));

            // 2. 如果有选中日期，将其移到最前面
            let dayKeys = Object.keys(groupedByDay).map(Number).filter(day => !isNaN(day)).sort((a, b) => a - b);
            if (selectedDay !== null && groupedByDay[selectedDay]) {
                dayKeys = dayKeys.filter(k => k !== selectedDay);
                dayKeys.unshift(selectedDay);
                console.log('⭐ 选中的日期移到最前:', dayNames[selectedDay]);
            }

            // 3. 渲染HTML
            let html = '';
            dayKeys.forEach((day, index) => {
                const dayActivities = groupedByDay[day];
                const isSelected = day === selectedDay;
                const groupClass = isSelected ? 'day-group day-group-selected' : 'day-group';

                // 安全检查：确保 dayActivities 存在且是数组
                if (!dayActivities || !Array.isArray(dayActivities)) {
                    console.warn('⚠️ 警告: 日期活动数据异常', { day, dayActivities });
                    return; // 跳过这个日期
                }

                html += `
                    <div class="${groupClass}" data-day="${day}">
                        ${selectedDay === null ? `
                        <div class="day-group-header">
                            <div class="day-group-title">
                                <span class="day-icon">${getDayIcon(day)}</span>
                                <span class="day-name">${dayNames[day]}</span>
                                ${isSelected ? '<span class="selected-badge">当前</span>' : ''}
                            </div>
                            <span class="day-count">${dayActivities.length}个活动</span>
                        </div>
                        ` : ''}
                        <div class="day-group-activities">
                            ${dayActivities.map(act => createScheduleItemHTML(act, isSelected)).join('')}
                        </div>
                    </div>
                `;
            });

            return html;
        }

        /**
         * 获取日期图标
         */
        function getDayIcon(day) {
            const icons = ['🌞', '📅', '📅', '📅', '📅', '📅', '🎉'];
            return icons[day];
        }

        /**
         * 创建活动卡片HTML（带高亮支持）
         */
        function createScheduleItemHTML(act, isHighlighted = false) {
            const highlightClass = isHighlighted ? 'activity-highlight' : '';
            const highlightStar = isHighlighted ? '⭐ ' : '';

            return `
                <div class="schedule-item ${highlightClass}" data-activity-id="${act.id}">
                    <div class="schedule-item-header">
                        <div class="schedule-item-title">${highlightStar}${cleanTitle(act.title)}</div>
                    </div>
                    <div class="schedule-item-meta">
                        <span class="meta-time">⏰ ${act.time || '灵活时间'}</span>
                        <span class="meta-location">📍 ${act.location}</span>
                    </div>
                    <div class="schedule-item-price">${act.price}</div>
                </div>
            `;
        }

        /**
         * 更新筛选弹窗中的分类选项（基于当前Tab）
         */
        function updateFilterSheetCategories(tabId) {
            console.log('🔄 更新筛选弹窗分类，Tab:', tabId);

            const { categories, hasFilter } = getCategoriesForTab(tabId);
            const categorySection = document.querySelector('.filter-group-section');
            const container = document.getElementById('categoryOptions');

            // 如果该Tab没有分类筛选，隐藏分类section
            if (!hasFilter || categories.length === 0) {
                if (categorySection) {
                    categorySection.style.display = 'none';
                }
                console.log('  该Tab没有分类筛选，已隐藏');
                return;
            }

            // 显示分类section并更新内容
            if (categorySection) {
                categorySection.style.display = 'block';
            }

            if (!container) {
                console.error('❌ 找不到categoryOptions容器');
                return;
            }

            console.log('  分类列表:', categories);

            // 生成HTML
            let html = '';
            categories.forEach((cat, index) => {
                const isSelected = index === 0;
                const selectedClass = isSelected ? 'selected' : '';
                const value = cat === '全部' ? 'all' : cat;

                html += `
                    <div class="filter-option-item ${selectedClass}"
                         data-value="${value}"
                         onclick="selectFilterOption(this, 'category')">
                        ${cat}
                    </div>
                `;
            });

            container.innerHTML = html;
            console.log('✅ 筛选弹窗分类已更新');
        }

        // =====================================================
        // 筛选功能
        // =====================================================

        function filterActivities() {
            let filtered = allActivities;

            console.log('🔍 开始筛选, 当前筛选条件:', currentFilters);
            console.log('📊 总活动数:', allActivities.length);

            // 过滤掉暂停的活动
            const beforeSuspendFilter = filtered.length;
            filtered = filtered.filter(a => a.status !== 'suspended');
            console.log(`⏸️ 暂停活动过滤: ${beforeSuspendFilter} → ${filtered.length} (排除 ${beforeSuspendFilter - filtered.length} 个)`);

            // 根据当前Tab筛选数据
            switch(currentTab) {
                case 0: // 兴趣班 - 排除法：排除市集、音乐和灵活时间活动
                    filtered = filtered.filter(a => {
                        // 排除市集
                        if (a.category === '市集') return false;
                        // 排除音乐
                        if (a.category === '音乐') return false;
                        // 排除灵活时间活动
                        if (a.flexibleTime === '是' || a.time === '灵活时间') return false;
                        return true;
                    });
                    console.log('📅 Tab筛选 - 兴趣班 (固定时间，排除市集、音乐):', filtered.length);
                    break;

                case 1: // 市集
                    filtered = filtered.filter(a => a.category === '市集');
                    console.log('📋 Tab筛选 - 市集:', filtered.length);
                    break;

                case 2: // 音乐
                    filtered = filtered.filter(a => a.category === '音乐');
                    console.log('🎵 Tab筛选 - 音乐:', filtered.length);
                    break;

                case 3: // 灵活时间活动
                    filtered = filtered.filter(a => a.flexibleTime === '是' || a.time === '灵活时间');
                    console.log('⏰ Tab筛选 - 灵活时间活动:', filtered.length);
                    break;

                case 4: // 活动网站
                    console.log('🏪 Tab 4 筛选开始，总数:', filtered.length);
                    const beforeFilter = filtered.length;
                    filtered = filtered.filter(a => {
                        const hasSource = a.source && a.source.url && a.source.url.length > 0;
                        if (!hasSource && a.source) {
                            console.log('  ⚠️', a.title, '有 source 但无 url:', a.source);
                        }
                        return hasSource;
                    });
                    console.log('🏪 Tab筛选 - 活动网站:', beforeFilter, '→', filtered.length);
                    if (filtered.length > 0) {
                        console.log('  前3个活动:', filtered.slice(0, 3).map(a => a.title));
                    }
                    break;

                case 5: // 攻略信息 - 不需要筛选
                    console.log('📖 Tab筛选 - 攻略信息: 无需筛选');
                    return [];
            }

            // 日期筛选
            if (currentFilters.day !== null) {
                const beforeDayFilter = filtered.length;
                filtered = filtered.filter(act => act.day === currentFilters.day);
                console.log(`📅 日期筛选 (day=${currentFilters.day}): ${beforeDayFilter} → ${filtered.length}`);
            }

            // 分类筛选
            if (currentFilters.category !== '全部') {
                const beforeCategoryFilter = filtered.length;
                filtered = filtered.filter(act => act.category === currentFilters.category);
                console.log(`🏷️ 分类筛选 (${currentFilters.category}): ${beforeCategoryFilter} → ${filtered.length}`);
            }

            // 价格筛选
            // 辅助函数：提取价格数值
            const extractPrice = (priceStr) => {
                if (priceStr === '免费' || priceStr.includes('免费')) return 0;
                return parseInt(priceStr.replace(/[^\d]/g, '')) || 0;
            };

            if (currentFilters.price === '免费') {
                filtered = filtered.filter(act => act.price === '免费' || act.price.includes('免费'));
            } else if (currentFilters.price === '<500฿') {
                filtered = filtered.filter(act => extractPrice(act.price) < 500);
            } else if (currentFilters.price === '<1000฿') {
                filtered = filtered.filter(act => extractPrice(act.price) < 1000);
            } else if (currentFilters.price === '<1500฿') {
                filtered = filtered.filter(act => extractPrice(act.price) < 1500);
            } else if (currentFilters.price === '>1500฿') {
                filtered = filtered.filter(act => extractPrice(act.price) >= 1500);
            }

            // 搜索筛选
            if (currentFilters.search) {
                const searchLower = currentFilters.search.toLowerCase();
                filtered = filtered.filter(act =>
                    act.title.toLowerCase().includes(searchLower) ||
                    act.location.toLowerCase().includes(searchLower) ||
                    act.description.toLowerCase().includes(searchLower)
                );
            }

            return filtered;
        }

        function setFilter(type, value) {
            if (type === 'category') {
                currentFilters.category = value;
                // 更新 UI
                document.querySelectorAll('#categoryChips .filter-chip').forEach(chip => {
                    chip.classList.remove('active');
                    if (chip.textContent.trim() === value) chip.classList.add('active');
                });
            } else if (type === 'price') {
                currentFilters.price = value;
                // 更新 UI
                const priceGroup = document.querySelectorAll('.filter-group')[1];
                priceGroup.querySelectorAll('.filter-chip').forEach(chip => {
                    chip.classList.remove('active');
                    if (chip.textContent.trim() === value) chip.classList.add('active');
                });
            }

            updateViews();
        }

        // ========== H5周视图滚动自动选中功能 ==========

        // 存储Intersection Observer实例，用于清理
        let h5ScrollObserver = null;
        let h5AutoSelectTimeout = null;
        let lastSelectedDay = null;

        // 存储滚动监听器，用于清理
        let h5ScrollListener = null;
        let h5ScrollHighlightTimeout = null;

        /**
         * 初始化H5周视图的滚动自动选中功能
         * @param {string} gridId - 网格容器ID
         */
        function initH5ScrollAutoSelect(gridId) {
            // ✅ 防止页面加载或 Tab 切换时自动选中
            if (isPageFirstLoad) {
                console.log('⏸️ 页面加载中或 Tab 切换中，跳过滚动检测初始化');
                return;
            }

            // 清理旧的observer
            if (h5ScrollObserver) {
                h5ScrollObserver.disconnect();
                h5ScrollObserver = null;
            }

            // 获取所有天数卡片
            const dayCells = document.querySelectorAll(`#${gridId} .day-cell`);
            if (dayCells.length === 0) {
                console.log('ℹ️ 未找到天数卡片，跳过滚动检测初始化');
                return;
            }

            console.log('📱 初始化H5周视图滚动自动选中功能');

            // 创建Intersection Observer
            h5ScrollObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    // 当卡片占据屏幕50%以上时
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                        const day = parseInt(entry.target.getAttribute('data-day'));

                        // ✅ 再次检查 isPageFirstLoad，防止竞态条件
                        if (isPageFirstLoad) {
                            console.log('⏸️ 仍在加载中，跳过自动选中');
                            return;
                        }

                        // 避免重复选中同一天
                        if (day !== lastSelectedDay && day !== null && !isNaN(day)) {
                            // 防抖动：滚动停止500ms后才触发
                            if (h5AutoSelectTimeout) {
                                clearTimeout(h5AutoSelectTimeout);
                            }

                            h5AutoSelectTimeout = setTimeout(() => {
                                autoSelectDayInView(day);
                            }, 500);
                        }
                    }
                });
            }, {
                // 当卡片占据50%时触发
                threshold: [0.5],
                // 设置根元素为视口
                rootMargin: '0px'
            });

            // 观察所有天数卡片
            dayCells.forEach(cell => {
                h5ScrollObserver.observe(cell);
            });

            console.log(`✅ 已为 ${dayCells.length} 个天数卡片添加滚动检测`);
        }

        /**
         * 自动选中视野中的某一天
         * @param {number} day - 天数（0-6，0=周日）
         */
        function autoSelectDayInView(day) {
            // 避免重复选中
            if (currentFilters.day === day) {
                return;
            }

            // ✅ 防止页面初次加载时自动选中
            // 用户反馈：移动端进入时默认就筛选了周一，不应该自动选中
            if (isPageFirstLoad) {
                console.log(`⏸️ 页面初次加载，跳过自动选中: ${day} (${dayNames[day]})`);
                return;
            }

            console.log(`🎯 自动选中: ${day} (${dayNames[day]})`);

            // 更新筛选状态
            currentFilters.day = day;
            lastSelectedDay = day;

            // ❌ 删除自动选中提示（用户不需要看到这个提示）
            // showAutoSelectToast(day);

            // 更新视图（会切换到单日详细视图）
            updateViews();

            // 重新初始化滚动检测（单日视图不需要）
            if (h5ScrollObserver) {
                h5ScrollObserver.disconnect();
                h5ScrollObserver = null;
            }
        }

        /**
         * 显示自动选中提示
         * @param {number} day - 选中的天数
         */
        function showAutoSelectToast(day) {
            // 移除旧的提示
            const oldToast = document.querySelector('.h5-auto-select-toast');
            if (oldToast) {
                oldToast.remove();
            }

            // 创建新的提示
            const toast = document.createElement('div');
            toast.className = 'h5-auto-select-toast';
            toast.innerHTML = `✨ 已自动选中 ${dayNames[day]}`;

            // 添加样式
            Object.assign(toast.style, {
                position: 'fixed',
                top: '60px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(102, 126, 234, 0.95)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: '9999',
                opacity: '0',
                transition: 'opacity 0.3s ease, transform 0.3s ease',
                pointerEvents: 'none'
            });

            document.body.appendChild(toast);

            // 触发淡入动画
            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateX(-50%) translateY(0)';
            });

            // 2秒后淡出并移除
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) translateY(-10px)';

                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 2000);

            console.log(`💡 显示提示: 已自动选中 ${dayNames[day]}`);
        }

        /**
         * 清理H5滚动检测
         */
        function cleanupH5ScrollObserver() {
            if (h5ScrollObserver) {
                h5ScrollObserver.disconnect();
                h5ScrollObserver = null;
                console.log('🧹 已清理H5滚动检测');
            }

            if (h5AutoSelectTimeout) {
                clearTimeout(h5AutoSelectTimeout);
                h5AutoSelectTimeout = null;
            }

            // 清理滚动监听器
            if (h5ScrollListener) {
                const gridElement = document.getElementById('calendarGrid');
                if (gridElement) {
                    gridElement.removeEventListener('scroll', h5ScrollListener);
                }
                h5ScrollListener = null;
                console.log('🧹 已清理滚动监听器');
            }

            if (h5ScrollHighlightTimeout) {
                clearTimeout(h5ScrollHighlightTimeout);
                h5ScrollHighlightTimeout = null;
            }

            // 移除提示
            const toast = document.querySelector('.h5-auto-select-toast');
            if (toast) {
                toast.remove();
            }
        }

        /**
         * 初始化H5周视图滚动日期高亮功能
         * 根据可视区域内的活动自动高亮对应的日期按钮
         * @param {string} gridId - 网格容器ID
         */
        function initH5ScrollDateHighlight(gridId) {
            // 清理旧的监听器
            if (h5ScrollListener) {
                const gridElement = document.getElementById(gridId);
                if (gridElement) {
                    gridElement.removeEventListener('scroll', h5ScrollListener);
                }
                h5ScrollListener = null;
            }

            // 获取网格容器
            const gridElement = document.getElementById(gridId);
            if (!gridElement) {
                console.log('ℹ️ 未找到网格容器，跳过滚动日期高亮初始化');
                return;
            }

            // 获取所有天数卡片
            const dayCells = document.querySelectorAll(`#${gridId} .day-cell`);
            if (dayCells.length === 0) {
                console.log('ℹ️ 未找到天数卡片，跳过滚动日期高亮初始化');
                return;
            }

            console.log('📱 初始化H5周视图滚动日期高亮功能');

            // 创建滚动监听函数
            h5ScrollListener = () => {
                // 防抖动：滚动停止100ms后才触发
                if (h5ScrollHighlightTimeout) {
                    clearTimeout(h5ScrollHighlightTimeout);
                }

                h5ScrollHighlightTimeout = setTimeout(() => {
                    highlightDateInView(gridId, dayCells);
                }, 100);
            };

            // 添加滚动监听
            gridElement.addEventListener('scroll', h5ScrollListener, { passive: true });

            console.log(`✅ 已为 ${dayCells.length} 个天数卡片添加滚动日期高亮`);
        }

        /**
         * 高亮视野中的日期按钮
         * @param {string} gridId - 网格容器ID
         * @param {NodeList} dayCells - 所有天数卡片元素
         */
        function highlightDateInView(gridId, dayCells) {
            let activeDay = null;
            let maxIntersectionRatio = 0;

            // 遍历所有天数卡片，找出在可视区域内占比最大的
            dayCells.forEach(cell => {
                const rect = cell.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const windowWidth = window.innerWidth;

                // 计算卡片在可视区域内的占比
                const visibleTop = Math.max(0, rect.top);
                const visibleBottom = Math.min(windowHeight, rect.bottom);
                const visibleHeight = Math.max(0, visibleBottom - visibleTop);

                // 计算可视占比
                const intersectionRatio = rect.height > 0 ? visibleHeight / rect.height : 0;

                // 当卡片占据屏幕30%以上时，才考虑为候选
                if (intersectionRatio >= 0.3 && intersectionRatio > maxIntersectionRatio) {
                    maxIntersectionRatio = intersectionRatio;
                    activeDay = parseInt(cell.getAttribute('data-day'));
                }
            });

            // 如果找到了有效的活跃日期，更新高亮状态
            if (activeDay !== null && !isNaN(activeDay)) {
                updateDateHighlight(activeDay, gridId);
            }
        }

        /**
         * 更新日期高亮状态
         * @param {number} day - 天数（0-6，0=周日）
         * @param {string} gridId - 网格容器ID
         */
        function updateDateHighlight(day, gridId) {
            // 更新活动卡片高亮状态
            const activityCards = document.querySelectorAll(`#${gridId} .activity-card`);
            activityCards.forEach(card => {
                const cardDay = parseInt(card.getAttribute('data-day'));
                if (cardDay === day) {
                    card.style.borderColor = '#667eea';
                    card.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                } else {
                    card.style.borderColor = '';
                    card.style.boxShadow = '';
                }
            });

            console.log(`🎯 高亮日期: ${day} (${dayNames[day]})`);
        }

        /**
         * 防抖动的布局更新函数
         * 用于在筛选后强制浏览器重新计算布局，防止布局抖动
         */
        function createDebouncedLayoutUpdate() {
            let timeoutId = null;
            return function() {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                timeoutId = setTimeout(() => {
                    // 强制浏览器重新计算布局
                    document.body.offsetHeight;

                    // 检查并修复可能的布局问题
                    const fixedElements = document.querySelectorAll('[style*="position: fixed"]');
                    fixedElements.forEach(el => {
                        const rect = el.getBoundingClientRect();
                        if (rect.width === 0 || rect.height === 0) {
                            console.warn('⚠️ Fixed element has zero size:', el);
                        }
                    });

                    console.log('✅ 布局重新计算完成');
                }, 100);
            };
        }

        // 创建防抖动布局更新实例
        const debouncedLayoutUpdate = createDebouncedLayoutUpdate();

        function toggleDayFilter(day) {
            console.log('🗓️ 点击日期筛选:', day, `(${dayNames[day]})`);
            console.log('📍 当前筛选状态:', currentFilters);

            // 清理自动滚动检测（避免冲突）
            cleanupH5ScrollObserver();

            if (currentFilters.day === day) {
                // 再次点击取消筛选，显示所有活动
                console.log('✋ 取消日期筛选');
                currentFilters.day = null;
                lastSelectedDay = null;

                // H5端：重新启用滚动自动选中
                if (window.innerWidth <= 768) {
                    console.log('🔄 重新启用H5滚动自动选中');
                    const gridId = currentTab === 1 ? 'dateGridMarket' : 'dateGrid';
                    // ✅ 延迟 1000ms，确保足够的保护时间
                    setTimeout(() => {
                        initH5ScrollAutoSelect(gridId);
                    }, 1000);
                }
            } else {
                // 点击其他日期，选中该日期
                console.log('✅ 设置日期筛选:', day);
                currentFilters.day = day;
                lastSelectedDay = day;

                // 🆕 H5端：自动滚动到该日期组
                if (window.innerWidth <= 768) {
                    setTimeout(() => {
                        const dayGroup = document.querySelector(`.day-group[data-day="${day}"]`);
                        if (dayGroup) {
                            // 平滑滚动到目标
                            dayGroup.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });

                            // 添加脉冲动画
                            dayGroup.style.animation = 'pulseHighlight 0.6s ease';
                            setTimeout(() => {
                                dayGroup.style.animation = '';
                            }, 600);

                            console.log('✅ 已滚动并高亮日期组:', dayNames[day]);
                        }
                    }, 100);
                }
            }

            console.log('🆕 新的筛选状态:', currentFilters);
            updateViews();

            // ✅ 立即更新日期高亮状态（修复核心问题）
            updateDateHighlight();

            // 移动端：将选中的日期滚动到视图中心
            if (window.innerWidth <= 768) {
                const selectedHeader = document.querySelector(`.date-cell-header[data-day="${day}"]`);
                if (selectedHeader) {
                    selectedHeader.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'center'
                    });
                }
            }

            // 移动端触觉反馈
            if (window.innerWidth <= 768 && navigator.vibrate) {
                navigator.vibrate(10);
            }
        }

        function performSearch() {
            const searchTerm = document.getElementById('searchInput').value.trim();
            currentFilters.search = searchTerm;
            updateViews();

            // 移动端搜索反馈
            if (window.innerWidth <= 768 && searchTerm) {
                // 可以添加振动反馈
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
            }
        }

        // 实时搜索（带防抖）
        // 使用优化的防抖函数（300ms延迟）
        const debouncedSearch = debounce(performSearch, 300);

        document.addEventListener('DOMContentLoaded', function() {
            const searchInput = document.getElementById('searchInput');

            // 监听输入事件（使用防抖优化）
            searchInput.addEventListener('input', function() {
                debouncedSearch();
            });

            // 监听回车键（立即搜索）
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    // 取消防抖，立即执行搜索
                    performSearch();
                }
            });

            // 移动端键盘弹出处理（仅在移动端）
            if (window.innerWidth <= 768) {
                const header = document.querySelector('.header');

                searchInput.addEventListener('focus', () => {
                    // 键盘弹出时，取消固定定位效果
                    if (header) {
                        header.style.position = 'relative';
                    }
                    window.scrollTo(0, 0);
                });

                searchInput.addEventListener('blur', () => {
                    // 恢复正常
                    if (header) {
                        setTimeout(() => {
                            header.style.position = 'relative';
                        }, 300);
                    }
                });

                // 监听窗口大小变化（键盘弹出/收起）
                let initialHeight = window.innerHeight;
                window.addEventListener('resize', () => {
                    const currentHeight = window.innerHeight;
                    const isKeyboardOpen = currentHeight < initialHeight - 150;

                    if (isKeyboardOpen && document.activeElement === searchInput) {
                        if (header) header.style.position = 'relative';
                    } else if (!isKeyboardOpen && header) {
                        header.style.position = 'relative';
                    }
                });
            }
        });

        // =====================================================
        // 视图更新
        // =====================================================

        function updateViews() {
            const filtered = filterActivities();

            // 根据当前Tab更新对应视图
            // 注意：filtered 已经在 filterActivities() 中根据 currentTab 筛选过了
            switch(currentTab) {
                case 0: // 兴趣班 - 日历视图
                    updateCalendarView(filtered);
                    break;

                case 1: // 市集 - 日历视图
                    updateCalendarView(filtered);
                    break;

                case 2: // 音乐 - 日历视图
                    updateCalendarView(filtered);
                    break;

                case 3: // 灵活时间活动 - 列表视图
                    updateListView(filtered, 'flexibleList');
                    break;

                case 4: // 活动网站 - 网站卡片视图
                    console.log('🏪 Tab 4 - 准备调用 updateWebsitesView，活动数:', filtered.length);
                    updateWebsitesView(filtered);
                    break;

                case 5: // 攻略信息 - 富文本内容
                    loadGuideContent();
                    break;
            }

            // 更新结果数量
            updateResultCount(filtered);

            // 更新筛选标签
            updateFilterTags();

            // 更新日期高亮状态
            updateDateHighlight();
        }

        function updateCalendarView(filtered) {
            // 根据当前Tab选择不同的容器
            let gridId;
            if (currentTab === 1) {
                gridId = 'calendarGridMarket';
            } else if (currentTab === 2) {
                gridId = 'calendarGridMusic';
            } else {
                gridId = 'calendarGrid';
            }

            const grid = document.getElementById(gridId);

            // 添加淡入动画类
            grid.style.opacity = '0';
            grid.style.transition = 'opacity 0.2s ease';

            let html = '';

            // 判断是否为移动端
            const isMobile = window.innerWidth <= 768;

            // 移动端：选择日期后显示单日详细视图
            // PC端：始终显示周视图，通过高亮显示选中日期
            if (isMobile && currentFilters.day !== null) {
                // H5端：使用列表视图显示选中日期的活动
                grid.style.display = 'block';
                grid.style.gridTemplateColumns = '1fr';

                // 添加日期标题栏
                const weekDate = weekDates.find(d => d.day === currentFilters.day);
                const dateTitle = weekDate ? `${weekDate.date}日 ${weekDate.dayName}` : '活动详情';

                html = `
                    <div class="day-detail-header">
                        <button class="day-back-btn" onclick="toggleDayFilter(null)">
                            <span>←</span>
                        </button>
                        <div class="day-detail-title">${dateTitle}</div>
                    </div>
                    <div class="day-detail-content">
                        ${createDayDetailView(filtered, currentFilters.day)}
                    </div>
                `;
            } else {
                // PC端或未选择日期：显示周视图（7天）
                grid.style.display = 'grid';
                grid.style.gridTemplateColumns = '';

                // 生成7天的日历单元格，使用未按日期筛选的数据
                const unfiltered = filterActivitiesWithoutDay();
                for (let day = 1; day <= 6; day++) {
                    html += createDayCell(day, unfiltered);
                }
                html += createDayCell(0, unfiltered); // 周日
            }

            grid.innerHTML = html;

            // 触发淡入动画
            setTimeout(() => {
                grid.style.opacity = '1';
            }, 50);

            // 更新日期表头
            const headerId = gridId === 'calendarGridMarket' ? 'dateGridHeaderMarket' :
                            gridId === 'calendarGridMusic' ? 'dateGridHeaderMusic' : 'dateGridHeader';
            updateDateHeaders(headerId);

            // 为每一天添加点击事件（仅在周视图时）
            if (!isMobile || currentFilters.day === null) {
                document.querySelectorAll(`#${gridId} .day-cell`).forEach(cell => {
                    cell.addEventListener('click', function() {
                        const day = parseInt(this.getAttribute('data-day'));
                        toggleDayFilter(day);
                    });

                    // 添加hover效果提示
                    cell.style.cursor = 'pointer';
                });
            } else {
                // H5端单日视图：添加返回按钮
                const backBtn = grid.querySelector('.day-back-btn');
                if (backBtn) {
                    backBtn.addEventListener('click', () => {
                        toggleDayFilter(currentFilters.day);
                    });
                }
            }

            // ========== H5周视图：滚动自动选中功能 ==========
            // 仅在移动端周视图模式下启用
            if (isMobile && currentFilters.day === null) {
                // 等待DOM更新完成后初始化滚动检测
                // ✅ 延迟 1000ms，确保在 Tab 切换保护（800ms）之后才初始化
                setTimeout(() => {
                    initH5ScrollAutoSelect(gridId);
                    // 同时初始化滚动日期高亮功能
                    initH5ScrollDateHighlight(gridId);
                }, 300);
            }
        }

        // 辅助函数：获取未按日期筛选的活动
        function filterActivitiesWithoutDay() {
            const savedDay = currentFilters.day;
            currentFilters.day = null;
            const result = filterActivities();
            currentFilters.day = savedDay;
            return result;
        }

        // 创建单日详细视图
        function createDayDetailView(activities, day) {
            if (activities.length === 0) {
                return `
                    <div class="day-detail-empty" style="text-align:center;padding:30px 20px;color:#999;">
                        <div style="font-size:48px;margin-bottom:12px;">📅</div>
                        <div style="font-size:16px;margin-bottom:8px;">${dayNames[day]}没有活动</div>
                        <button class="day-back-btn" style="margin-top:12px;padding:8px 16px;background:#667eea;color:white;border:none;border-radius:6px;cursor:pointer;">
                            ← 返回周视图
                        </button>
                    </div>
                `;
            }

            const weekDate = weekDates.find(d => d.day === day);
            const dateStr = weekDate ? `${weekDate.month}/${weekDate.date}` : '';

            let html = `
                <div class="day-detail-container">
                    <div class="day-detail-header" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:16px;border-radius:12px;margin-bottom:12px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div>
                                <div style="font-size:20px;font-weight:600;">${dayNames[day]}</div>
                                <div style="font-size:13px;opacity:0.9;">${dateStr}</div>
                            </div>
                            <button class="day-back-btn" style="padding:8px 16px;background:rgba(255,255,255,0.2);color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;">
                                ← 返回
                            </button>
                        </div>
                    </div>
                    <div class="day-detail-activities">
            `;

            html += activities.map(act => `
                <div class="activity-detail-card"
                     style="background:white;border-radius:12px;padding:12px;margin-bottom:8px;border-left:4px solid ${getActivityColor(act.id)};cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.1);"
                     onclick='showActivityDetail("${act.id}")'>
                    <div style="font-weight:600;font-size:16px;margin-bottom:6px;">${cleanTitle(act.title)}</div>
                    <div style="display:flex;gap:12px;font-size:13px;color:#666;">
                        <div>⏰ ${act.time || '灵活时间'}</div>
                        <div>📍 ${act.location}</div>
                        <div>💰 ${act.price}</div>
                    </div>
                    ${act.description ? `<div style="margin-top:6px;font-size:13px;color:#666;line-height:1.5;">${act.description.substring(0, 100)}${act.description.length > 100 ? '...' : ''}</div>` : ''}
                </div>
            `).join('');

            html += `
                    </div>
                </div>
            `;

            return html;
        }

        function createDayCell(day, filtered) {
            // 从筛选后的活动中获取该日期的活动（确保Tab隔离）
            const dayActivities = filtered.filter(act => act.day === day);
            const isSelectedDay = currentFilters.day === day;
            const isToday = isDayToday(day);
            const isDimmed = currentFilters.day !== null && currentFilters.day !== day;

            // 获取日期数字
            const weekDate = weekDates.find(d => d.day === day);
            const dateNumber = weekDate ? weekDate.date : '';

            // 始终使用筛选后的活动
            let activitiesToShow = dayActivities;

            // 按时间排序（较早的活动排在前面）- 使用数字比较
            activitiesToShow = activitiesToShow.sort((a, b) => {
                const timeA = a.time || a.startTime || '灵活时间';
                const timeB = b.time || b.startTime || '灵活时间';
                return compareTimes(timeA, timeB);
            });

            let chipsHtml = '';

            if (activitiesToShow.length === 0) {
                // 没有活动时显示提示
                chipsHtml = `
                    <div style="text-align:center;color:#999;font-size:12px;padding:20px 0;">
                        <div>今日无活动</div>
                    </div>
                `;
            } else {
                chipsHtml = activitiesToShow.map(act => `
                    <div class="activity-chip"
                         style="border-left-color: ${getActivityColor(act.id)}"
                         onclick='showActivityDetail("${act.id}")'>
                        <div style="font-weight: 500;" class="chip-title">${cleanTitle(act.title)}</div>
                        <div style="font-size: 10px; color: #666; font-weight: 600;">${act.time || '灵活时间'}</div>
                    </div>
                `).join('');
            }

            return `
                <div class="day-cell ${isToday ? 'today' : ''} ${isSelectedDay ? 'selected-day' : ''} ${isDimmed ? 'dimmed' : ''}" data-day="${day}">
                    ${chipsHtml}
                </div>
            `;
        }

        function updateListView(filtered, containerId = 'scheduleList') {
            const container = document.getElementById(containerId);

            if (!container) return;

            if (filtered.length === 0) {
                container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#999;">没有找到符合条件的活动</div>';
                return;
            }

            // 判断是否为H5端
            const isH5 = window.innerWidth <= 768;

            if (isH5) {
                // H5端：使用分组显示
                const selectedDay = currentFilters.day;
                const groupedHtml = renderGroupedActivitiesForH5(filtered, selectedDay);
                container.innerHTML = groupedHtml;
                container.style.display = 'block';

                // 如果有选中日期，自动滚动到该日期组
                if (selectedDay !== null) {
                    setTimeout(() => {
                        const selectedGroup = container.querySelector('.day-group-selected');
                        if (selectedGroup) {
                            selectedGroup.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });
                            console.log('✅ 滚动到选中日期组');
                        }
                    }, 100);
                }
            } else {
                // PC端：保持原有网格布局
                // 按时间排序：早的时间排在前面 - 使用数字比较
                const sortedFiltered = [...filtered].sort((a, b) => {
                    return compareTimes(a.time, b.time);
                });

                let html = sortedFiltered.map(act => {
                    const dayName = act.day !== null ? dayNames[act.day] : '灵活时间';
                    const isDaySelected = act.day === currentFilters.day;
                    const dayFilterHtml = act.day !== null
                        ? `<span class="day-filter-chip ${isDaySelected ? 'highlight' : ''}" onclick="event.stopPropagation(); toggleDayFilter(${act.day});" title="点击筛选${dayName}">${dayName}</span>`
                        : `<span style="color: #666;">${dayName}</span>`;

                    return `
                        <div class="schedule-item activity-card"
                             data-day="${act.day !== null ? act.day : ''}"
                             onclick='showActivityDetail("${act.id}")'
                             style="cursor: pointer; transition: all 0.2s ease;">
                            <div class="schedule-item-header">
                                <span class="category-tag" style="background: ${categoryColors[act.category] || '#667eea'}">${act.category}</span>
                                ${dayFilterHtml}
                            </div>
                            <div class="schedule-item-title">${cleanTitle(act.title)}</div>
                            <div class="schedule-item-meta">
                                <div>📍 ${act.location}</div>
                                <div>⏰ ${act.time || '灵活时间'}</div>
                                <div>💰 ${act.price}</div>
                            </div>
                        </div>
                    `;
                }).join('');

                container.innerHTML = `<div class="schedule-list">${html}</div>`;
            }
        }

        // 更新活动网站视图 - 表格形式
        function updateWebsitesView(activities) {
            console.log('🏪 updateWebsitesView 被调用，活动数量:', activities.length);
            const container = document.getElementById('websitesContainer');

            if (!container) {
                console.error('❌ 找不到 websitesContainer 元素!');
                return;
            }

            if (activities.length === 0) {
                console.log('⚠️ 没有活动网站链接');
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">暂无活动网站链接</div>';
                return;
            }

            // 去重：使用 originalId 或 id 去重，同一活动只显示一次
            const uniqueActivities = [];
            const seenIds = new Set();
            activities.forEach(act => {
                const id = act.originalId || act.id;
                if (!seenIds.has(id)) {
                    seenIds.add(id);
                    uniqueActivities.push(act);
                }
            });

            console.log('✅ 去重后活动数量:', uniqueActivities.length);

            // 按分类分组
            const grouped = {};
            uniqueActivities.forEach(act => {
                if (!grouped[act.category]) {
                    grouped[act.category] = [];
                }
                grouped[act.category].push(act);
            });

            let html = '<div style="padding: 20px;">';

            // 遍历每个分类
            Object.keys(grouped).sort().forEach(category => {
                html += `
                    <div style="margin-bottom: 24px;">
                        <h3 style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid ${categoryColors[category] || '#667eea'};">
                            ${category} (${grouped[category].length})
                        </h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <thead>
                                <tr style="background: #f5f5f5;">
                                    <th style="padding: 10px; text-align: left; font-weight: 600; color: #666; width: 50%;">名称</th>
                                    <th style="padding: 10px; text-align: left; font-weight: 600; color: #666; width: 50%;">链接</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                grouped[category].forEach(act => {
                    const url = act.source.url;
                    html += `
                        <tr style="border-bottom: 1px solid #f0f0f0;">
                            <td style="padding: 12px 10px; color: #333;">${act.title}</td>
                            <td style="padding: 12px 10px;">
                                <a href="${url}" target="_blank" style="color: #667eea; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; word-break: break-all;">
                                    🔗 ${url}
                                </a>
                            </td>
                        </tr>
                    `;
                });

                html += `
                            </tbody>
                        </table>
                    </div>
                `;
            });

            html += '</div>';
            container.innerHTML = html;
            console.log('✅ 网站链接表格生成完成');
        }

        // 加载攻略内容
        async function loadGuideContent() {
            const container = document.getElementById('guideContent');

            if (!container) return;

            container.innerHTML = '<div style="text-align:center;padding:40px;">加载中...</div>';

            try {
                const response = await fetch('/api/guide');
                const result = await response.json();

                if (result.success && result.data && result.data.content) {
                    // 安全性：净化HTML以防止XSS攻击
                    container.innerHTML = sanitizeHTML(result.data.content);

                    // 清除所有内联样式，让CSS样式生效
                    setTimeout(() => {
                        const allElements = container.querySelectorAll('*');
                        allElements.forEach(el => {
                            el.style.fontSize = '';
                            el.style.color = '';
                            el.style.fontFamily = '';
                            el.style.margin = '';
                            el.style.padding = '';
                        });
                    }, 50);
                } else {
                    container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">暂无攻略信息</div>';
                }
            } catch (error) {
                console.error('加载攻略失败:', error);
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">加载失败，请稍后重试</div>';
            }
        }

        function updateResultCount(filtered) {
            const hasFilter = currentFilters.category !== '全部' ||
                             currentFilters.price !== '全部' ||
                             currentFilters.day !== null ||
                             currentFilters.search;

            // 根据当前Tab计算对应的活动总数
            let totalInTab = 0;
            switch(currentTab) {
                case 0: // 兴趣班
                    totalInTab = allActivities.filter(a => {
                        if (a.category === '市集') return false;
                        if (a.flexibleTime === '是' || a.time === '灵活时间') return false;
                        return true;
                    }).length;
                    break;
                case 1: // 市集
                    totalInTab = allActivities.filter(a => a.category === '市集').length;
                    break;
                case 2: // 灵活时间
                    totalInTab = allActivities.filter(a => a.flexibleTime === '是' || a.time === '灵活时间').length;
                    break;
                case 3: // 活动网站
                    totalInTab = new Set(allActivities.filter(a => a.source && a.source.url).map(a => a.originalId || a.id)).size;
                    break;
                case 4: // 攻略信息
                    totalInTab = 1; // 固定为1页
                    break;
            }

            // 如果有筛选条件，显示筛选后的数量；否则显示当前Tab的总数
            document.getElementById('totalCount').textContent =
                hasFilter ? filtered.length : totalInTab;
        }

        function updateFilterTags() {
            const container = document.getElementById('activeFilters');
            container.innerHTML = '';

            const hasFilter = currentFilters.category !== '全部' ||
                             currentFilters.price !== '全部' ||
                             currentFilters.day !== null ||
                             currentFilters.search;

            if (!hasFilter) {
                container.classList.remove('show');
                return;
            }

            container.classList.add('show');

            // 日期标签
            if (currentFilters.day !== null) {
                container.innerHTML += `<div class="filter-tag"><span>日期: ${dayNames[currentFilters.day]}</span><button onclick="clearFilter('day')">✕</button></div>`;
            }

            // 分类标签
            if (currentFilters.category !== '全部') {
                container.innerHTML += `<div class="filter-tag"><span>分类: ${currentFilters.category}</span><button onclick="clearFilter('category')">✕</button></div>`;
            }

            // 价格标签
            if (currentFilters.price !== '全部') {
                container.innerHTML += `<div class="filter-tag"><span>价格: ${currentFilters.price}</span><button onclick="clearFilter('price')">✕</button></div>`;
            }

            // 搜索标签
            if (currentFilters.search) {
                container.innerHTML += `<div class="filter-tag"><span>搜索: ${currentFilters.search}</span><button onclick="clearSearch()">✕</button></div>`;
            }

            // 清除全部按钮
            container.innerHTML += '<button class="clear-all-btn" onclick="clearAllFilters()">清除全部</button>';
        }

        function updateDateHighlight() {
            // 更新日期表头的高亮状态
            document.querySelectorAll('.date-cell-header').forEach(header => {
                const day = parseInt(header.getAttribute('data-day'));
                if (day === currentFilters.day) {
                    header.classList.add('selected-day');
                } else {
                    header.classList.remove('selected-day');
                }
            });

            // 更新日历单元格的选中状态
            document.querySelectorAll('.day-cell').forEach(cell => {
                const day = parseInt(cell.getAttribute('data-day'));
                if (day === currentFilters.day) {
                    cell.classList.add('selected-day');
                } else {
                    cell.classList.remove('selected-day');
                }
            });
        }

        function isDayToday(day) {
            const today = new Date().getDay();
            return today === day;
        }

        // =====================================================
        // Tab 切换
        // =====================================================

        function clearFilter(filterKey) {
            if (filterKey === 'day') {
                currentFilters.day = null;
            } else if (filterKey === 'category') {
                currentFilters.category = '全部';
                document.querySelectorAll('#categoryChips .filter-chip').forEach(chip => {
                    chip.classList.remove('active');
                    if (chip.textContent.trim() === '全部') chip.classList.add('active');
                });
            } else if (filterKey === 'price') {
                currentFilters.price = '全部';
                const priceGroup = document.querySelectorAll('.filter-group')[1];
                priceGroup.querySelectorAll('.filter-chip').forEach(chip => {
                    chip.classList.remove('active');
                    if (chip.textContent.trim() === '全部') chip.classList.add('active');
                });
            }

            updateViews();
        }

        function clearSearch() {
            currentFilters.search = '';
            document.getElementById('searchInput').value = '';
            updateViews();
        }

        function clearAllFilters() {
            currentFilters = {
                category: '全部',
                price: '全部',
                day: null,
                search: ''
            };

            // 重置 UI
            document.querySelectorAll('#categoryChips .filter-chip').forEach(chip => {
                chip.classList.remove('active');
                if (chip.textContent.trim() === '全部') chip.classList.add('active');
            });

            const priceGroup = document.querySelectorAll('.filter-group')[1];
            priceGroup.querySelectorAll('.filter-chip').forEach(chip => {
                chip.classList.remove('active');
                if (chip.textContent.trim() === '全部') chip.classList.add('active');
            });

            document.getElementById('searchInput').value = '';

            updateViews();
        }

        // =====================================================
        // 活动详情弹窗
        // =====================================================

        function showActivityDetail(activityId) {
            const activity = allActivities.find(a => a.originalId == activityId || a.id == activityId);
            if (!activity) {
                console.warn('活动未找到:', activityId);
                return;
            }

            // 安全地获取DOM元素
            const setTitle = (id, text) => {
                const el = document.getElementById(id);
                if (el) el.textContent = text || '';
            };

            setTitle('modalTitle', activity.title);
            setTitle('modalCategory', activity.category);
            setTitle('modalLocation', activity.location);
            setTitle('modalTime', activity.time || '灵活时间');
            setTitle('modalPrice', activity.price || '');
            setTitle('modalFrequency', activity.frequency === 'weekly' ? '每周' : '一次性');

            // 处理时长信息
            const modalDurationItem = document.getElementById('modalDurationItem');
            const modalDuration = document.getElementById('modalDuration');
            if (modalDurationItem && modalDuration) {
                if (activity.duration && activity.duration !== '时间灵活，无固定时长限制' && activity.duration !== '时间灵活，无固定时长限制') {
                    modalDurationItem.style.display = 'flex';
                    modalDuration.textContent = activity.duration;
                } else {
                    modalDurationItem.style.display = 'none';
                }
            }

            // 处理频率信息显示
            const modalFrequencyRow = document.getElementById('modalFrequencyRow');
            if (modalFrequencyRow && activity.frequency) {
                modalFrequencyRow.style.display = 'flex';
            }

            // 格式化描述信息，过滤掉顶部已显示的字段
            const baseDescription = activity.description || '暂无描述';
            const formattedDescription = formatDescription(baseDescription, activity);

            const descEl = document.getElementById('modalDescription');
            if (descEl) {
                // 安全性：净化HTML以防止XSS攻击（formatDescription已经做了部分转义，这里做最终防护）
                descEl.innerHTML = sanitizeHTML(formattedDescription);
            }

            // 处理链接按钮
            const modalFooter = document.getElementById('modalFooter');
            const modalLinkButton = document.getElementById('modalLinkButton');

            if (modalFooter && modalLinkButton) {
                const url = activity.source?.url;
                if (url && url.trim() !== '') {
                    modalFooter.style.display = 'block';
                    modalLinkButton.href = url.trim();
                } else {
                    modalFooter.style.display = 'none';
                }
            }

            const modal = document.getElementById('activityModal');
            if (modal) modal.classList.add('active');
        }

        // 清理活动标题中的重复标签
        function cleanTitle(title) {
            if (!title) return title;

            // 移除重复的标签（例如："注意事项：注意事项：" → "注意事项："）
            const patterns = [
                { pattern: /(适合人群[：:]\s*){2,}/g, replacement: '$1' },
                { pattern: /(活动特点[：:]\s*){2,}/g, replacement: '$1' },
                { pattern: /(注意事项[：:]\s*){2,}/g, replacement: '$1' },
                { pattern: /(课程周期[：:]\s*){2,}/g, replacement: '$1' },
                { pattern: /(语言[：:]\s*){2,}/g, replacement: '$1' },
                { pattern: /(费用[：:]\s*){2,}/g, replacement: '$1' },
                { pattern: /(联系方式[：:]\s*){2,}/g, replacement: '$1' },
                { pattern: /(官网[：:]\s*){2,}/g, replacement: '$1' },
                // 移除标签后的冗余冒号和空格
                { pattern: /([：:]\s*)+[：:]/g, replacement: '：' },
                { pattern: /\s+：/g, replacement: '：' }
            ];

            let cleaned = title;
            patterns.forEach(({ pattern, replacement }) => {
                cleaned = cleaned.replace(pattern, replacement);
            });

            return cleaned;
        }

        // 格式化描述信息，添加图标和结构化展示，并过滤重复字段
        function formatDescription(description, activity = null) {
            if (!description) return '暂无描述';

            let formatted = description;

            // ========== 清理冗余符号和格式 ==========
            // 1. 清理双感叹号文本符号 "!!"
            formatted = formatted.replace(/!!+/g, '!');

            // 2. 清理多重感叹号emoji（如 ‼️ ❗❗）
            formatted = formatted.replace(/‼️+/g, '⚠️');
            formatted = formatted.replace(/❗❗+/g, '⚠️');
            formatted = formatted.replace(/❗+/g, '⚠️');

            // 3. 清理重复的警告符号（多个⚠️连在一起）
            formatted = formatted.replace(/(⚠️\s*){2,}/g, '⚠️ ');

            // 4. 清理重复的标点符号
            formatted = formatted.replace(/。+/g, '。');
            formatted = formatted.replace(/：+/g, '：');
            formatted = formatted.replace(/，+/g, '，');

            // 5. 清理行首行尾多余空格
            formatted = formatted.replace(/^\s+|\s+$/gm, '');

            // ========== 如果有活动信息，过滤掉顶部已显示的字段 ==========
            if (activity) {
                // 过滤时间信息
                if (activity.time && activity.time !== '灵活时间') {
                    formatted = formatted.replace(/[⏰]?\s*时间[：:]\s*[^\n]*/g, '');
                }

                // 过滤价格/费用信息
                if (activity.price) {
                    formatted = formatted.replace(/[💰]?\s*费用[：:]\s*[^\n]*/g, '');
                }
            }

            // ========== 定义字段和对应的图标（注意：避免重叠的模式）==========
            const fieldPatterns = [
                { pattern: /适合人群[：:]\s*/g, icon: '👥', label: '适合人群：' },
                { pattern: /活动特点[：:]\s*/g, icon: '✨', label: '活动特点：' },
                { pattern: /课程周期[：:]\s*/g, icon: '📚', label: '课程周期：' },
                { pattern: /标准课程周期[：:]\s*/g, icon: '📚', label: '课程周期：' },
                { pattern: /语言[：:]\s*/g, icon: '🌐', label: '语言：' },
                { pattern: /费用[：:]\s*/g, icon: '💰', label: '费用：' },
                { pattern: /官网[：:]\s*/g, icon: '🌐', label: '官网：' },
                { pattern: /联系方式[：:]\s*/g, icon: '📞', label: '联系方式：' },
                // 注意事项：合并两个模式，避免重复替换
                { pattern: /(⚠️\s*)?注意事项[：:]\s*/g, icon: '⚠️', label: '注意事项：' }
            ];

            // 替换所有匹配的字段
            fieldPatterns.forEach(({ pattern, icon, label }) => {
                formatted = formatted.replace(pattern, `\n<strong>${icon} ${label}</strong>`);
            });

            // 标准化换行：多个连续换行替换为单个换行
            formatted = formatted.replace(/\n\s*\n\s*/g, '\n');

            // 转义HTML，但保留我们添加的<strong>标签
            const lines = formatted.split('\n');
            return lines.map(line => {
                const trimmed = line.trim();
                if (!trimmed) return ''; // 跳过空行

                // 安全性：检查是否是我们程序化添加的<strong>标签（行首以<strong>开头）
                // 只保留我们添加的标签，转义用户输入中的任何HTML
                if (trimmed.startsWith('<strong>')) {
                    // 即使是我们添加的<strong>标签，也要确保内容是安全的
                    // 提取标签内容，转义后重新包装
                    const match = trimmed.match(/^<strong>(.*?)<\/strong>(.*)$/);
                    if (match) {
                        const [, iconLabel, restContent] = match;
                        // 转义<strong>标签之后的内容（用户可能输入的部分）
                        const safeContent = restContent
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;');
                        return `<strong>${iconLabel}</strong>${safeContent}`;
                    }
                }

                // 普通文本行，转义所有HTML（防止XSS）
                const escaped = trimmed
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
                return escaped;
            }).filter(line => line.length > 0).join('<br>');
        }
