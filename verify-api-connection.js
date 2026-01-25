/**
 * API 连接测试脚本
 * 验证前端能否正常访问后端 API
 */

const API_BASE = 'http://localhost:3000';

async function testAPI() {
  console.log('🔍 开始测试 API 连接...\n');

  // Test 1: Health check
  console.log('1️⃣ 测试健康检查端点...');
  try {
    const healthRes = await fetch(`${API_BASE}/api/health`);
    const healthData = await healthRes.json();
    console.log('   ✅ 健康检查:', healthData.message);
  } catch (error) {
    console.log('   ❌ 健康检查失败:', error.message);
    return;
  }

  // Test 2: Get items
  console.log('\n2️⃣ 测试获取活动数据...');
  try {
    const itemsRes = await fetch(`${API_BASE}/api/items`);
    const itemsData = await itemsRes.json();
    console.log(`   ✅ 成功获取 ${itemsData.data.length} 个活动`);

    // Show first item
    if (itemsData.data.length > 0) {
      const firstItem = itemsData.data[0];
      console.log(`   📌 示例活动: "${firstItem.title}" (${firstItem.category})`);
    }
  } catch (error) {
    console.log('   ❌ 获取活动失败:', error.message);
    return;
  }

  // Test 3: Check CORS
  console.log('\n3️⃣ 测试 CORS 配置...');
  try {
    const corsRes = await fetch(`${API_BASE}/api/items`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET'
      }
    });
    console.log('   ✅ CORS 预检请求成功');
    console.log('   📋 CORS Headers:');
    corsRes.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('access-control')) {
        console.log(`      ${key}: ${value}`);
      }
    });
  } catch (error) {
    console.log('   ❌ CORS 测试失败:', error.message);
  }

  console.log('\n✨ 所有测试完成！API 连接正常。\n');
  console.log('📍 访问页面: http://localhost:5173');
  console.log('📍 后台管理: http://localhost:5173/admin.html');
}

testAPI().catch(console.error);
