#!/usr/bin/env node
/**
 * 分析活动描述中的重复字段（通过API）
 *
 * 用途：从服务器API获取活动数据并检查描述中的重复内容
 * 运行：node scripts/analyze-description-api.mjs
 */

const API_URL = 'http://localhost:3000/api/activities?limit=1000';

console.log('🔍 活动描述重复分析工具（API版本）\n');
console.log('=' .repeat(60));

async function main() {
    try {
        console.log('📡 正在从服务器获取数据...\n');
        
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success || !result.data) {
            throw new Error('API返回数据格式错误');
        }
        
        const activities = result.data;
        
        console.log(`✅ 成功获取数据`);
        console.log(`📊 总活动数: ${activities.length}\n`);

        // 定义需要检查的字段
        const fields = [
            { name: '适合人群', icon: '👥' },
            { name: '活动特点', icon: '✨' },
            { name: '课程周期', icon: '📚' },
            { name: '语言', icon: '🌐' },
            { name: '费用', icon: '💰' },
            { name: '注意事项', icon: '⚠️' },
            { name: '联系方式', icon: '📞' },
            { name: '官网', icon: '🌐' }
        ];

        let totalDuplicates = 0;
        const duplicateDetails = [];

        // 分析每个活动
        activities.forEach(act => {
            const desc = act.description || '';

            if (!desc) return;

            let activityHasDuplicates = false;

            fields.forEach(field => {
                // 匹配字段标签（带或不带图标）
                const regex = new RegExp(`(?:${field.icon}\\s*)?${field.name}[：:]`, 'gi');
                const matches = desc.match(regex);

                if (matches && matches.length > 1) {
                    activityHasDuplicates = true;
                    totalDuplicates++;

                    if (duplicateDetails.length < 10) {
                        duplicateDetails.push({
                            id: act.id || act.originalId,
                            title: act.title,
                            field: field.name,
                            count: matches.length,
                            preview: desc.substring(0, 150) + (desc.length > 150 ? '...' : '')
                        });
                    }
                }
            });
        });

        // 输出分析结果
        console.log('📋 分析结果:\n');
        console.log(`发现重复字段的活动: ${duplicateDetails.length} 个`);
        console.log(`总重复字段数: ${totalDuplicates} 个\n`);

        if (duplicateDetails.length > 0) {
            console.log('🔍 重复详情（前10个）:\n');
            duplicateDetails.forEach((detail, index) => {
                console.log(`${index + 1}. ${detail.title} (ID: ${detail.id})`);
                console.log(`   重复字段: ${detail.field} (${detail.count}次)`);
                console.log(`   描述预览: ${detail.preview}`);
                console.log('');
            });

            console.log('=' .repeat(60));
            console.log('\n✅ 分析完成！');
            console.log('\n💡 建议：');
            console.log('   这是数据源的问题，需要修复服务器端的数据');
            console.log('   或者增强 formatDescription 函数的去重逻辑\n');
            
            // 保存分析结果到文件
            const reportFile = 'description-duplicates-report.json';
            fs.writeFileSync(reportFile, JSON.stringify(duplicateDetails, null, 2), 'utf-8');
            console.log(`📄 详细报告已保存: ${reportFile}\n`);
            
        } else {
            console.log('✅ 未发现重复字段，数据源正常！\n');
        }

        // 输出统计信息
        console.log('📊 统计信息:');
        console.log(`   API地址: ${API_URL}`);
        console.log(`   总活动数: ${activities.length}`);
        console.log(`   有描述的活动: ${activities.filter(a => a.description).length}`);
        console.log(`   有重复的活动: ${duplicateDetails.length}\n`);
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 提示：');
            console.log('   服务器未启动，请先运行：');
            console.log('   npm start');
            console.log('   或者 node server.cjs\n');
        }
        
        process.exit(1);
    }
}

main();
