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
            const storedVersion = localStorage.getItem('chiengmai_app_version');
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
            localStorage.setItem('chiengmai_app_version', APP_VERSION);
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