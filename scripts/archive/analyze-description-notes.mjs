#!/usr/bin/env node

import fs from 'fs';

const items = JSON.parse(fs.readFileSync('./data/items.json', 'utf-8'));

console.log('📊 描述和注意事项数据分析\n');

let stats = {
    hasBoth: 0,
    hasDescOnly: 0,
    hasNotesOnly: 0,
    hasNeither: 0,
    descEmpty: 0,
    notesEmpty: 0,
    identical: 0,
    similar: 0
};

const identicalList = [];
const similarList = [];

items.forEach(item => {
    const desc = (item.description || '').trim();
    const notes = (item.notes || '').trim();

    const hasDesc = desc.length > 0;
    const hasNotes = notes.length > 0;

    if (hasDesc && hasNotes) {
        stats.hasBoth++;
        // 检查是否完全相同
        if (desc === notes) {
            stats.identical++;
            identicalList.push({
                id: item.id,
                title: item.title,
                content: desc.substring(0, 50)
            });
        }
        // 检查是否相似（一个包含另一个）
        else if (desc.includes(notes) || notes.includes(desc)) {
            stats.similar++;
            similarList.push({
                id: item.id,
                title: item.title,
                desc: desc.substring(0, 40),
                notes: notes.substring(0, 40)
            });
        }
    } else if (hasDesc) {
        stats.hasDescOnly++;
    } else if (hasNotes) {
        stats.hasNotesOnly++;
    } else {
        stats.hasNeither++;
    }

    if (!hasDesc) stats.descEmpty++;
    if (!hasNotes) stats.notesEmpty++;
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 统计结果:');
console.log(`   总活动数: ${items.length}`);
console.log(`   同时有描述和注意事项: ${stats.hasBoth}`);
console.log(`   只有描述: ${stats.hasDescOnly}`);
console.log(`   只有注意事项: ${stats.hasNotesOnly}`);
console.log(`   两者都没有: ${stats.hasNeither}`);
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 详细分析:');
console.log(`   描述为空: ${stats.descEmpty} 个`);
console.log(`   注意事项为空: ${stats.notesEmpty} 个`);
console.log(`   内容完全相同: ${stats.identical} 个`);
console.log(`   内容重叠: ${stats.similar} 个`);

if (identicalList.length > 0) {
    console.log('\n⚠️  内容完全相同的活动:');
    identicalList.forEach(item => {
        console.log(`   [${item.id}] ${item.title}`);
        console.log(`      ${item.content}...\n`);
    });
}

if (similarList.length > 0) {
    console.log('\n🔄 内容重叠的活动:');
    similarList.forEach(item => {
        console.log(`   [${item.id}] ${item.title}`);
        console.log(`      描述: ${item.desc}...`);
        console.log(`      注意: ${item.notes}...\n`);
    });
}
