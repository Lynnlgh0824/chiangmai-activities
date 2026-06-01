        // =====================================================
        // 应用版本管理
        // =====================================================

        /**
         * 从API获取应用版本号
         */
        async function getAppVersion() {
            try {
                const response = await fetch('/app/version');
                const result = await response.json();
                if (result.success) {
                    return result.version;
                }
                return 'v1.0.0'; // 默认版本
            } catch (error) {
                console.warn('无法获取应用版本，使用默认版本');
                return 'v1.0.0';
            }
        }

        /**
         * 检查应用版本并提示用户刷新
         */
        async function checkAppVersion() {
            const APP_VERSION = await getAppVersion();
            const storedVersion = localStorage.getItem('chiangmai_app_version');

            // 如果版本不同，提示用户刷新
            if (storedVersion && storedVersion !== APP_VERSION) {
                console.log('🔄 应用版本已更新:', storedVersion, '→', APP_VERSION);

                // 显示版本更新提示
                const versionNotice = document.createElement('div');
                versionNotice.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px 20px;
                    text-align: center;
                    font-size: 14px;
                    font-weight: 600;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    z-index: 99999;
                    animation: slideDown 0.3s ease-out;
                `;
                versionNotice.innerHTML = `
                    🎉 应用已更新到 ${APP_VERSION}
                    <span style="margin-left: 20px; cursor: pointer; opacity: 0.9;" onclick="this.parentElement.remove()">✕ 关闭</span>
                `;
                document.body.appendChild(versionNotice);

                // 滑入动画
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes slideDown {
                        from { transform: translateY(-100%); }
                        to { transform: translateY(0); }
                    }
                `;
                document.head.appendChild(style);

                // 5秒后自动消失
                setTimeout(() => {
                    if (versionNotice.parentElement) {
                        versionNotice.remove();
                    }
                }, 10000); // 10秒后消失
            }

            // 保存当前版本
            localStorage.setItem('chiangmai_app_version', APP_VERSION);

            console.log('📦 当前应用版本:', APP_VERSION);
            console.log('💡 提示: 如遇到显示问题，请强制刷新页面（Ctrl+Shift+R 或 Cmd+Shift+R）');
        }

        // =====================================================
        // 安全工具：HTML净化（防止XSS攻击）
        // =====================================================

        /**
         * 净化HTML，防止XSS攻击
         * 仅允许安全的HTML标签和属性
         * @param {string} html - 需要净化的HTML字符串
         * @returns {string} - 净化后的安全HTML
         */
        function sanitizeHTML(html) {
            if (!html || typeof html !== 'string') {
                return '';
            }

            // 创建临时DOM元素进行解析
            const temp = document.createElement('div');
            temp.innerHTML = html;

            // 允许的安全标签白名单
            const allowedTags = new Set([
                'p', 'br', 'strong', 'b', 'em', 'i', 'u',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'ul', 'ol', 'li',
                'a', 'span', 'div',
                'blockquote', 'code', 'pre'
            ]);

            // 允许的安全属性白名单
            const allowedAttributes = {
                'a': ['href', 'title', 'target'],
                'span': ['class'],
                'div': ['class'],
                'p': ['class']
            };

            // 危险协议黑名单（用于href）
            const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];

            /**
             * 递归净化元素及其子元素
             */
            function sanitizeElement(element) {
                // 检查标签是否在白名单中
                if (!allowedTags.has(element.tagName.toLowerCase())) {
                    // 不允许的标签，提取文本内容
                    const text = element.textContent;
                    element.replaceWith(document.createTextNode(text));
                    return;
                }

                // 检查属性
                const attrs = Array.from(element.attributes);
                attrs.forEach(attr => {
                    const tagName = element.tagName.toLowerCase();
                    const allowed = allowedAttributes[tagName];

                    // 如果该标签不允许任何属性，或者该属性不在白名单中
                    if (!allowed || !allowed.includes(attr.name)) {
                        element.removeAttribute(attr.name);
                    } else if (attr.name === 'href') {
                        // 特别检查href属性，防止javascript:等危险协议
                        const value = attr.value.toLowerCase();
                        if (dangerousProtocols.some(protocol => value.trim().startsWith(protocol))) {
                            element.removeAttribute(attr.name);
                        }
                    }
                });

                // 递归处理子元素
                const children = Array.from(element.childNodes);
                children.forEach(child => {
                    if (child.nodeType === Node.ELEMENT_NODE) {
                        sanitizeElement(child);
                    }
                });
            }

            // 净化所有子元素
            Array.from(temp.childNodes).forEach(child => {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    sanitizeElement(child);
                }
            });

            return temp.innerHTML;
        }

        /**
         * 转义HTML特殊字符（最安全的方案，移除所有HTML）
         * @param {string} text - 需要转义的文本
         * @returns {string} - 转义后的安全文本
         */
        function escapeHTML(text) {
            if (!text || typeof text !== 'string') {
                return '';
            }
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // =====================================================
        // 性能优化工具
        // =====================================================

        /**
         * API缓存管理器
         * 减少重复的网络请求，提升性能
         */
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
        const ErrorTracker = {
            config: {
                enabled: true,
                maxErrors: 50,
                reportUrl: null, // 配置错误上报URL
                environment: 'production'
            },
            errors: [],

            /**
             * 初始化错误追踪
             */
            init(config = {}) {
                Object.assign(this.config, config);

                // 全局错误捕获
                window.addEventListener('error', (event) => {
                    this.captureError(event.error || new Error(event.message), {
                        type: 'uncaughtError',
                        filename: event.filename,
                        lineno: event.lineno,
                        colno: event.colno
                    });
                });

                // 未处理的Promise rejection
                window.addEventListener('unhandledrejection', (event) => {
                    this.captureError(event.reason, {
                        type: 'unhandledRejection',
                        promise: true
                    });
                });

                console.log('✅ 错误追踪已启用');
            },

            /**
             * 捕获错误
             */
            captureError(error, context = {}) {
                if (!this.config.enabled) return;

                const errorInfo = {
                    message: error.message || String(error),
                    stack: error.stack,
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    context: context
                };

                // 保存到本地
                this.errors.push(errorInfo);
                if (this.errors.length > this.config.maxErrors) {
                    this.errors.shift(); // 保持最大数量
                }

                // 输出到控制台
                console.error('❌ Error captured:', errorInfo);

                // 上报到服务器（如果配置了）
                if (this.config.reportUrl) {
                    this.reportError(errorInfo);
                }

                // 性能告警检查
                AlertSystem.checkErrorRate();
            },

            /**
             * 上报错误到服务器
             */
            async reportError(errorInfo) {
                try {
                    await fetch(this.config.reportUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(errorInfo)
                    });
                } catch (e) {
                    console.warn('错误上报失败:', e);
                }
            },

            /**
             * 获取所有错误
             */
            getErrors() {
                return this.errors;
            },

            /**
             * 清空错误日志
             */
            clearErrors() {
                this.errors = [];
            }
        };

        /**
         * Google Analytics集成框架
         * 支持GA4配置
         */
        const Analytics = {
            config: {
                enabled: false, // 默认禁用，需要配置
                trackingId: null, // GA_MEASUREMENT_ID (G-XXXXXXXXXX)
                debug: false
            },

            /**
             * 初始化Analytics
             */
            init(config = {}) {
                Object.assign(this.config, config);

                if (!this.config.enabled || !this.config.trackingId) {
                    console.log('ℹ️  Analytics未配置，跳过初始化');
                    return;
                }

                // 动态加载gtag.js
                (function() {
                    const script = document.createElement('script');
                    script.async = true;
                    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.trackingId}`;
                    document.head.appendChild(script);

                    script.onload = () => {
                        window.dataLayer = window.dataLayer || [];
                        window.gtag = function() {
                            window.dataLayer.push(arguments);
                        };
                        gtag('js', new Date());
                        gtag('config', this.config.trackingId);

                        console.log('✅ Google Analytics已初始化:', this.config.trackingId);
                    };
                })();

                if (this.config.debug) {
                    console.log('🐛 Analytics调试模式已启用');
                }
            },

            /**
             * 追踪页面浏览
             */
            trackPageView(pageTitle, pageLocation) {
                if (!this.config.enabled) return;
                gtag('event', 'page_view', {
                    page_title: pageTitle || document.title,
                    page_location: pageLocation || window.location.href
                });
            },

            /**
             * 追踪事件
             */
            trackEvent(eventName, parameters = {}) {
                if (!this.config.enabled) return;
                gtag('event', eventName, parameters);
                console.log('📊 Analytics Event:', eventName, parameters);
            },

            /**
             * 追踪错误
             */
            trackError(errorMessage, errorUrl = window.location.href) {
                if (!this.config.enabled) return;
                gtag('event', 'exception', {
                    description: errorMessage,
                    fatal: false,
                    page_location: errorUrl
                });
            },

            /**
             * 追踪性能
             */
            trackPerformance(metricName, value, metricCategory = 'custom') {
                if (!this.config.enabled) return;
                gtag('event', metricName, {
                    value: value,
                    metric_category: metricCategory,
                    custom_map: { metric_category: 'metric_category' }
                });
            }
        };

        /**
         * 性能告警系统
         * 检测性能指标并触发告警
         */
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

                // 优先使用本地 JSON 文件（静态部署支持）
                let result;
                try {
                    const jsonResponse = await fetch('/data/items.json');
                    const jsonData = await jsonResponse.json();
                    result = { success: true, data: jsonData };
                    console.log('✅ 从本地 JSON 文件加载活动数据');
                } catch (jsonError) {
                    console.log('⚠️ JSON 文件加载失败，尝试使用 API（本地开发模式）', jsonError);
                    // 如果 JSON 文件不存在，尝试使用 API（本地开发）
                    result = await APICache.fetch('/api/activities?limit=1000');
                }

                PerfMonitor.end('fetchActivities');

                if (result.success && result.data) {
                    // 处理活动数据：为每个星期创建单独的活动副本
                    // 同时过滤掉暂停和草稿状态的活动
                allActivities = [];
                result.data.forEach(item => {
                    // 过滤掉非"进行中"状态的活动
                    if (item.status !== '进行中') {
                        console.log('🚫 过滤活动:', item.title, '状态:', item.status);
                        return; // 跳过非"进行中"状态的活动（已暂停、草稿等）
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

            // 2. 如果有选中日期，将其移到最前面
            let dayKeys = Object.keys(groupedByDay).map(Number).filter(day => !isNaN(day)).sort((a, b) => a - b);
            if (selectedDay !== null && groupedByDay[selectedDay]) {
                dayKeys = dayKeys.filter(k => k !== selectedDay);
                dayKeys.unshift(selectedDay);
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
                        ${isSelected ? `
                        <div class="day-group-header">
                            <div class="day-group-title">
                                <span class="day-icon">${getDayIcon(day)}</span>
                                <span class="day-name">${dayNames[day]}</span>
                                <span class="selected-badge">已选</span>
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

        // 辅助函数：获取日期图标
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
            filtered = filtered.filter(a => a.status !== '已暂停');
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
        let h5CalendarInitTimer = null; // 跟踪 updateCalendarView 中的 setTimeout

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

            const isMobile = window.innerWidth <= 768;

            if (currentFilters.day === day) {
                // 再次点击取消筛选，显示所有活动
                console.log('✋ 取消日期筛选');
                currentFilters.day = null;
                lastSelectedDay = null;

                // 🏛️ 切换回卡片态（仅在移动端）
                if (isMobile && window.UIStateManager) {
                    UIStateManager.switchState('ui-calendar');
                }

                // H5端：重新启用滚动自动选中
                if (isMobile) {
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

                // 🏛️ 切换到列表态（仅在移动端）
                if (isMobile && window.UIStateManager) {
                    UIStateManager.switchState('ui-list');
                }

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
            updateDateHighlightState();

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
                    searchInput.scrollIntoView({ behavior: 'smooth', block: 'start' }); /* ✅ 平滑滚动到搜索框 */
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

            // 更新移动端筛选状态

            // 更新日期高亮状态
            updateDateHighlightState();
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
                if (h5CalendarInitTimer) clearTimeout(h5CalendarInitTimer);
                h5CalendarInitTimer = setTimeout(() => {
                    h5CalendarInitTimer = null;
                    initH5ScrollAutoSelect(gridId);
                    // 同时初始化滚动日期高亮功能
                    initH5ScrollDateHighlight(gridId);
                }, 1000);
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

            // ✅ 状态优先级：selected > today > normal
            // 如果今天被选中，只表现为 selected，不显示 today 标记
            const shouldShowToday = isToday && !isSelectedDay;

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
                        <div style="font-size: 12px; color: #666; font-weight: 600;">${act.time || '灵活时间'}</div>
                    </div>
                `).join('');
            }

            return `
                <div class="day-cell ${shouldShowToday ? 'today' : ''} ${isSelectedDay ? 'selected-day' : ''} ${isDimmed ? 'dimmed' : ''}" data-day="${day}">
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
                // 优先使用本地 JSON 文件（静态部署支持）
                let result;
                try {
                    const jsonResponse = await fetch('/data/guide.json');
                    const jsonData = await jsonResponse.json();
                    result = { success: true, data: { content: jsonData.content || jsonData } };
                    console.log('✅ 从本地 JSON 文件加载攻略数据');
                } catch (jsonError) {
                    console.log('⚠️ JSON 文件加载失败，尝试使用 API（本地开发模式）', jsonError);
                    const response = await fetch('/api/guide');
                    result = await response.json();
                }

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
                case 3: // 灵活时间
                    totalInTab = allActivities.filter(a => a.flexibleTime === '是' || a.time === '灵活时间').length;
                    break;
                case 4: // 活动网站
                    totalInTab = new Set(allActivities.filter(a => a.source && a.source.url).map(a => a.originalId || a.id)).size;
                    break;
                case 5: // 攻略信息
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

        // 更新移动端筛选状态条
        /*
        function updateMobileFilterStatus() {
            if (!isMobile()) {
                document.getElementById('mobileFilterStatus').style.display = 'none';
                return;
            }

            const statusEl = document.getElementById('mobileFilterStatus');
            const categoryEl = document.getElementById('mobileCategoryStatus');
            const priceEl = document.getElementById('mobilePriceStatus');

            // 显示或隐藏状态条
            const hasFilter = currentFilters.category !== '全部' ||
                             currentFilters.price !== '全部' ||
                             currentFilters.day !== null;

            statusEl.style.display = hasFilter ? 'flex' : 'none';

            // 更新分类
            categoryEl.textContent = currentFilters.category;
            if (currentFilters.category === '全部') {
                categoryEl.style.color = '#999';
            } else {
                categoryEl.style.color = '#667eea';
            }

            // 更新价格
            priceEl.textContent = currentFilters.price;
            if (currentFilters.price === '全部') {
                priceEl.style.color = '#999';
            } else {
                priceEl.style.color = '#667eea';
            }
        }
        */

        function updateDateHighlightState() {
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

        let currentTab = 0; // 当前选中的Tab

        // =====================================================
        // Tab下拉菜单交互
        // =====================================================

        /**
         * 切换Tab下拉菜单的显示/隐藏
         */
        function toggleTabDropdown(event) {
            event.stopPropagation(); // 阻止事件冒泡
            const dropdown = document.getElementById('tabDropdown');
            dropdown.classList.toggle('show');
            console.log('📱 Tab下拉菜单:', dropdown.classList.contains('show') ? '展开' : '收起');
        }

        /**
         * 从下拉菜单切换Tab
         * @param {number} tabIndex - Tab索引（4或5）
         */
        function switchTabFromDropdown(tabIndex) {
            // 关闭下拉菜单
            const dropdown = document.getElementById('tabDropdown');
            dropdown.classList.remove('show');

            // 切换Tab
            switchTab(tabIndex);
        }

        /**
         * 关闭Tab下拉菜单
         */
        function closeTabDropdown() {
            const dropdown = document.getElementById('tabDropdown');
            if (dropdown) {
                dropdown.classList.remove('show');
            }
        }

        // 点击页面其他地方关闭下拉菜单
        document.addEventListener('click', function(event) {
            const dropdown = document.getElementById('tabDropdown');
            const moreButton = document.querySelector('.tab-more');
            if (dropdown && moreButton) {
                if (!dropdown.contains(event.target) && !moreButton.contains(event.target)) {
                    closeTabDropdown();
                }
            }
        });

        // =====================================================
        // Tab切换
        // =====================================================

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
            currentFilters.day = null;
            lastSelectedDay = null;
            document.getElementById('searchInput').value = '';

            // 清理 H5 滚动自动选中，防止 updateViews 重新触发 day 自动选择
            if (h5ScrollObserver) {
                h5ScrollObserver.disconnect();
                h5ScrollObserver = null;
            }
            if (h5AutoSelectTimeout) {
                clearTimeout(h5AutoSelectTimeout);
                h5AutoSelectTimeout = null;
            }
            if (h5CalendarInitTimer) {
                clearTimeout(h5CalendarInitTimer);
                h5CalendarInitTimer = null;
            }

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

            // 处理暂停提示
            const modalSuspension = document.getElementById('modalSuspension');
            const modalSuspensionText = document.getElementById('modalSuspensionText');
            if (modalSuspension && modalSuspensionText) {
                if (activity.suspensionNote) {
                    modalSuspension.style.display = 'flex';
                    modalSuspensionText.textContent = activity.suspensionNote;
                } else {
                    modalSuspension.style.display = 'none';
                }
            }

            // 存储当前活动用于分享
            window._currentActivity = activity;

            // 处理链接按钮
            const modalFooter = document.getElementById('modalFooter');
            const modalLinkButton = document.getElementById('modalLinkButton');

            if (modalFooter && modalLinkButton) {
                const url = activity.source?.url;
                if (url && url.trim() !== '') {
                    modalFooter.style.display = 'flex'; /* ✅ 修复：保持 flex 布局 */
                    modalLinkButton.href = url.trim();
                    modalLinkButton.style.display = '';
                } else {
                    modalLinkButton.style.display = 'none';
                    modalFooter.style.display = 'flex';
                }
            }

            const modal = document.getElementById('activityModal');
            if (modal) {
                modal.classList.add('active');
                /* ✅ 锁定背景滚动（iOS 需要 position:fixed 才能完全阻止） */
                document.body.dataset.scrollY = window.scrollY;
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.top = `-${window.scrollY}px`;
                document.body.style.width = '100%';
            }
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

        function closeModal() {
            document.getElementById('activityModal').classList.remove('active');
            /* ✅ 恢复背景滚动和滚动位置 */
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            const scrollY = document.body.dataset.scrollY || '0';
            window.scrollTo(0, parseInt(scrollY, 10));
            delete document.body.dataset.scrollY;
        }
        window.closeModal = closeModal;

        // 分享活动
        function shareActivity() {
            const a = window._currentActivity;
            if (!a) return;
            const shareText = `${a.title}\n📍 ${a.location || ''}\n💰 ${a.price || ''}\n🕐 ${a.time || ''}\n\n来自清迈活动指南`;
            if (navigator.share) {
                navigator.share({ title: a.title, text: shareText, url: window.location.href }).catch(() => {});
            } else if (navigator.clipboard) {
                navigator.clipboard.writeText(shareText).then(() => {
                    const btn = document.querySelector('.btn-share');
                    if (btn) { btn.textContent = '✓ 已复制'; setTimeout(() => { btn.textContent = '📤 分享'; }, 2000); }
                }).catch(() => {});
            }
        }
        window.shareActivity = shareActivity;

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
                // ✅ 状态优先级：selected > today > normal
                // 如果今天被选中，不显示 today-header 标记
                const isToday = dateInfo.isToday;
                const isSelected = currentFilters.day === dateInfo.day;
                const shouldShowToday = isToday && !isSelected;
                const todayClass = shouldShowToday ? ' today-header' : '';

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
        async function initApp() {
            // 检查应用版本（在所有初始化之前）
            await checkAppVersion();

            // 更新日期表头
            updateDateHeaders('dateGridHeader');
            updateDateHeaders('dateGridHeaderMarket');
            updateDateHeaders('dateGridHeaderMusic');

            // 获取活动数据
            fetchActivities();

            // 搜索输入框回车监听
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        performSearch();
                    }
                });
            }
        }

        // 立即执行初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initApp);
        } else {
            // DOM 已经准备好，直接初始化
            initApp();
        }

        // =====================================================
        // 移动端筛选交互
        // =====================================================

        // 检测是否为移动端
        function isMobile() {
            return window.innerWidth <= 768;
        }

        // 初始化移动端筛选按钮
        function initMobileFilter() {
            const btn = document.getElementById('filterToggleBtn');
            if (isMobile()) {
                btn.style.display = 'flex';
            } else {
                btn.style.display = 'none';
            }
        }

        // 切换筛选器展开/折叠
        function toggleMobileFilter() {
            const filterSection = document.querySelector('.filter-section');
            const btn = document.getElementById('filterToggleBtn');
            const icon = document.getElementById('filterIcon');

            filterSection.classList.toggle('expanded');
            const isExpanded = filterSection.classList.contains('expanded');

            // 移除active类的切换
            // btn.classList.toggle('active', isExpanded);
            icon.textContent = isExpanded ? '✕' : '⚙️';

            // 触觉反馈
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }

            // 更新按钮提示
            btn.title = isExpanded ? '收起筛选' : '展开筛选';
        }

        // 页面加载时初始化
        document.addEventListener('DOMContentLoaded', function() {
            initMobileFilter();

            // 监听窗口大小变化
            let resizeTimeout;
            window.addEventListener('resize', function() {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(initMobileFilter, 250);
            });

            // Tab栏滚动阴影效果
            const tabsNav = document.querySelector('.tabs-nav');
            if (tabsNav) {
                window.addEventListener('scroll', function() {
                    if (window.scrollY > 10) {
                        tabsNav.classList.add('scrolled');
                    } else {
                        tabsNav.classList.remove('scrolled');
                    }
                });
            }
        });

        // =====================================================
        // 移动端优化功能
        // =====================================================

        // 1. Bottom Sheet 筛选组件
        const filterSheet = {
            element: null,
            overlay: null,
            content: null,
            handle: null,
            startY: 0,
            currentY: 0,
            isDragging: false,

            init() {
                this.element = document.getElementById('filterSheet');
                this.overlay = this.element.querySelector('.sheet-overlay');
                this.content = this.element.querySelector('.sheet-content');
                this.handle = document.getElementById('sheetHandle');
                this.setupGestures();
            },

            setupGestures() {
                // 触摸开始
                this.handle.addEventListener('touchstart', (e) => {
                    this.startY = e.touches[0].clientY;
                    this.isDragging = true;
                    this.content.style.transition = 'none';
                }, { passive: true });

                // 触摸移动
                this.handle.addEventListener('touchmove', (e) => {
                    if (!this.isDragging) return;
                    this.currentY = e.touches[0].clientY;
                    const deltaY = this.currentY - this.startY;

                    if (deltaY > 0) {
                        const translate = Math.min(deltaY, window.innerHeight * 0.85);
                        this.content.style.transform = `translateY(${translate}px)`;
                    }
                }, { passive: true });

                // 触摸结束
                this.handle.addEventListener('touchend', () => {
                    if (!this.isDragging) return;
                    this.isDragging = false;
                    this.content.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

                    const deltaY = this.currentY - this.startY;
                    if (deltaY > 100) {
                        this.close();
                    } else {
                        this.content.style.transform = 'translateY(0)';
                    }
                });
            },

            open() {
                this.element.classList.add('active');
                document.body.style.overflow = 'hidden';

                // 触觉反馈
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
            },

            close() {
                this.element.classList.remove('active');
                document.body.style.overflow = '';
            }
        };

        function openFilterSheet() {
            filterSheet.init();
            filterSheet.open();
        }

        function closeFilterSheet() {
            filterSheet.close();
        }

        // =====================================================
        // Tab Bottom Sheet（与筛选保持一致）
        // =====================================================

        // 创建Tab Sheet对象
        const tabSheet = {
            element: null,
            content: null,
            handle: null,
            startY: 0,        /* ✅ 初始化手势追踪变量 */
            currentY: 0,
            isDragging: false,

            init() {
                this.element = document.getElementById('tabSheet');
                this.content = this.element.querySelector('.sheet-content');
                this.handle = document.getElementById('tabSheetHandle');
                this.setupGestures();
            },

            setupGestures() {
                // 触摸开始
                this.handle.addEventListener('touchstart', (e) => {
                    this.startY = e.touches[0].clientY;
                    this.isDragging = true;
                    this.content.style.transition = 'none';
                }, { passive: true });

                // 触摸移动
                this.handle.addEventListener('touchmove', (e) => {
                    if (!this.isDragging) return;
                    this.currentY = e.touches[0].clientY;
                    const deltaY = this.currentY - this.startY;

                    if (deltaY > 0) {
                        const translate = Math.min(deltaY, window.innerHeight * 0.85);
                        this.content.style.transform = `translateY(${translate}px)`;
                    }
                }, { passive: true });

                // 触摸结束
                this.handle.addEventListener('touchend', () => {
                    if (!this.isDragging) return;
                    this.isDragging = false;
                    this.content.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

                    const deltaY = this.currentY - this.startY;
                    if (deltaY > 100) {
                        this.close();
                    } else {
                        this.content.style.transform = 'translateY(0)';
                    }
                });
            },

            open() {
                if (!this.element) this.init();
                this.element.classList.add('active');
                document.body.style.overflow = 'hidden';

                // 更新当前选中状态
                this.updateActiveState();

                // 触觉反馈
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
            },

            close() {
                if (!this.element) return;
                this.element.classList.remove('active');
                document.body.style.overflow = '';
            },

            updateActiveState() {
                // 移除所有active类
                const allOptions = this.element.querySelectorAll('.tab-option-item');
                allOptions.forEach(option => option.classList.remove('active'));

                // 添加当前选中Tab的active类
                const currentOption = this.element.querySelectorAll('.tab-option-item')[currentTab];
                if (currentOption) {
                    currentOption.classList.add('active');
                }
            }
        };

        function openTabSheet() {
            tabSheet.init();
            tabSheet.open();
        }

        function closeTabSheet() {
            tabSheet.close();
        }

        /**
         * 从Tab Sheet切换Tab并关闭弹窗
         * @param {number} tabIndex - Tab索引（0-5）
         */
        function switchTabAndClose(tabIndex) {
            console.log('🔄 从Tab Sheet切换到Tab', tabIndex);

            // 切换Tab
            switchTab(tabIndex);

            // 关闭Tab Sheet
            closeTabSheet();
        }

        // 筛选选项选择
        const selectedFilters = {
            category: 'all',
            price: 'all'
        };

        function selectFilterOption(element, type) {
            // 移除同组其他选项的选中状态
            const group = element.parentElement;
            group.querySelectorAll('.filter-option-item').forEach(item => {
                item.classList.remove('selected');
            });

            // 选中当前选项
            element.classList.add('selected');
            selectedFilters[type] = element.dataset.value;

            // 触觉反馈
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }

            // 更新筛选计数
            updateFilterCount();
        }

        function updateFilterCount() {
            let count = 0;
            if (selectedFilters.category !== 'all') count++;
            if (selectedFilters.price !== 'all') count++;

            const filterCount = document.getElementById('filterCount');
            filterCount.textContent = count;
            filterCount.classList.toggle('show', count > 0);
        }

        function resetFilters() {
            selectedFilters.category = 'all';
            selectedFilters.price = 'all';

            // 重置UI
            document.querySelectorAll('.filter-option-item').forEach(item => {
                item.classList.remove('selected');
                if (item.dataset.value === 'all') {
                    item.classList.add('selected');
                }
            });

            updateFilterCount();
            console.log('✅ 筛选已重置');
        }

        function applyFilters() {
            closeFilterSheet();

            console.log('应用筛选:', selectedFilters);

            // 映射 Bottom Sheet 筛选值到 currentFilters
            const categoryMap = { 'all': '全部', 'class': '兴趣班', 'market': '市集' };
            const priceMap = { 'all': '全部', 'free': '免费', 'paid': '付费' };

            currentFilters.category = categoryMap[selectedFilters.category] || '全部';
            currentFilters.price = priceMap[selectedFilters.price] || '全部';

            // 更新顶部筛选 chip 的 active 状态
            document.querySelectorAll('#categoryChips .filter-chip').forEach(chip => {
                chip.classList.toggle('active', chip.textContent.trim() === currentFilters.category);
            });
            document.querySelectorAll('.filter-group .filter-chips').forEach(group => {
                if (group.querySelector('[onclick*="price"]')) {
                    group.querySelectorAll('.filter-chip').forEach(chip => {
                        chip.classList.toggle('active', chip.textContent.trim() === currentFilters.price);
                    });
                }
            });

            // 调用现有筛选函数
            filterActivities();

            console.log('✅ 筛选已应用:', currentFilters);
        }

        // 2. Toast 提示系统
        /*
        let toastTimeout = null;

        function showToast(message, type = 'info', duration = 2000) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.className = `toast ${type}`;

            // 清除之前的定时器
            if (toastTimeout) {
                clearTimeout(toastTimeout);
            }

            // 显示
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });

            // 自动隐藏
            toastTimeout = setTimeout(() => {
                toast.classList.remove('show');
            }, duration);
        }
        */

        // 3. Dialog 确认弹窗
        // function showDialog(title, message, onConfirm, onCancel) { ... }

        // 4. Loading 加载状态
        /*
        const loading = {
            element: null,
            textElement: null,

            init() {
                this.element = document.getElementById('loadingOverlay');
                this.textElement = this.element.querySelector('.loading-text');
            },

            show(text = '加载中...') {
                this.init();
                this.textElement.textContent = text;
                this.element.classList.add('active');
            },

            hide() {
                if (this.element) {
                    this.element.classList.remove('active');
                }
            }
        };

        function showLoading(text = '加载中...') {
            loading.show(text);
        }

        function hideLoading() {
            loading.hide();
        }
        */

        // 5. 下拉刷新
        /*
        const pullToRefresh = {
            startY: 0,
            currentY: 0,
            isPulling: false,
            isLoading: false,
            indicator: null,
            icon: null,
            text: null,
            threshold: 80,

            init() {
                this.indicator = document.getElementById('pullIndicator');
                this.icon = document.getElementById('pullIcon');
                this.text = document.getElementById('pullText');

                if (!this.indicator) return;

                document.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
                document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
                document.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: true });
            },

            onTouchStart(e) {
                if (this.isLoading || window.scrollY > 0) return;
                this.startY = e.touches[0].clientY;
                this.isPulling = true;
            },

            onTouchMove(e) {
                if (!this.isPulling || this.isLoading || window.scrollY > 0) return;

                this.currentY = e.touches[0].clientY;
                const deltaY = this.currentY - this.startY;

                if (deltaY > 0) {
                    const progress = Math.min(deltaY / this.threshold, 1);

                    if (deltaY > 10) {
                        this.indicator.style.transform = `translateY(${Math.min(deltaY, this.threshold)}px)`;

                        if (deltaY >= this.threshold) {
                            this.icon.textContent = '↑';
                            this.text.textContent = '释放立即刷新';
                        } else {
                            this.icon.textContent = '↓';
                            this.text.textContent = '下拉刷新';
                        }
                    }
                }
            },

            onTouchEnd() {
                if (!this.isPulling) return;
                this.isPulling = false;

                const deltaY = this.currentY - this.startY;

                if (deltaY >= this.threshold) {
                    this.refresh();
                } else {
                    this.indicator.style.transform = '';
                }
            },

            refresh() {
                this.isLoading = true;
                this.indicator.classList.add('loading');
                this.icon.innerHTML = '<div class="refresh-spinner"></div>';
                this.text.textContent = '正在刷新...';

                // 触发刷新回调
                if (typeof onRefresh === 'function') {
                    onRefresh().finally(() => {
                        this.hide();
                    });
                } else {
                    // 默认刷新操作
                    setTimeout(() => {
                        this.hide();
                    }, 1500);
                }
            },

            hide() {
                this.isLoading = false;
                this.indicator.classList.remove('loading');
                this.indicator.style.transform = '';
                this.icon.textContent = '↓';
                this.text.textContent = '下拉刷新';
            }
        };

        // 初始化下拉刷新
        document.addEventListener('DOMContentLoaded', () => {
            pullToRefresh.init();
        });
        */

        // 刷新回调函数（可被覆盖）
        let onRefresh = null;

        function setRefreshCallback(callback) {
            onRefresh = callback;
        }

        // 6. 空状态显示
        function showEmptyState(container, options = {}) {
            const {
                icon = '🔍',
                title = '暂无内容',
                message = '当前没有可显示的内容'
            } = options;

            const emptyHTML = `
                <div class="empty-state active">
                    <div class="empty-icon">${icon}</div>
                    <div class="empty-title">${title}</div>
                    <div class="empty-message">${message}</div>
                </div>
            `;

            container.innerHTML = emptyHTML;
        }

        // 页面加载完成后初始化
        document.addEventListener('DOMContentLoaded', function() {
            // 初始化 Bottom Sheet
            filterSheet.init();

            // 🆕 初始化筛选弹窗分类（基于当前Tab）
            if (window.innerWidth <= 768) {
                updateFilterSheetCategories(currentTab);
                console.log('✅ 筛选弹窗分类初始化完成，Tab:', currentTab);
            }

            // 显示欢迎提示
            /*
            setTimeout(() => {
                if (window.CHIENGMAI_IS_MOBILE) {
                    showToast('👆 点击右下角按钮筛选活动', 'info', 3000);
                }
            }, 1000);
            */
        });

        // =====================================================
        // Tab自适应布局 (V2.0)
        // =====================================================

        /**
         * Tab自适应管理器
         * 根据屏幕宽度动态显示Tab数量
         */
        const TabLayoutManager = {
            tabs: [],
            moreButton: null,
            dropdown: null,
            avgTabWidth: 100, // 平均每个Tab的宽度（px）

            init() {
                this.tabs = Array.from(document.querySelectorAll('.tab-item:not(.tab-more)'));
                this.moreButton = document.querySelector('.tab-more');
                this.dropdown = document.getElementById('tabDropdown');

                console.log('📊 Tab布局初始化，Tab总数:', this.tabs.length);

                // 初始布局
                this.updateLayout();

                // 监听窗口大小变化（防抖）
                let resizeTimer;
                window.addEventListener('resize', () => {
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(() => this.updateLayout(), 200);
                });
            },

            /**
             * 计算可以显示的Tab数量
             */
            calculateVisibleTabs() {
                const tabsNav = document.querySelector('.tabs-nav');
                if (!tabsNav) return 6;

                const containerWidth = tabsNav.offsetWidth;
                const moreButtonWidth = this.moreButton ? 80 : 0;

                // 可用宽度 = 总宽度 - "更多"按钮宽度 - padding
                const availableWidth = containerWidth - moreButtonWidth - 20;

                // 可以显示的Tab数量
                const maxVisible = Math.floor(availableWidth / this.avgTabWidth);

                console.log(`📐 容器宽度: ${containerWidth}px, 可显示: ${maxVisible}个Tab`);

                return Math.min(maxVisible, this.tabs.length);
            },

            /**
             * 更新Tab布局
             */
            updateLayout() {
                const visibleCount = this.calculateVisibleTabs();
                const totalCount = this.tabs.length;

                console.log(`🔄 更新Tab布局: 显示${visibleCount}/${totalCount}个`);

                // 如果能显示全部Tab
                if (visibleCount >= totalCount) {
                    this.showAllTabs();
                } else {
                    // 显示部分Tab + "更多"按钮
                    this.showPartialTabs(visibleCount);
                }
            },

            /**
             * 显示全部Tab（隐藏"更多"）
             */
            showAllTabs() {
                this.tabs.forEach(tab => {
                    tab.style.display = '';
                });

                if (this.moreButton) {
                    this.moreButton.style.display = 'none';
                }

                console.log('✅ 显示全部Tab，隐藏"更多"按钮');
            },

            /**
             * 显示部分Tab + "更多"按钮
             */
            showPartialTabs(visibleCount) {
                this.tabs.forEach((tab, index) => {
                    if (index < visibleCount) {
                        tab.style.display = '';
                    } else {
                        tab.style.display = 'none';
                    }
                });

                if (this.moreButton) {
                    this.moreButton.style.display = '';
                }

                this.updateDropdown(visibleCount);

                console.log(`✅ 显示前${visibleCount}个Tab + "更多"按钮`);
            },

            /**
             * 更新下拉菜单内容
             */
            updateDropdown(visibleCount) {
                if (!this.dropdown) return;

                const hiddenTabs = this.tabs.slice(visibleCount);
                const currentDropdownItems = this.dropdown.querySelectorAll('.dropdown-item');

                // 清空现有菜单项
                currentDropdownItems.forEach(item => item.remove());

                // 添加隐藏的Tab到菜单
                hiddenTabs.forEach((tab, index) => {
                    const tabIndex = visibleCount + index;
                    const icon = tab.querySelector('.tab-icon')?.textContent || '';
                    const text = tab.querySelector('span:not(.tab-icon)')?.textContent || '';

                    const item = document.createElement('div');
                    item.className = 'dropdown-item';
                    item.innerHTML = `
                        <span class="dropdown-icon">${icon}</span>
                        <span>${text}</span>
                    `;
                    item.onclick = () => {
                        switchTab(tabIndex);
                        closeTabDropdown();
                    };

                    this.dropdown.appendChild(item);
                });

                console.log(`📋 下拉菜单更新，包含${hiddenTabs.length}个项目`);
            }
        };

        // 初始化Tab布局管理器
        document.addEventListener('DOMContentLoaded', () => {
            TabLayoutManager.init();  // 立即初始化，不等待
        });

