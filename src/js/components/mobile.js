                updateFilterSheetCategories(index);
                console.log('✅ 已更新筛选弹窗分类，Tab:', index);
            }

            // ✅ 防止 Tab 切换时自动选中日期
            // 设置保护标志，短暂禁用滚动自动选中
            isPageFirstLoad = true;
            console.log('⏸️ Tab 切换，暂时禁用自动选中');

            // 根据Tab更新视图
            updateViews();

            // ✅ 视图更新完成后，重新启用滚动自动选中
            // 延迟 800ms，确保视图完全渲染
            setTimeout(() => {
                isPageFirstLoad = false;
                console.log('✅ Tab 切换完成，滚动自动选中已启用');
            }, 800);
        }

        // =====================================================
        // 清除筛选
        // =====================================================
