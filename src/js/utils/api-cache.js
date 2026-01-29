        const APICache = {
            cache: new Map(),
            timestamps: new Map(),
            defaultTTL: 5 * 60 * 1000, // 5分钟缓存

            /**
             * 生成缓存键
             */
            getKey(url, options = {}) {
                return `${url}:${JSON.stringify(options)}`;
            },

            /**
             * 获取缓存数据
             */
            get(url, options = {}) {
                const key = this.getKey(url, options);
                const cached = this.cache.get(key);
                const timestamp = this.timestamps.get(key);

                if (!cached || !timestamp) return null;

                // 检查是否过期
                const ttl = options.ttl || this.defaultTTL;
                if (Date.now() - timestamp > ttl) {
                    this.delete(url, options);
                    return null;
                }

                console.log('✅ 缓存命中:', url);
                return cached;
            },

            /**
             * 设置缓存
             */
            set(url, data, options = {}) {
                const key = this.getKey(url, options);
                this.cache.set(key, data);
                this.timestamps.set(key, Date.now());
            },

            /**
             * 删除缓存
             */
            delete(url, options = {}) {
                const key = this.getKey(url, options);
                this.cache.delete(key);
                this.timestamps.delete(key);
            },

            /**
             * 清空所有缓存
             */
            clear() {
                this.cache.clear();
                this.timestamps.clear();
            },

            /**
             * 带缓存的fetch封装
             */
            async fetch(url, options = {}) {
                // 尝试从缓存获取
                const cached = this.get(url, options);
                if (cached && !options.bypassCache) {
                    return cached;
                }

                // 发起网络请求
                const response = await fetch(url, options);
                const data = await response.json();

                // 缓存成功响应
                if (data.success) {
                    this.set(url, data, options);
                }

                return data;
            }
        };

        /**
         * 防抖函数（debounce）
         * 延迟执行，直到停止触发一段时间后才执行
         * 适用场景：搜索输入、resize事件
         */
        function debounce(func, wait = 300) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        /**
         * 节流函数（throttle）
         * 限制执行频率，确保一定时间内只执行一次
         * 适用场景：滚动事件、鼠标移动
         */
        function throttle(func, limit = 100) {
            let inThrottle;
            return function executedFunction(...args) {
                if (!inThrottle) {
                    func(...args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }

        /**
         * DOM批量更新工具
         * 使用DocumentFragment减少重排重绘
         */
        const DOMBatch = {
            /**
             * 批量创建并插入元素
             */
            batchInsert(parent, createFn) {
                const fragment = document.createDocumentFragment();
                createFn(fragment);
                parent.appendChild(fragment);
            },

            /**
             * 批量更新元素
             */
            batchUpdate(elements, updateFn) {
                // 使用requestAnimationFrame确保在下一帧更新
                requestAnimationFrame(() => {
                    const fragment = document.createDocumentFragment();
                    elements.forEach(el => {
                        updateFn(el);
                    });
                });
            }
        };

        /**
         * 图片懒加载管理器
         * 使用Intersection Observer API实现高性能懒加载
         */
        const LazyLoader = {
            observer: null,
            loadedImages: new WeakSet(),

            /**
             * 初始化懒加载观察器
             */
            init() {
                if (!('IntersectionObserver' in window)) {
                    console.warn('浏览器不支持IntersectionObserver，懒加载将不会工作');
                    return;
                }

                this.observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            this.loadImage(img);
                            this.observer.unobserve(img);
                        }
                    });
                }, {
                    rootMargin: '50px 0px', // 提前50px开始加载
                    threshold: 0.01
                });

                console.log('✅ 图片懒加载已启用');
            },

            /**
             * 加载单张图片
             */
            loadImage(img) {
                if (this.loadedImages.has(img)) return;

                const src = img.dataset.src;
                if (!src) return;

                // 创建临时图片对象预加载
                const tempImg = new Image();
                tempImg.onload = () => {
                    img.src = src;
                    img.classList.add('loaded');
                    this.loadedImages.add(img);
                };
                tempImg.onerror = () => {
                    img.classList.add('error');
                };
                tempImg.src = src;
            },

            /**
             * 观察图片元素
             */
            observe(img) {
                if (!this.observer) {
                    this.init();
                }
                if (img) {
                    this.observer.observe(img);
                }
            },

            /**
             * 批量观察多个图片
             */
            observeAll(images) {
                if (!this.observer) {
                    this.init();
                }
                images.forEach(img => this.observe(img));
            }
        };

        /**
         * 性能监控工具
         * 记录关键操作的性能指标
         */
        const PerfMonitor = {
            marks: new Map(),

            /**
             * 开始计时
             */
            start(label) {
                performance.mark(`${label}-start`);
                this.marks.set(label, Date.now());
            },

            /**
             * 结束计时并记录
             */
            end(label) {
                const startTime = this.marks.get(label);
                if (startTime) {
                    const duration = Date.now() - startTime;
                    console.log(`⏱️  ${label}: ${duration}ms`);
                    this.marks.delete(label);
                    return duration;
                }
            },

            /**
             * 测量异步函数性能
             */
            async measure(label, fn) {
                this.start(label);
                try {
                    const result = await fn();
                    this.end(label);
                    return result;
                } catch (error) {
                    this.end(label);
                    throw error;
                }
            }
        };

        // 初始化懒加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => LazyLoader.init());
        } else {
            LazyLoader.init();
        }

        // =====================================================
        // 监控和告警系统（第四阶段）
        // =====================================================

        /**
         * 错误追踪系统
         * 本地错误日志和上报（可扩展集成Sentry）
         */