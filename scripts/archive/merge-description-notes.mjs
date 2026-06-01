#!/usr/bin/env node

/**
 * 合并描述和注意事项字段
 * - 将notes内容合并到description
 * - 删除notes字段
 * - 格式化description（活动介绍 + 注意事项）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const itemsJsonPath = path.join(__dirname, '../data/items.json');

// 读取数据
const items = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log('📊 开始合并描述和注意事项字段...\n');
console.log(`原始数据: ${items.length} 个活动\n`);

// =====================================================
// 合并逻辑
// =====================================================

let mergeCount = 0;
let onlyDescCount = 0;
let onlyNotesCount = 0;
let emptyCount = 0;

items.forEach(item => {
    const desc = (item.description || '').trim();
    const notes = (item.notes || '').trim();

    // 情况1: 两者都有
    if (desc && notes) {
        // 合并格式
        item.description = `${desc}\n\n⚠️ 注意事项：\n${notes}`;
        mergeCount++;
        console.log(`   [${item.id}] ${item.title}: 合并描述和注意事项`);
    }
    // 情况2: 只有描述
    else if (desc && !notes) {
        item.description = desc;
        onlyDescCount++;
    }
    // 情况3: 只有注意事项
    else if (!desc && notes) {
        item.description = notes;
        onlyNotesCount++;
        console.log(`   [${item.id}] ${item.title}: 只有注意事项，已转为描述`);
    }
    // 情况4: 两者都为空
    else {
        item.description = '';
        emptyCount++;
    }

    // 删除notes字段
    delete item.notes;
});

console.log(`\n✅ 合并完成:`);
console.log(`   合并字段: ${mergeCount} 个`);
console.log(`   保留描述: ${onlyDescCount} 个`);
console.log(`   注意转描述: ${onlyNotesCount} 个`);
console.log(`   空描述: ${emptyCount} 个`);

// =====================================================
// 保存数据
// =====================================================

fs.writeFileSync(itemsJsonPath, JSON.stringify(items, null, 2), 'utf-8');

console.log(`\n✅ 数据已保存到 items.json`);
console.log(`\n📊 字段变更:`);
console.log(`   保留字段: description（合并后）`);
console.log(`   删除字段: notes`);

// =====================================================
// 显示示例
// =====================================================

console.log(`\n📝 合并后的描述示例（前3个）:\n`);

items.slice(0, 3).forEach(item => {
    console.log(`[${item.id}] ${item.title}`);
    console.log(`${'-'.repeat(50)}`);
    const descPreview = item.description.substring(0, 150);
    console.log(`${descPreview}${item.description.length > 150 ? '...' : ''}\n`);
});

console.log(`\n✅ 字段合并完成！`);
