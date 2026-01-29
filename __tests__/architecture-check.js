/**
 * 四层架构自动检测脚本
 * 检测项目是否符合架构规范
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// 检测结果
const results = {
    index: { status: 'pending', issues: [], warnings: [] },
    layout: { status: 'pending', issues: [], warnings: [] },
    page: { status: 'pending', issues: [], warnings: [] },
    component: { status: 'pending', issues: [], warnings: [] }
};

console.log('🏗️ 四层架构自动检测开始\n');
console.log('='.repeat(60));

// ============================================
// ① index 层检测
// ============================================
console.log('\n📄 ① index 层检测');
console.log('-'.repeat(60));

try {
    const indexPath = join(projectRoot, 'public/index.html');
    const indexContent = readFileSync(indexPath, 'utf-8');
    const lines = indexContent.split('\n');

    // 检查 1: 文件行数
    if (lines.length > 30) {
        results.index.issues.push(`❌ index.html 行数过多: ${lines.length} 行 (应 < 30 行)`);
    } else {
        console.log(`✅ 文件行数: ${lines.length} 行`);
    }

    // 检查 2: 功能性 DOM
    const forbiddenDOM = ['toast', 'dialog', 'loading', 'modal', 'calendarGrid', 'filterSection'];
    const foundForbidden = forbiddenDOM.filter(id => indexContent.includes(`id="${id}"`) || indexContent.includes(`id='${id}'`));

    if (foundForbidden.length > 0) {
        results.index.issues.push(`❌ 发现功能性 DOM: ${foundForbidden.join(', ')}`);
    } else {
        console.log('✅ 无功能性 DOM');
    }

    // 检查 3: 内联脚本
    const inlineScriptMatches = indexContent.match(/<script[^>]*>[\s\S]*?<\/script>/g) || [];
    const externalScripts = inlineScriptMatches.filter(s => s.includes('src='));
    if (inlineScriptMatches.length > externalScripts.length) {
        results.index.issues.push(`❌ 发现内联脚本: ${inlineScriptMatches.length - externalScripts.length} 处`);
    } else {
        console.log(`✅ 无内联脚本 (${externalScripts.length} 个外部脚本)`);
    }

    // 检查 4: 内联样式
    if (indexContent.includes('style="')) {
        results.index.issues.push('❌ 发现内联样式 (style="")');
    } else {
        console.log('✅ 无内联样式');
    }

    // 检查 5: 业务文案
    const businessTerms = ['周一', '周二', '活动', '筛选', '搜索', '已移除', '不再使用'];
    const foundTerms = businessTerms.filter(term => indexContent.includes(term));
    if (foundTerms.length > 0) {
        results.index.warnings.push(`⚠️  HTML 中出现业务词汇: ${foundTerms.join(', ')}`);
    }

    // 检查 6: 注释规范
    const chineseCommentMatches = indexContent.match(/<!--[^>]*[\u4e00-\u9fa5]+[^>]*-->/g) || [];
    if (chineseCommentMatches.length > 0) {
        results.index.warnings.push(`⚠️  发现中文注释: ${chineseCommentMatches.length} 处`);
    }

    // 检查 7: 必备元素
    if (!indexContent.includes('<div id="app"></div>')) {
        results.index.issues.push('❌ 缺少挂载点 <div id="app"></div>');
    } else {
        console.log('✅ 存在挂载点 <div id="app"></div>');
    }

    results.index.status = results.index.issues.length === 0 ? '✅ 通过' : '❌ 失败';

} catch (error) {
    results.index.issues.push(`❌ 检测失败: ${error.message}`);
    results.index.status = '❌ 失败';
}

// ============================================
// ② layout 层检测
// ============================================
console.log('\n🏗️  ② layout 层检测 (app.js)');
console.log('-'.repeat(60));

try {
    const appPath = join(projectRoot, 'src/js/app.js');
    const appContent = readFileSync(appPath, 'utf-8');

    // 检查 1: 是否 fetch 数据
    if (appContent.includes('fetch(')) {
        results.layout.issues.push('❌ Layout 层不应该 fetch 数据');
    } else {
        console.log('✅ 无数据获取逻辑');
    }

    // 检查 2: 是否有业务判断
    const businessLogic = ['周一', '周二', 'filter(', 'sort(', 'reduce('];
    const foundLogic = businessLogic.filter(pattern => appContent.includes(pattern));
    if (foundLogic.length > 0) {
        results.layout.issues.push(`❌ 发现业务逻辑: ${foundLogic.join(', ')}`);
    } else {
        console.log('✅ 无业务逻辑');
    }

    // 检查 3: 是否处理活动数据
    if (appContent.includes('activities') && !appContent.includes('//')) {
        results.layout.issues.push('❌ Layout 层不应该处理活动数据');
    } else {
        console.log('✅ 不处理活动数据');
    }

    results.layout.status = results.layout.issues.length === 0 ? '✅ 通过' : '❌ 失败';

} catch (error) {
    results.layout.issues.push(`❌ 检测失败: ${error.message}`);
    results.layout.status = '❌ 失败';
}

// ============================================
// ③ component 层检测
// ============================================
console.log('\n🧩 ③ component 层检测 (src/js/components/)');
console.log('-'.repeat(60));

try {
    const componentsDir = join(projectRoot, 'src/js/components');
    const files = readdirSync(componentsDir).filter(f => f.endsWith('.js'));

    files.forEach(file => {
        const filePath = join(componentsDir, file);
        const content = readFileSync(filePath, 'utf-8');
        const fileName = file.replace('.js', '');

        // 检查 1: 是否 fetch 数据
        if (content.includes('fetch(') || content.includes('axios.')) {
            results.component.issues.push(`❌ ${fileName}.js: 组件不应该 fetch 数据`);
        }

        // 检查 2: 是否依赖全局变量
        const globalPatterns = ['window.', 'localStorage', 'sessionStorage'];
        const foundGlobals = globalPatterns.filter(pattern => content.includes(pattern));
        if (foundGlobals.length > 0) {
            results.component.issues.push(`❌ ${fileName}.js: 使用全局变量: ${foundGlobals.join(', ')}`);
        }

        // 检查 3: 是否有业务判断
        if (content.includes('new Date()') || content.includes('getDay()')) {
            results.component.issues.push(`❌ ${fileName}.js: 组件不应该处理日期逻辑`);
        }

        // 检查 4: 是否有硬编码文案
        const hardcodedText = content.match(/[\u4e00-\u9fa5]{10,}/g);
        if (hardcodedText && hardcodedText.length > 5) {
            results.component.warnings.push(`⚠️  ${fileName}.js: 可能有硬编码中文文案`);
        }
    });

    if (results.component.issues.length === 0) {
        console.log('✅ 组件层检测通过');
    }

    results.component.status = results.component.issues.length === 0 ? '✅ 通过' : '❌ 失败';

} catch (error) {
    results.component.issues.push(`❌ 检测失败: ${error.message}`);
    results.component.status = '❌ 失败';
}

// ============================================
// 汇总结果
// ============================================
console.log('\n' + '='.repeat(60));
console.log('📊 检测结果汇总');
console.log('='.repeat(60));

const layers = ['index', 'layout', 'page', 'component'];
let totalIssues = 0;
let totalWarnings = 0;

layers.forEach(layer => {
    const result = results[layer];
    const issuesCount = result.issues.length;
    const warningsCount = result.warnings.length;
    totalIssues += issuesCount;
    totalWarnings += warningsCount;

    console.log(`\n${result.status} ${layer.toUpperCase()} 层`);
    if (issuesCount > 0) {
        result.issues.forEach(issue => console.log(`  ${issue}`));
    }
    if (warningsCount > 0) {
        result.warnings.forEach(warning => console.log(`  ${warning}`));
    }
    if (issuesCount === 0 && warningsCount === 0) {
        console.log('  ✅ 完全符合规范');
    }
});

console.log('\n' + '='.repeat(60));
console.log(`总计: ${totalIssues} 个问题, ${totalWarnings} 个警告`);
console.log('='.repeat(60));

// 返回退出码
process.exit(totalIssues > 0 ? 1 : 0);
