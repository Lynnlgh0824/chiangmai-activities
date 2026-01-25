#!/bin/bash

###############################################################################
# Chiengmai 项目自动化任务执行脚本
#
# 使用方法：
#   chmod +x auto-complete-tasks.sh
#   ./auto-complete-tasks.sh
#
# 注意：电脑必须保持唤醒状态
###############################################################################

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 开始时间
START_TIME=$(date +%s)
log_info "开始时间: $(date)"

###############################################################################
# 任务1: 后台 → Excel 导出功能
###############################################################################
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "任务1: 创建后台 → Excel 导出功能"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查是否已存在
if [ -f "scripts/export-json-to-excel.mjs" ]; then
    log_warning "文件已存在，跳过创建"
else
    log_info "创建导出脚本..."
    cat > scripts/export-json-to-excel.mjs << 'EOF'
#!/usr/bin/env node

/**
 * 从 JSON 导出数据到 Excel 文件
 * 用法: npm run export-to-excel
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const JSON_FILE = './data/items.json';
const EXCEL_FILE = './清迈活动数据-导出.xlsx';

console.log('📤 开始从 JSON 导出数据到 Excel...\n');

// 检查 JSON 文件
if (!fs.existsSync(JSON_FILE)) {
    console.error(`❌ 文件不存在: ${JSON_FILE}`);
    process.exit(1);
}

// 读取 JSON 数据
console.log('📖 读取 JSON 文件...');
const items = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
console.log(`✅ 找到 ${items.length} 条记录\n`);

// 按活动编号排序
items.sort((a, b) => {
    const numA = parseInt(a.activityNumber || a['活动编号'] || '0');
    const numB = parseInt(b.activityNumber || b['活动编号'] || '0');
    return numA - numB;
});

// 定义列顺序
const columnOrder = [
    '活动编号', '活动标题', '分类', '地点', '价格',
    '时间', '持续时间', '时间信息', '星期', '序号',
    '最低价格', '最高价格', '最大人数', '描述',
    '灵活时间', '状态', '需要预约', 'id'
];

// 转换为 Excel 格式
console.log('🔄 转换数据格式...');
const excelData = items.map(item => ({
    '活动编号': item.activityNumber || item['活动编号'] || '',
    '活动标题': item.title || '',
    '分类': item.category || '',
    '地点': item.location || '',
    '价格': item.price || '',
    '时间': item.time || '',
    '持续时间': item.duration || '',
    '时间信息': item.timeInfo || '',
    '星期': Array.isArray(item.weekdays) ? item.weekdays.join(', ') : '',
    '序号': item.sortOrder || 0,
    '最低价格': item.minPrice || 0,
    '最高价格': item.maxPrice || 0,
    '最大人数': item.maxParticipants || 0,
    '描述': item.description || '',
    '灵活时间': item.flexibleTime || '否',
    '状态': item.status || '草稿',
    '需要预约': item.requireBooking || '是',
    'id': String(item.id || '')
}));

// 创建工作表
console.log('📊 创建 Excel 工作表...');
const worksheet = XLSX.utils.json_to_sheet(excelData, {
    header: columnOrder
});

// 设置列宽
const colWidths = [
    { wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 30 }, { wch: 18 },
    { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 8 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 40 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 18 }
];
worksheet['!cols'] = colWidths;

// 保存文件
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, '活动列表');
XLSX.writeFile(workbook, EXCEL_FILE);

console.log(`\n✅ 已导出 ${items.length} 条活动到 ${EXCEL_FILE}`);
console.log('\n📊 分类统计:');
const categories = {};
items.forEach(item => {
    const cat = item.category || '未分类';
    categories[cat] = (categories[cat] || 0) + 1;
});
Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count} 个`);
    });

console.log('\n✨ 导出完成！');
EOF

    chmod +x scripts/export-json-to-excel.mjs
    log_success "导出脚本创建完成"
fi

# 测试导出
log_info "测试导出功能..."
npm run export-to-excel 2>/dev/null || {
    log_error "导出失败，请检查错误信息"
    exit 1
}
log_success "导出测试通过"

###############################################################################
# 任务2: 添加 npm 脚本
###############################################################################
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "任务2: 添加 npm 脚本"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查是否已添加
if grep -q '"export-to-excel"' package.json; then
    log_warning "npm 脚本已存在"
else
    log_info "添加 export-to-excel 脚本..."
    # 使用 node.js 来修改 package.json
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.scripts['export-to-excel'] = 'node scripts/export-json-to-excel.mjs';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    log_success "npm 脚本已添加"
fi

###############################################################################
# 任务3: 创建数据验证模块
###############################################################################
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "任务3: 创建数据验证框架"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "scripts/lib" ]; then
    log_info "scripts/lib 目录已存在"
else
    mkdir -p scripts/lib
    log_info "创建 scripts/lib 目录"
fi

if [ -f "scripts/lib/validator.mjs" ]; then
    log_warning "验证器已存在"
else
    log_info "创建验证器..."
    cat > scripts/lib/validator.mjs << 'EOF'
/**
 * 数据验证模块
 */

// 验证规则配置
export const validationRules = {
    title: {
        required: true,
        minLength: 2,
        maxLength: 100
    },
    category: {
        required: true,
        allowed: ['瑜伽', '冥想', '舞蹈', '徒步', '泰拳', '攀岩', '健身', '户外探险', '文化艺术', '咏春拳']
    },
    price: {
        required: true,
        pattern: /^(免费|\d+泰铢|walkin|捐赠|需购买)/
    },
    time: {
        required: false,
        pattern: /^(\d{2}:\d{2}-\d{2}:\d{2}|灵活时间|不限时|全天|[\u4e00-\u9fa5]+)$/
    }
};

/**
 * 验证单个活动数据
 */
export function validateItem(item, rules = validationRules) {
    const errors = [];
    const warnings = [];

    Object.keys(rules).forEach(field => {
        const rule = rules[field];
        const value = item[field];

        // 必填检查
        if (rule.required && !value) {
            errors.push(`${field} 是必填字段`);
            return;
        }

        if (!value) return; // 非必填且为空，跳过其他检查

        // 长度检查
        if (rule.minLength && value.length < rule.minLength) {
            errors.push(`${field} 长度不能少于 ${rule.minLength} 个字符`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
            errors.push(`${field} 长度不能超过 ${rule.maxLength} 个字符`);
        }

        // 枚举值检查
        if (rule.allowed && !rule.allowed.includes(value)) {
            warnings.push(`${field} "${value}" 不在推荐列表中: ${rule.allowed.join(', ')}`);
        }

        // 正则检查
        if (rule.pattern && !rule.pattern.test(value)) {
            errors.push(`${field} 格式不正确: ${value}`);
        }
    });

    return { errors, warnings };
}

/**
 * 验证活动列表
 */
export function validateItemList(items) {
    const results = [];
    let totalErrors = 0;
    let totalWarnings = 0;

    items.forEach((item, index) => {
        const { errors, warnings } = validateItem(item);

        if (errors.length > 0 || warnings.length > 0) {
            results.push({
                index: index + 1,
                activityNumber: item.activityNumber || item['活动编号'] || 'N/A',
                title: item.title || '未命名',
                errors,
                warnings
            });

            totalErrors += errors.length;
            totalWarnings += warnings.length;
        }
    });

    return {
        results,
        totalErrors,
        totalWarnings,
        isValid: totalErrors === 0
    };
}

/**
 * 打印验证结果
 */
export function printValidationResults(validationResult) {
    const { results, totalErrors, totalWarnings, isValid } = validationResult;

    if (isValid) {
        console.log('✅ 所有数据验证通过！');
        return;
    }

    console.log(`\n⚠️  发现 ${totalErrors} 个错误, ${totalWarnings} 个警告:\n`);

    results.forEach(result => {
        const { index, activityNumber, title, errors, warnings } = result;

        if (errors.length > 0) {
            console.log(`❌ 第 ${index} 行 (${activityNumber}) - ${title}`);
            errors.forEach(err => console.log(`   - ${err}`));
        }

        if (warnings.length > 0) {
            console.log(`⚠️  第 ${index} 行 (${activityNumber}) - ${title}`);
            warnings.forEach(warn => console.log(`   - ${warn}`));
        }
    });

    console.log(`\n总计: ${totalErrors} 错误, ${totalWarnings} 警告`);
}
EOF

    log_success "验证器创建完成"
fi

###############################################################################
# 任务4: 创建使用示例
###############################################################################
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "任务4: 创建使用示例"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > examples/validation-example.mjs << 'EOF'
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
EOF

log_success "使用示例已创建: examples/validation-example.mjs"

###############################################################################
# 完成统计
###############################################################################
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "所有自动化任务已完成！"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log_info "总耗时: ${MINUTES}分${SECONDS}秒"
echo ""
log_info "已完成的功能:"
echo "  ✅ 后台 → Excel 导出功能"
echo "  ✅ 数据验证框架"
echo "  ✅ npm 脚本配置"
echo "  ✅ 使用示例"
echo ""
log_info "可以使用的命令:"
echo "  npm run export-to-excel    # 导出JSON到Excel"
echo "  node examples/validation-example.mjs  # 验证数据"
echo ""
log_warning "⚠️  注意事项:"
echo "  - 电脑必须保持唤醒状态"
echo "  - 部署到 Vercel/Render 需要手动配置"
echo "  - 测试和调试需要人工参与"
echo ""
log_info "下一步建议:"
echo "  1. 测试导出功能: npm run export-to-excel"
echo "  2. 测试验证功能: node examples/validation-example.mjs"
echo "  3. 注册 Vercel 和 Render 账号"
echo "  4. 阅读部署文档进行手动部署"
echo ""
