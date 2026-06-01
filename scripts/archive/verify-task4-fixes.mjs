#!/usr/bin/env node

/**
 * 验证Task 4的6个活动数据修正
 */

import fs from 'fs';

const JSON_FILE = './data/items.json';

console.log('🔍 验证Task 4数据修正...\n');

// 读取JSON
const items = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));

// 定义预期的修改
const expectedFixes = [
    {
        id: '0012',
        title: '声音疗愈',
        field: 'time',
        expected: '19:30-20:30',
        description: '时间修改为19:30-20:30'
    },
    {
        id: '0018',
        title: '攀岩',
        field: 'price',
        expected: '570泰铢/天（含装备）',
        description: '价格修改为570泰铢/天'
    },
    {
        id: '0022',
        title: '复古市集',
        field: 'weekdays',
        expected: ['周五'],
        description: '时间修改为每月第1个周五'
    },
    {
        id: '0057',
        title: '乌蒙寺禅修',
        field: 'price',
        expected: '约250泰铢/天（含食宿），需现金支付',
        description: '价格修改为250泰铢/天'
    },
    {
        id: '0058',
        title: '朗奔寺禅修',
        field: 'price',
        expected: '免费（捐赠形式），注册费500泰铢，课程费用包含食宿',
        description: '添加注册费500泰铢'
    },
    {
        id: '0067',
        title: '松德寺冥想',
        field: 'time',
        expected: '16:00-19:00',
        description: '时间修改为16:00-19:00'
    }
];

let allPassed = true;

expectedFixes.forEach((fix, index) => {
    const item = items.find(i => i.id === fix.id);

    if (!item) {
        console.log(`❌ ${index + 1}. 未找到活动 ${fix.id}`);
        allPassed = false;
        return;
    }

    const actualValue = item[fix.field];
    let passed = false;

    // 比较值
    if (Array.isArray(expectedFixes[index].expected)) {
        passed = JSON.stringify(actualValue) === JSON.stringify(fix.expected);
    } else {
        passed = actualValue === fix.expected;
    }

    if (passed) {
        console.log(`✅ ${index + 1}. ${fix.title} (${fix.id})`);
        console.log(`   ${fix.description}`);
        console.log(`   ✓ ${fix.field}: "${actualValue}"\n`);
    } else {
        console.log(`❌ ${index + 1}. ${fix.title} (${fix.id})`);
        console.log(`   ${fix.description}`);
        console.log(`   ✗ 预期: "${fix.expected}"`);
        console.log(`   ✗ 实际: "${actualValue}"\n`);
        allPassed = false;
    }
});

// 检查0060尊巴舞
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 检查0060尊巴舞时间...');

const item0060 = items.find(i => i.id === '0060');
if (item0060) {
    console.log(`活动: ${item0060.title}`);
    console.log(`时间: ${item0060.time}`);
    console.log(`星期: ${item0060.weekdays.join(', ')}`);

    const hasMonday = item0060.weekdays.includes('周一');
    const hasTuesday = item0060.weekdays.includes('周二');
    const hasThursday = item0060.weekdays.includes('周四');
    const hasSaturday = item0060.weekdays.includes('周六');

    if (hasMonday && hasTuesday && hasThursday && hasSaturday) {
        console.log('✅ 0060尊巴舞时间正确：周一、二、四、六\n');
    } else {
        console.log('⚠️ 0060尊巴舞时间可能需要确认\n');
    }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (allPassed) {
    console.log('✅ 所有数据修正验证通过！');
    console.log('\n📊 统计:');
    console.log(`  - 总验证项: ${expectedFixes.length}`);
    console.log(`  - 通过: ${expectedFixes.length}`);
    console.log(`  - 失败: 0`);
} else {
    console.log('❌ 部分数据修正验证失败，请检查！');
    process.exit(1);
}
