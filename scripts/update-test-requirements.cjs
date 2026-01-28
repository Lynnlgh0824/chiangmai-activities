#!/usr/bin/env node

/**
 * 测试需求自动更新脚本
 * 扫描实际代码实现，更新测试脚本以匹配实际功能
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 测试需求自动更新工具\n');
console.log('=' .repeat(70));

// 读取index.html
const indexPath = path.join(__dirname, '..', 'public', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

// 分析结果
const findings = {
    mobile: {},
    pc: {},
    shared: {}
};

// ==================== 扫描函数 ====================

/**
 * 扫描CSS媒体查询
 */
function scanMediaQueries() {
    const mediaQueries = {
        mobile: [],
        pc: []
    };

    // 查找所有@media规则
    const mediaRegex = /@media\s+(?:not\s+)?(?:only\s+)?[\w\s\(\)\-:\.]+?\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g;
    const matches = html.match(mediaRegex) || [];

    matches.forEach(match => {
        if (match.includes('max-width: 768px') || match.includes('max-width: 374px')) {
            mediaQueries.mobile.push(match.substring(0, 100) + '...');
        } else if (match.includes('min-width')) {
            mediaQueries.pc.push(match.substring(0, 100) + '...');
        }
    });

    return mediaQueries;
}

/**
 * 扫描移动端特有功能
 */
function scanMobileFeatures() {
    const features = {
        deviceDetection: {
            hasUserAgentCheck: html.includes('navigator.userAgent'),
            hasIsMobile: html.includes('isMobile'),
            hasModeH5: html.includes('mode-h5'),
            score: 0
        },
        viewport: {
            hasDeviceWidth: html.includes('width=device-width'),
            hasViewportMeta: html.includes('name="viewport"'),
            score: 0
        },
        header: {
            hasFixedPosition: html.includes('position: fixed') && html.includes('.header'),
            hasHiddenTitle: html.includes('.header h1') && html.includes('display: none'),
            noBorderRadius: html.includes('border-radius: 0'),
            noBoxShadow: html.includes('box-shadow: none'),
            score: 0
        },
        tabs: {
            hasHorizontalScroll: html.includes('overflow-x: auto') && html.includes('tabs-nav'),
            hasTouchScrolling: html.includes('-webkit-overflow-scrolling: touch'),
            hasMinTouchSize: html.includes('44px'),
            has6Tabs: (html.match(/switchTab\(\d\)/g) || []).length >= 6,
            score: 0
        },
        search: {
            hasIconOnly: html.includes('.search-btn') && html.includes('display: none'),
            hasTouchHeight: html.includes('min-height: 44px') && html.includes('search'),
            hasDebounce: html.includes('debounce') || html.includes('debouncedSearch'),
            score: 0
        },
        filter: {
            hasTightSpacing: html.includes('font-size: 11px') && html.includes('filter-chip'),
            hasVibrate: html.includes('navigator.vibrate'),
            hasVibrateCall: html.includes('vibrate(10)'),
            score: 0
        },
        modal: {
            hasMobileWidth: html.includes('width: 95vw') && html.includes('420px'),
            hasMobileHeight: html.includes('max-height: 85vh'),
            hasCenterAlign: html.includes('position: fixed'),
            score: 0
        },
        cssVars: {
            hasMobileOverride: html.includes('@media (max-width: 768px)') && html.includes(':root'),
            hasHalfSpacing: html.includes('--space-mobile-'),
            hasStandardSpacing: html.includes('--space-lg: 16px'),
            score: 0
        },
        performance: {
            hasInertialScroll: html.includes('-webkit-overflow-scrolling: touch'),
            hasWordBreak: html.includes('word-break') || html.includes('overflow-wrap'),
            score: 0
        },
        breakpoints: {
            has768px: html.includes('@media (max-width: 768px)'),
            has374px: html.includes('@media (max-width: 374px)'),
            score: 0
        }
    };

    // 计算得分
    Object.values(features).forEach(feature => {
        const values = Object.values(feature).filter(v => typeof v === 'boolean');
        feature.score = values.filter(v => v).length / values.length;
    });

    return features;
}

/**
 * 扫描PC端特有功能
 */
function scanPCFeatures() {
    const features = {
        deviceDetection: {
            hasModePC: html.includes('mode-pc'),
            hasCHIENGMAI_MODE: html.includes('CHIENGMAI_MODE'),
            score: 0
        },
        header: {
            hasRelativePosition: html.includes('position: relative') && html.includes('.header'),
            hasH1Title: html.includes('.header h1'),
            hasBorderRadius: html.includes('border-radius: 12px'),
            hasBoxShadow: html.includes('box-shadow: 0 2px 12px'),
            score: 0
        },
        tabs: {
            hasNoScroll: html.includes('overflow: hidden') && html.includes('tabs-nav'),
            hasStandardSize: html.includes('padding: 14px 24px') || html.includes('.tab-item'),
            hasHover: html.includes('.tab-item:hover'),
            score: 0
        },
        search: {
            hasMaxWidth: html.includes('max-width: 400px') && html.includes('search'),
            hasTextButton: html.includes('.search-btn') && (html.includes('display: flex') || !html.includes('display: none')),
            hasEnterKey: html.includes('addEventListener') && html.includes('keypress') && html.includes('Enter'),
            score: 0
        },
        list: {
            hasStandardHeight: html.includes('min-height: 120px'),
            hasStandardPadding: html.includes('padding: var(--space-lg)') || html.includes('padding: 20px'),
            hasHover: html.includes('.activity-card:hover') || html.includes('transform: translateY'),
            score: 0
        },
        modal: {
            hasFixedWidth: html.includes('max-width: 500px'),
            hasStandardHeight: html.includes('max-height: 80vh'),
            score: 0
        },
        cssVars: {
            hasStandardVars: html.includes('--space-xs: 4px') && html.includes('--space-lg: 16px'),
            hasPCOnlyVars: html.includes('--space-xl: 20px') || html.includes('--space-2xl: 24px'),
            score: 0
        },
        performance: {
            hasTransform: html.includes('transform'),
            hasTransition: html.includes('transition: all') || html.includes('transition: transform'),
            score: 0
        },
        largeScreen: {
            has1024px: html.includes('min-width: 1024px') || html.includes('max-width: 1200px'),
            has1920px: html.includes('min-width: 1920px') || html.includes('max-width: 1600px'),
            score: 0
        },
        mouse: {
            hasScroll: html.includes('overflow-y') || html.includes('overflow: auto'),
            hasInteraction: html.includes(':hover') && html.includes('onclick'),
            score: 0
        },
        filter: {
            hasStandardSize: html.includes('font-size: 13px') && html.includes('filter-chip'),
            hasHover: html.includes('.filter-chip:hover'),
            score: 0
        },
        keyboard: {
            hasTabSupport: html.includes('tabindex'),
            hasEnterKey: html.includes('key === \'Enter\'') || html.includes('e.key === \'Enter\''),
            score: 0
        },
        layout: {
            hasMaxWidth: html.includes('max-width: 1200px') || html.includes('.container'),
            score: 0
        }
    };

    // 计算得分
    Object.values(features).forEach(feature => {
        const values = Object.values(feature).filter(v => typeof v === 'boolean');
        feature.score = values.filter(v => v).length / values.length;
    });

    return features;
}

/**
 * 生成测试更新建议
 */
function generateUpdateSuggestions(mobileFeatures, pcFeatures) {
    const suggestions = {
        mobile: [],
        pc: []
    };

    // 移动端建议
    if (mobileFeatures.deviceDetection.score < 1) {
        suggestions.mobile.push('建议完善设备检测功能');
    }
    if (mobileFeatures.header.score < 0.8) {
        suggestions.mobile.push('建议检查移动端Header实现');
    }
    if (mobileFeatures.tabs.score < 0.8) {
        suggestions.mobile.push('建议优化Tab导航触摸体验');
    }
    if (mobileFeatures.search.score < 0.8) {
        suggestions.mobile.push('建议改进移动端搜索功能');
    }

    // PC端建议
    if (pcFeatures.header.score < 0.8) {
        suggestions.pc.push('建议检查PC端Header定位');
    }
    if (pcFeatures.tabs.score < 0.8) {
        suggestions.pc.push('建议优化PC端Tab尺寸');
    }
    if (pcFeatures.search.score < 0.8) {
        suggestions.pc.push('建议完善PC端搜索功能');
    }
    if (pcFeatures.modal.score < 0.8) {
        suggestions.pc.push('建议调整PC端弹窗宽度');
    }

    return suggestions;
}

/**
 * 生成更新报告
 */
function generateReport(mobileFeatures, pcFeatures, suggestions) {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalMobileFeatures: Object.keys(mobileFeatures).length,
            totalPCFeatures: Object.keys(pcFeatures).length,
            mobilePassRate: 0,
            pcPassRate: 0
        },
        mobile: {},
        pc: {},
        suggestions: suggestions
    };

    // 计算移动端通过率
    let mobileTotal = 0;
    let mobilePass = 0;
    Object.values(mobileFeatures).forEach(feature => {
        const values = Object.values(feature).filter(v => typeof v === 'boolean');
        mobileTotal += values.length;
        mobilePass += values.filter(v => v).length;
    });
    report.summary.mobilePassRate = Math.round((mobilePass / mobileTotal) * 100);
    report.mobile = mobileFeatures;

    // 计算PC端通过率
    let pcTotal = 0;
    let pcPass = 0;
    Object.values(pcFeatures).forEach(feature => {
        const values = Object.values(feature).filter(v => typeof v === 'boolean');
        pcTotal += values.length;
        pcPass += values.filter(v => v).length;
    });
    report.summary.pcPassRate = Math.round((pcPass / pcTotal) * 100);
    report.pc = pcFeatures;

    return report;
}

// ==================== 主程序 ====================

console.log('\n📊 扫描实际代码实现...\n');

// 扫描功能
const mobileFeatures = scanMobileFeatures();
const pcFeatures = scanPCFeatures();
const suggestions = generateUpdateSuggestions(mobileFeatures, pcFeatures);
const report = generateReport(mobileFeatures, pcFeatures, suggestions);

// 输出结果
console.log('📱 移动端功能扫描结果:\n');
Object.entries(mobileFeatures).forEach(([key, feature]) => {
    const score = Math.round(feature.score * 100);
    const status = score >= 80 ? '✅' : score >= 50 ? '⚠️' : '❌';
    console.log(`   ${status} ${key}: ${score}%`);
});

console.log('\n💻 PC端功能扫描结果:\n');
Object.entries(pcFeatures).forEach(([key, feature]) => {
    const score = Math.round(feature.score * 100);
    const status = score >= 80 ? '✅' : score >= 50 ? '⚠️' : '❌';
    console.log(`   ${status} ${key}: ${score}%`);
});

console.log('\n💡 优化建议:\n');
if (suggestions.mobile.length > 0) {
    console.log('   移动端:');
    suggestions.mobile.forEach(s => console.log(`   - ${s}`));
}
if (suggestions.pc.length > 0) {
    console.log('   PC端:');
    suggestions.pc.forEach(s => console.log(`   - ${s}`));
}
if (suggestions.mobile.length === 0 && suggestions.pc.length === 0) {
    console.log('   ✅ 所有功能实现良好，暂无优化建议');
}

console.log('\n' + '='.repeat(70));
console.log(`\n📊 总体评估:`);
console.log(`   移动端通过率: ${report.summary.mobilePassRate}%`);
console.log(`   PC端通过率: ${report.summary.pcPassRate}%`);
console.log(`   综合通过率: ${Math.round((report.summary.mobilePassRate + report.summary.pcPassRate) / 2)}%\n`);

// 保存报告
const reportPath = path.join(__dirname, '..', 'docs', 'TEST-UPDATE-REPORT.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`📄 详细报告已保存至: ${reportPath}\n`);

console.log('✅ 测试需求扫描完成！\n');
