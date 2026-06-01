#!/usr/bin/env node

/**
 * 验证清理和修改结果
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const itemsJsonPath = path.join(__dirname, '../data/items.json');

// 读取数据
const items = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log('🔍 验证清理和修改结果\n');
console.log('=' .repeat(60));

// =====================================================
// 1. 验证删除重复
// =====================================================

console.log('\n1️⃣ 验证重复活动已删除\n');

const deletedIds = ['0021', '0047', '0048', '0052', '0036', '0055'];
const foundDeleted = deletedIds.filter(id => items.find(item => item.id === id));

if (foundDeleted.length === 0) {
  console.log('✅ 所有重复活动已成功删除');
  console.log(`   删除的ID: ${deletedIds.join(', ')}`);
} else {
  console.log(`❌ 仍有 ${foundDeleted.length} 个重复活动未删除:`);
  console.log(`   ${foundDeleted.join(', ')}`);
}

// =====================================================
// 2. 验证时间修正
// =====================================================

console.log('\n2️⃣ 验证时间修正\n');

const timeFixes = [
  {
    id: '0032',
    title: 'JING JAI 市集（周末版）',
    expectedTime: '06:00-14:00',
    expectedDuration: '8小时'
  },
  {
    id: '0033',
    title: '清迈大学前门夜市',
    expectedTime: '17:00-23:00',
    expectedDuration: '6小时'
  },
  {
    id: '0035',
    title: '面包集市（bamboo saturday market）',
    expectedTime: '07:00-11:00',
    expectedDuration: '4小时',
    expectedWeekdays: ['周六']
  },
  {
    id: '0038',
    title: '瓦洛洛市场（唐人街）',
    expectedTime: '06:00-19:00',
    expectedDuration: '13小时'
  }
];

let allTimeCorrect = true;

timeFixes.forEach(fix => {
  const item = items.find(i => i.id === fix.id);

  if (!item) {
    console.log(`❌ 未找到活动 ${fix.id} (${fix.title})`);
    allTimeCorrect = false;
    return;
  }

  const timeCorrect = item.time === fix.expectedTime;
  const durationCorrect = item.duration === fix.expectedDuration;

  if (timeCorrect && durationCorrect) {
    console.log(`✅ ${fix.title} (${fix.id})`);
    console.log(`   时间: ${item.time} ✅`);
    console.log(`   时长: ${item.duration} ✅`);
    if (fix.expectedWeekdays) {
      const weekdaysCorrect = JSON.stringify(item.weekdays) === JSON.stringify(fix.expectedWeekdays);
      if (weekdaysCorrect) {
        console.log(`   日期: ${item.weekdays.join(', ')} ✅`);
      } else {
        console.log(`   日期: ${item.weekdays.join(', ')} ❌ (应为: ${fix.expectedWeekdays.join(', ')})`);
        allTimeCorrect = false;
      }
    }
  } else {
    console.log(`❌ ${fix.title} (${fix.id})`);
    if (!timeCorrect) {
      console.log(`   时间: ${item.time} ❌ (应为: ${fix.expectedTime})`);
    }
    if (!durationCorrect) {
      console.log(`   时长: ${item.duration} ❌ (应为: ${fix.expectedDuration})`);
    }
    allTimeCorrect = false;
  }
  console.log('');
});

if (allTimeCorrect) {
  console.log('✅ 所有时间修正均正确\n');
}

// =====================================================
// 3. 验证 sortOrder 连续性
// =====================================================

console.log('3️⃣ 验证 sortOrder 连续性\n');

const sortedItems = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
const sortOrderIssues = [];

for (let i = 0; i < sortedItems.length; i++) {
  const expected = i + 1;
  const actual = sortedItems[i].sortOrder;

  if (expected !== actual) {
    sortOrderIssues.push({
      id: sortedItems[i].id,
      title: sortedItems[i].title,
      expected,
      actual
    });
  }
}

if (sortOrderIssues.length === 0) {
  console.log(`✅ sortOrder 连续且正确 (1-${items.length})`);
} else {
  console.log(`❌ 发现 ${sortOrderIssues.length} 个 sortOrder 问题:`);
  sortOrderIssues.forEach(issue => {
    console.log(`   ${issue.title} (${issue.id}): ${issue.actual} → ${issue.expected}`);
  });
}

// =====================================================
// 4. 统计信息
// =====================================================

console.log('\n4️⃣ 数据统计\n');

console.log(`总活动数: ${items.length}`);
console.log(`sortOrder范围: 1-${items.length}`);

const categoryCount = {};
items.forEach(item => {
  const cat = item.category || '未分类';
  categoryCount[cat] = (categoryCount[cat] || 0) + 1;
});

console.log('\n分类统计:');
Object.entries(categoryCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count} 个`);
  });

// =====================================================
// 5. 检查剩余的市集
// =====================================================

console.log('\n5️⃣ 市集列表验证\n');

const markets = items.filter(item => item.category === '市集');
console.log(`总共 ${markets.length} 个市集:`);

markets.forEach((market, index) => {
  console.log(`  ${index + 1}. [${market.id}] ${market.title}`);
  console.log(`     时间: ${market.time} | 日期: ${market.weekdays.join(', ') || '灵活'}`);
});

// =====================================================
// 6. 最终总结
// =====================================================

console.log('\n' + '='.repeat(60));
console.log('📊 验证总结\n');

const issues = foundDeleted.length + (allTimeCorrect ? 0 : 1) + sortOrderIssues.length;

if (issues === 0) {
  console.log('✅ 所有验证通过！');
  console.log(`\n✨ 成功删除 6 个重复活动`);
  console.log(`✨ 成功修正 4 个时间错误`);
  console.log(`✨ 数据从 52 个活动优化到 ${items.length} 个`);
  console.log(`✨ sortOrder 连续且正确`);
} else {
  console.log(`⚠️ 发现 ${issues} 个问题需要修复`);
  console.log(`   - 重复活动未删除: ${foundDeleted.length}`);
  console.log(`   - 时间修正错误: ${allTimeCorrect ? 0 : 1}`);
  console.log(`   - sortOrder问题: ${sortOrderIssues.length}`);
}

console.log('\n' + '='.repeat(60));
