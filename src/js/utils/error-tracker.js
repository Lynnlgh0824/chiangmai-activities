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