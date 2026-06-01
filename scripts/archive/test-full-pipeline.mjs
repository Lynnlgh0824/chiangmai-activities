import fs from 'fs';

console.log('========================================');
console.log('   模拟前端完整执行流程');
console.log('========================================\n');

// 加载数据
const items = JSON.parse(fs.readFileSync('./data/items.json', 'utf-8'));
console.log('Step 1: API返回数据', items.length, '个');

// 模拟前端数据处理
function parseDaysFromWeekdays(weekdays) {
    if (!weekdays || !Array.isArray(weekdays)) return [];
    return weekdays.filter(w => w.day !== null && w.day !== undefined).map(w => w.day);
}

let allActivities = [];
items.forEach(item => {
    const days = parseDaysFromWeekdays(item.weekdays);

    if (days && days.length > 0) {
        days.forEach(day => {
            allActivities.push({
                id: item.id || item._id,
                originalId: item.id || item._id,
                title: item.title,
                category: item.category,
                time: item.time,
                day: day,
                source: item.source || null,
                flexibleTime: item.flexibleTime || '否'
            });
        });
    } else {
        allActivities.push({
            id: item.id || item._id,
            originalId: item.id || item._id,
            title: item.title,
            category: item.category,
            time: item.time,
            day: null,
            source: item.source || null,
            flexibleTime: item.flexibleTime || '否'
        });
    }
});

console.log('Step 2: 数据展开后', allActivities.length, '个活动记录\n');

// 模拟筛选流程
function filterActivities(tab, activities = allActivities) {
    let filtered = activities;

    console.log(`🔍 开始筛选 Tab ${tab}, 总数: ${filtered.length}`);

    switch(tab) {
        case 0: // 兴趣班 - 排除法
            const beforeTab0 = filtered.length;
            filtered = filtered.filter(a => {
                if (a.category === '市集') return false;
                if (a.flexibleTime === '是' || a.time === '灵活时间') return false;
                return true;
            });
            console.log(`📅 Tab 0 筛选: ${beforeTab0} → ${filtered.length}`);
            break;

        case 1: // 市集
            const beforeTab1 = filtered.length;
            filtered = filtered.filter(a => a.category === '市集');
            console.log(`📋 Tab 1 筛选: ${beforeTab1} → ${filtered.length}`);
            break;

        case 2: // 灵活时间
            const beforeTab2 = filtered.length;
            filtered = filtered.filter(a => a.flexibleTime === '是' || a.time === '灵活时间');
            console.log(`⏰ Tab 2 筛选: ${beforeTab2} → ${filtered.length}`);
            break;

        case 3: // 活动网站
            const beforeTab3 = filtered.length;
            filtered = filtered.filter(a => a.source && a.source.url && a.source.url.length > 0);
            // 去重
            const unique = new Set();
            filtered = filtered.filter(a => {
                const id = a.originalId || a.id;
                if (unique.has(id)) return false;
                unique.add(id);
                return true;
            });
            console.log(`🏪 Tab 3 筛选: ${beforeTab3} → ${filtered.length} (去重后)`);
            break;
    }

    return filtered;
}

// 测试每个Tab
console.log('========================================');
console.log('   测试所有Tab');
console.log('========================================\n');

for (let i = 0; i <= 3; i++) {
    console.log(`\n--- Tab ${i} ---`);
    const result = filterActivities(i);

    // 显示前5个活动
    console.log('前5个活动:');
    result.slice(0, 5).forEach((act, idx) => {
        console.log(`  ${idx+1}. ${act.title} (${act.category}) - ${act.time || '灵活时间'}`);
    });
    if (result.length > 5) {
        console.log(`  ... 还有 ${result.length - 5} 个`);
    }
}

console.log('\n========================================');
console.log('   总结');
console.log('========================================\n');

const tab0 = filterActivities(0);
const tab1 = filterActivities(1);
const tab2 = filterActivities(2);
const tab3 = filterActivities(3);

console.log(`Tab 0 兴趣班: ${tab0.length} 个`);
console.log(`Tab 1 市集: ${tab1.length} 个`);
console.log(`Tab 2 灵活时间: ${tab2.length} 个`);
console.log(`Tab 3 活动网站: ${tab3.length} 个`);

// 检查是否符合预期
const expected = [21, 17, 9, 23];
const actual = [tab0.length, tab1.length, tab2.length, tab3.length];
const match = expected.every((exp, i) => exp === actual[i]);

console.log('\n预期结果: [21, 17, 9, 23]');
console.log(`实际结果: [${actual.join(', ')}]`);
console.log(`是否匹配: ${match ? '✅ 是' : '❌ 否'}`);

if (!match) {
    console.log('\n差异分析:');
    expected.forEach((exp, i) => {
        if (exp !== actual[i]) {
            console.log(`  Tab ${i}: 预期 ${exp}, 实际 ${actual[i]}, 差异 ${actual[i] - exp}`);
        }
    });
}
