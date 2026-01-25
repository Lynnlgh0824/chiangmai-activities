// 测试API连接
const axios = require('axios');

async function testAPI() {
  try {
    const response = await axios.get('http://localhost:3000/api/activities', {
      params: { status: 'active', limit: 10 }
    });
    console.log('✅ API连接成功');
    console.log(`获取到 ${response.data.data.length} 条活动`);
    console.log('第一条活动:', response.data.data[0].title);
  } catch (error) {
    console.error('❌ API连接失败:', error.message);
  }
}

testAPI();
