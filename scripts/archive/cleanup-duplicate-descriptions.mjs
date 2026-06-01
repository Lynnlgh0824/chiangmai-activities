#!/usr/bin/env node

/**
 * 自动去除活动描述中的重复文案
 */

import XLSX from 'xlsx';
import fs from 'fs';

console.log('🧹 开始清理活动描述中的重复文案...\n');

// 读取Excel
const workbook = XLSX.readFile('清迈活动数据.xlsx');
const sheetName = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log('✅ 当前总活动数:', data.length);
console.log('');

let fixedCount = 0;
const fixedItems = [];

data.forEach((item, index) => {
  if (!item['描述']) return;

  const originalDesc = item['描述'];
  let desc = originalDesc;

  // 1. 去除完全重复的段落
  const paragraphs = desc.split('\n').filter(p => p.trim());
  const uniqueParagraphs = [...new Set(paragraphs)];

  if (paragraphs.length !== uniqueParagraphs.length) {
    desc = uniqueParagraphs.join('\n');
  }

  // 2. 去除 "⚠️ 注意事项：" 后面的重复内容
  if (desc.includes('⚠️ 注意事项：')) {
    const parts = desc.split('⚠️ 注意事项：');
    if (parts.length > 1) {
      const mainContent = parts[0].trim();
      const noteContent = parts[1].trim();

      // 检查注意事项是否重复了主内容
      const mainLines = mainContent.split('\n').map(l => l.trim());
      const noteLines = noteContent.split('\n').map(l => l.trim());

      const uniqueNoteLines = noteLines.filter(line =>
        !mainLines.some(mainLine => mainLine.includes(line.substring(0, 20)))
      );

      if (uniqueNoteLines.length < noteLines.length) {
        desc = mainContent + '\n\n⚠️ 注意事项：\n' + uniqueNoteLines.join('\n');
      }
    }
  }

  // 3. 去除连续的空行
  desc = desc.replace(/\n{3,}/g, '\n\n');

  // 4. 去除首尾空行
  desc = desc.trim();

  if (desc !== originalDesc) {
    item['描述'] = desc;
    fixedCount++;
    fixedItems.push({
      number: item['活动编号'],
      title: item['活动标题'],
      oldLength: originalDesc.length,
      newLength: desc.length,
      saved: originalDesc.length - desc.length
    });
  }
});

console.log('🔧 清理了', fixedCount, '个活动的描述\n');

if (fixedCount > 0) {
  console.log('清理详情:\n');
  fixedItems.slice(0, 10).forEach(item => {
    console.log(`[${item.number}] ${item.title}`);
    console.log(`  原长度: ${item.oldLength} 字符`);
    console.log(`  新长度: ${item.newLength} 字符`);
    console.log(`  节省: ${item.saved} 字符`);
    console.log('');
  });

  // 备份原文件
  const backupFile = '清迈活动数据.backup.xlsx';
  if (fs.existsSync(backupFile)) {
    fs.unlinkSync(backupFile);
  }
  fs.copyFileSync('清迈活动数据.xlsx', backupFile);
  console.log('💾 已备份原文件到:', backupFile);

  // 写入清理后的数据
  const newWorksheet = XLSX.utils.json_to_sheet(data);
  workbook.Sheets[sheetName] = newWorksheet;
  XLSX.writeFile(workbook, '清迈活动数据.xlsx');

  console.log('✅ 已保存清理后的文件: 清迈活动数据.xlsx');
} else {
  console.log('ℹ️  没有发现需要清理的重复内容');
}

console.log('\n✨ 描述清理完成！');
