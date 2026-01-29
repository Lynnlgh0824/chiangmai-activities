        let currentTab = 0; // 当前选中的Tab

        function switchTab(index) {
            console.log(`🔄 切换到 Tab ${index}`);
            currentTab = index;

            // 切换Tab时清除所有筛选条件（除了搜索）
            currentFilters.category = '全部';
            currentFilters.price = '全部';
            currentFilters.day = null;
            currentFilters.search = '';

            // 清除搜索框
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = '';
            }

            // 移除所有 active 类
            document.querySelectorAll('.tab-item').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });

            // 添加 active 类到当前 Tab
            document.querySelectorAll('.tab-item')[index].classList.add('active');
            document.getElementById('tab-' + index).classList.add('active');

            // 🆕 更新筛选弹窗的分类选项（基于新Tab）
            if (window.innerWidth <= 768) {