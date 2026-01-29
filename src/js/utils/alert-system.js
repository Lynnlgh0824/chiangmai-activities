        const AlertSystem = {
            config: {
                enabled: true,
                thresholds: {
                    slowRequest: 1000,      // 慢请求阈值（ms）
                    errorRate: 0.05,        // 错误率阈值（5%）
                    memoryUsage: 0.8,       // 内存使用率阈值（80%）
                    apiTimeout: 5000        // API超时阈值（ms）
                },
                alertCallback: null        // 自定义告警回调
            },

            metrics: {
                requestCount: 0,
                errorCount: 0,
                slowRequestCount: 0
            },

            /**
             * 初始化告警系统
             */
            init(config = {}) {
                Object.assign(this.config, config);

                // 定期检查性能指标
                setInterval(() => this.periodicCheck(), 60000); // 每分钟检查一次

                console.log('✅ 性能告警系统已启用');
            },

            /**
             * 检查请求耗时
             */
            checkRequestDuration(duration) {
                this.metrics.requestCount++;

                if (duration > this.config.thresholds.slowRequest) {
                    this.metrics.slowRequestCount++;
                    this.triggerAlert('slow_request', {
                        duration: duration,
                        threshold: this.config.thresholds.slowRequest
                    });
                }
            },

            /**
             * 检查错误率
             */
            checkErrorRate() {
                if (this.metrics.requestCount === 0) return;

                const errorRate = this.metrics.errorCount / this.metrics.requestCount;

                if (errorRate > this.config.thresholds.errorRate) {
                    this.triggerAlert('high_error_rate', {
                        errorRate: (errorRate * 100).toFixed(2) + '%',
                        errorCount: this.metrics.errorCount,
                        requestCount: this.metrics.requestCount
                    });
                }
            },

            /**
             * 检查内存使用
             */
            checkMemoryUsage() {
                if (!performance.memory) return;

                const used = performance.memory.usedJSHeapSize;
                const total = performance.memory.jsHeapSizeLimit;
                const usageRate = used / total;

                if (usageRate > this.config.thresholds.memoryUsage) {
                    this.triggerAlert('high_memory_usage', {
                        usageRate: (usageRate * 100).toFixed(2) + '%',
                        used: (used / 1024 / 1024).toFixed(2) + 'MB',
                        total: (total / 1024 / 1024).toFixed(2) + 'MB'
                    });
                }
            },

            /**
             * 定期检查
             */
            periodicCheck() {
                this.checkMemoryUsage();

                // 重置计数器（每小时）
                if (this.metrics.requestCount > 1000) {
                    this.metrics.requestCount = 0;
                    this.metrics.errorCount = 0;
                    this.metrics.slowRequestCount = 0;
                }
            },

            /**
             * 触发告警
             */
            triggerAlert(alertType, data) {
                const alert = {
                    type: alertType,
                    data: data,
                    timestamp: new Date().toISOString()
                };

                console.warn('⚠️  性能告警:', alert);

                // 调用自定义回调
                if (this.config.alertCallback) {
                    this.config.alertCallback(alert);
                }

                // 发送到Analytics
                Analytics.trackEvent('performance_alert', {
                    alert_type: alertType,
                    ...data
                });
            },

            /**
             * 记录错误
             */
            recordError() {
                this.metrics.errorCount++;
            }
        };

        /**
         * Web Worker管理器
         * 用于处理复杂计算，避免阻塞主线程
         */
        const WorkerManager = {
            workers: new Map(),

            /**
             * 创建Worker
             */
            create(key, scriptContent) {
                if (typeof Worker === 'undefined') {
                    console.warn('浏览器不支持Web Worker');
                    return null;
                }

                try {
                    // 创建Blob URL
                    const blob = new Blob([scriptContent], { type: 'application/javascript' });
                    const url = URL.createObjectURL(blob);

                    const worker = new Worker(url);
                    this.workers.set(key, worker);

                    console.log('✅ Web Worker已创建:', key);
                    return worker;
                } catch (error) {
                    console.error('创建Worker失败:', error);
                    return null;
                }
            },

            /**
             * 获取Worker
             */
            get(key) {
                return this.workers.get(key);
            },

            /**
             * 销毁Worker
             */
            destroy(key) {
                const worker = this.workers.get(key);
                if (worker) {
                    worker.terminate();
                    this.workers.delete(key);
                    console.log('🗑️  Web Worker已销毁:', key);
                }
            },

            /**
             * 销毁所有Worker
             */
            destroyAll() {
                this.workers.forEach((worker, key) => {
                    worker.terminate();
                });
                this.workers.clear();
                console.log('🗑️  所有Web Worker已销毁');
            }
        };

        /**
         * Service Worker注册器
         * 用于离线支持和PWA功能
         */
        const ServiceWorkerManager = {
            /**
             * 注册Service Worker
             */
            async register(scriptPath = '/sw.js') {
                if (!('serviceWorker' in navigator)) {
                    console.warn('浏览器不支持Service Worker');
                    return false;
                }

                try {
                    const registration = await navigator.serviceWorker.register(scriptPath);
                    console.log('✅ Service Worker已注册:', registration);

                    // 监听更新
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('🔄 新的Service Worker可用，请刷新页面');
                            }
                        });
                    });

                    return true;
                } catch (error) {
                    console.error('❌ Service Worker注册失败:', error);
                    return false;
                }
            },

            /**
             * 取消注册
             */
            async unregister() {
                if (!('serviceWorker' in navigator)) return;

                try {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                    }
                    console.log('🗑️  Service Worker已取消注册');
                } catch (error) {
                    console.error('取消注册失败:', error);
                }
            }
        };

        // =====================================================
        // 初始化监控系统
        // =====================================================

        // 初始化错误追踪
        ErrorTracker.init({
            enabled: true,
            environment: 'production',
            // 配置错误上报URL（可选）
            // reportUrl: '/api/error-report'
        });

        // 初始化告警系统
        AlertSystem.init({
            enabled: true,
            thresholds: {
                slowRequest: 1000,
                errorRate: 0.05,
                memoryUsage: 0.8,
                apiTimeout: 5000
            },
            // 自定义告警回调（可选）
            alertCallback: (alert) => {
                // 可以在这里发送到服务器或显示通知
                console.log('🚨 性能告警回调:', alert);
            }
        });

        // 初始化Analytics（需要配置才能启用）
        Analytics.init({
            enabled: false,  // 启用时设置为true并配置trackingId
            // trackingId: 'G-XXXXXXXXXX',  // 替换为实际的GA4测量ID
            debug: false
        });

        // 性监控集成
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const start = Date.now();
            const url = args[0];

            try {
                const response = await originalFetch.apply(this, args);
                const duration = Date.now() - start;

                // 记录请求耗时
                AlertSystem.checkRequestDuration(duration);

                // 追踪到Analytics
                if (duration > AlertSystem.config.thresholds.slowRequest) {
                    Analytics.trackPerformance('slow_api_request', duration, 'network');
                }

                return response;
            } catch (error) {
                const duration = Date.now() - start;
                AlertSystem.recordError();
                ErrorTracker.captureError(error, {
                    type: 'fetchError',
                    url: url,
                    duration: duration
                });
                throw error;
            }
        };

        console.log('📊 监控系统已完全初始化');

        /**
         * 虚拟滚动实现
         * 用于超长列表的性能优化
         */
        class VirtualScroll {
            constructor(options = {}) {
                this.container = options.container;
                this.itemHeight = options.itemHeight || 50;
                this.renderBuffer = options.renderBuffer || 5;
                this.data = [];
                this.visibleStart = 0;
                this.visibleEnd = 0;
                this.scrollTop = 0;

                if (!this.container) {
                    console.error('VirtualScroll: 容器元素不存在');
                    return;
                }

                this.init();
            }

            /**
             * 初始化虚拟滚动
             */
            init() {
                // 创建滚动容器
                this.container.style.overflow = 'auto';
                this.container.style.position = 'relative';

                // 创建内容容器
                this.contentDiv = document.createElement('div');
                this.contentDiv.style.position = 'relative';
                this.contentDiv.style.minHeight = '100%';
                this.container.appendChild(this.contentDiv);

                // 监听滚动事件
                this.container.addEventListener('scroll', throttle(() => {
                    this.onScroll();
                }, 16)); // ~60fps

                console.log('✅ 虚拟滚动已初始化');
            }

            /**
             * 设置数据
             */
            setData(data) {
                this.data = data;
                this.updateContentHeight();
                this.render();
            }

            /**
             * 更新内容高度
             */
            updateContentHeight() {
                const totalHeight = this.data.length * this.itemHeight;
                this.contentDiv.style.height = totalHeight + 'px';
            }

            /**
             * 滚动事件处理
             */
            onScroll() {
                this.scrollTop = this.container.scrollTop;
                this.render();
            }

            /**
             * 计算可见范围
             */
            calculateVisibleRange() {
                const containerHeight = this.container.clientHeight;
                const startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.renderBuffer);
                const endIndex = Math.min(
                    this.data.length,
                    Math.ceil((this.scrollTop + containerHeight) / this.itemHeight) + this.renderBuffer
                );

                return { startIndex, endIndex };
            }

            /**
             * 渲染可见项
             */
            render() {
                const { startIndex, endIndex } = this.calculateVisibleRange();

                // 如果可见范围未变化，不重新渲染
                if (startIndex === this.visibleStart && endIndex === this.visibleEnd) {
                    return;
                }

                this.visibleStart = startIndex;
                this.visibleEnd = endIndex;

                // 清空并重新渲染
                this.contentDiv.innerHTML = '';

                for (let i = startIndex; i < endIndex; i++) {
                    const item = this.data[i];
                    if (!item) continue;

                    const itemEl = this.createItemElement(item, i);
                    itemEl.style.position = 'absolute';
                    itemEl.style.top = (i * this.itemHeight) + 'px';
                    itemEl.style.height = this.itemHeight + 'px';
                    itemEl.style.width = '100%';

                    this.contentDiv.appendChild(itemEl);
                }
            }

            /**
             * 创建列表项元素（子类覆盖）
             */
            createItemElement(item, index) {
                const div = document.createElement('div');
                div.textContent = item.title || item.name || JSON.stringify(item);
                return div;
            }

            /**
             * 滚动到指定位置
             */
            scrollToIndex(index) {
                this.container.scrollTop = index * this.itemHeight;
            }

            /**
             * 销毁虚拟滚动
             */
            destroy() {
                this.container.removeEventListener('scroll', this.onScroll);
                this.container.innerHTML = '';
            }
        }

        /**
         * CDN资源配置
         * 支持将静态资源迁移到CDN
         */
        const CDNConfig = {
            enabled: false,
            baseUrl: '', // 例如: 'https://cdn.example.com'

            /**
             * 初始化CDN
             */
            init(config = {}) {
                Object.assign(this, config);

                if (!this.enabled || !this.baseUrl) {
                    console.log('ℹ️  CDN未配置');
                    return;
                }

                console.log('✅ CDN已启用:', this.baseUrl);
            },

            /**
             * 获取CDN URL
             */
            getURL(relativePath) {
                if (!this.enabled) return relativePath;
                return this.baseUrl + relativePath;
            },

            /**
             * 预加载CDN资源
             */
            preloadResources(resources) {
                if (!this.enabled) return;

                resources.forEach(resource => {
                    const link = document.createElement('link');
                    link.rel = 'preload';
                    link.as = this.getResourceType(resource);
                    link.href = this.getURL(resource);
                    document.head.appendChild(link);
                });
            },

            /**
             * 获取资源类型
             */
            getResourceType(path) {
                const ext = path.split('.').pop().toLowerCase();
                const types = {
                    'js': 'script',
                    'css': 'style',
                    'woff2': 'font',
                    'woff': 'font',
                    'ttf': 'font',
                    'jpg': 'image',
                    'jpeg': 'image',
                    'png': 'image',
                    'gif': 'image',
                    'svg': 'image',
                    'webp': 'image'
                };
                return types[ext] || 'fetch';
            }
        };

        /**
         * 代码分割管理器
         * 按需加载JavaScript模块
         */
        const CodeSplitter = {
            loadedModules: new Map(),

            /**
             * 动态加载模块
             */
            async loadModule(moduleName, modulePath) {
                // 检查是否已加载
                if (this.loadedModules.has(moduleName)) {
                    return this.loadedModules.get(moduleName);
                }

                try {
                    PerfMonitor.start(`loadModule_${moduleName}`);

                    // 动态导入模块
                    const module = await import(modulePath);

                    this.loadedModules.set(moduleName, module);

                    PerfMonitor.end(`loadModule_${moduleName}`);

                    Analytics.trackEvent('module_loaded', {
                        module_name: moduleName
                    });

                    console.log('✅ 模块已加载:', moduleName);
                    return module;
                } catch (error) {
                    ErrorTracker.captureError(error, {
                        type: 'moduleLoadError',
                        moduleName: moduleName,
                        modulePath: modulePath
                    });
                    throw error;
                }
            },

            /**
             * 预加载模块
             */
            preloadModule(modulePath) {
                const link = document.createElement('link');
                link.rel = 'modulepreload';
                link.href = modulePath;
                document.head.appendChild(link);
            },

            /**
             * 检查模块是否已加载
             */
            isModuleLoaded(moduleName) {
                return this.loadedModules.has(moduleName);
            }
        };

        // =====================================================
        // 数据获取
        // =====================================================
