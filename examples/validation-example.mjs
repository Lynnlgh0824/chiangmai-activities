#!/usr/bin/env node

/**
 * 数据验证使用示例
 */

import { validateItemList, printValidationResults } from '../scripts/lib/validator.mjs';
import fs from 'fs';

const JSON_FILE = './data/items.json';

console.log('📋 开始验证数据...\n');

// 读取数据
const items = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));

// 验证
const result = validateItemList(items);

// 打印结果
printValidationResults(result);

// 退出码
process.exit(result.isValid ? 0 : 1);
