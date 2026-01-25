// AI智能导入工具 - 灵活解析器
// 能够处理各种不规则、混乱的文本格式

// ==================== 配置 ====================
const CONFIG = {
  // API配置（如果使用Claude API）
  apiEndpoint: '/api/ai-parse',

  // 分类映射表 - 关键词自动识别
  categoryKeywords: {
    '瑜伽': ['瑜伽', 'yoga', '流瑜伽', '哈他', '阴瑜伽', '热瑜伽'],
    '冥想': ['冥想', '静心', '打坐', '声音疗愈', '颂钵', 'meditation'],
    '舞蹈': ['舞蹈', '跳舞', '摇摆舞', '探戈', '萨尔萨', 'tango', 'salsa'],
    '泰拳': ['泰拳', '拳击', '搏击', 'kickboxing'],
    '户外探险': ['徒步', '登山', '攀岩', '划船', '射击', '网球', '高尔夫', '游泳', '健身'],
    '攀岩': ['攀岩', '爬墙', 'climbing'],
    '健身': ['健身', 'gym', '健身房', '力量训练'],
    '文化艺术': ['语言', '英语', '泰语', '交换', '文化', '艺术', '手工', '绘画'],
    '美食体验': ['泰餐', '烹饪', '厨艺', '美食', 'cooking', '泰式菜']
  },

  // 星期映射
  weekdayMap: {
    '周一': ['周一', '星期一', '一', 'Mon', 'Monday', '1'],
    '周二': ['周二', '星期二', '二', 'Tue', 'Tuesday', '2'],
    '周三': ['周三', '星期三', '三', 'Wed', 'Wednesday', '3'],
    '周四': ['周四', '星期四', '四', 'Thu', 'Thursday', '4'],
    '周五': ['周五', '星期五', '五', 'Fri', 'Friday', '5'],
    '周六': ['周六', '星期六', '六', 'Sat', 'Saturday', '6'],
    '周日': ['周日', '星期日', '日', 'Sun', 'Sunday', '7', '天']
  }
};

// ==================== 智能解析函数 ====================

/**
 * 主解析函数 - 从文本中提取活动信息
 */
function parseActivityFromText(text) {
  const result = {
    title: '',
    category: '',
    location: '',
    price: '',
    time: '',
    duration: '',
    weekdays: [],
    timeInfo: '固定频率活动',
    description: '',
    flexibleTime: '否',
    status: '草稿',
    requireBooking: '是',
    minPrice: 0,
    maxPrice: 0
  };

  // 1. 提取标题（通常是第一行或第一个非空行）
  result.title = extractTitle(text);

  // 2. 提取分类（通过关键词识别）
  result.category = extractCategory(text);

  // 3. 提取地点（多种模式匹配）
  result.location = extractLocation(text);

  // 4. 提取价格信息
  const priceInfo = extractPriceInfo(text);
  result.price = priceInfo.display;
  result.minPrice = priceInfo.min;
  result.maxPrice = priceInfo.max;

  // 5. 提取时间信息
  const timeInfo = extractTimeInfo(text);
  result.time = timeInfo.time;
  result.duration = timeInfo.duration;
  result.weekdays = timeInfo.weekdays;
  result.flexibleTime = timeInfo.isFlexible ? '是' : '否';
  result.timeInfo = timeInfo.isFlexible ? '临时活动' : '固定频率活动';

  // 6. 提取描述（剩余文本）
  result.description = extractDescription(text, result);

  return result;
}

/**
 * 提取标题
 */
function extractTitle(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  // 跳过明显的标签行
  const skipPatterns = [/^(时间|地点|价格|费用|日期|联系人|电话)/i];

  for (let line of lines) {
    const isSkipLine = skipPatterns.some(p => p.test(line));
    if (!isSkipLine && line.length > 2 && line.length < 50) {
      return line;
    }
  }

  return '未命名活动';
}

/**
 * 提取分类 - 通过关键词智能识别
 */
function extractCategory(text) {
  const lowerText = text.toLowerCase();

  // 遍历所有分类
  for (const [category, keywords] of Object.entries(CONFIG.categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return '其他';
}

/**
 * 提取地点 - 支持多种格式
 */
function extractLocation(text) {
  // 多种地点标识符
  const patterns = [
    /(?:地点|地址|位置|场所|Location|Where)[：:]\s*([^\n]+)/i,
    /(?:在|at|@)\s*([^\n]+?)(?:\n|时间|价格|$)/i,
    /([^\n]+?(?:馆|中心|公园|学校|公寓|俱乐部|gym|club|center|park))/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return '待确认';
}

/**
 * 提取价格信息 - 智能识别多种格式
 */
function extractPriceInfo(text) {
  const result = {
    display: '',
    min: 0,
    max: 0
  };

  // 免费相关
  if (/免费|free|无需付费/i.test(text)) {
    result.display = '免费';
    return result;
  }

  // 捐赠
  if (/捐赠|donation/i.test(text)) {
    result.display = '捐赠';
    return result;
  }

  // Walk-in
  if (/walkin|walk-in|随到随参加/i.test(text)) {
    result.display = 'walkin';
    return result;
  }

  // 提取数字价格
  const pricePatterns = [
    /(\d+)\s*泰?(?:铢|฿|b|thb)/i,
    /(\d+)\s*元/,
    /(\d+)\s*\/\s*人/,
    /¥?(\d+)/
  ];

  const prices = [];
  for (const pattern of pricePatterns) {
    const matches = text.matchAll(new RegExp(pattern, 'gi'));
    for (const match of matches) {
      prices.push(parseInt(match[1]));
    }
  }

  if (prices.length > 0) {
    const uniquePrices = [...new Set(prices)].sort((a, b) => a - b);
    result.min = uniquePrices[0];
    result.max = uniquePrices[uniquePrices.length - 1];

    if (result.min === result.max) {
      result.display = `${result.min}泰铢`;
    } else {
      result.display = `${result.min}-${result.max}泰铢`;
    }
  } else {
    result.display = '待确认';
  }

  return result;
}

/**
 * 提取时间信息 - 最复杂的部分
 */
function extractTimeInfo(text) {
  const result = {
    time: '',
    duration: '',
    weekdays: [],
    isFlexible: false
  };

  // 检查是否为灵活时间
  if (/随时|灵活|预约|contact|flexible/i.test(text)) {
    result.isFlexible = true;
    result.time = '灵活时间';
    result.duration = '灵活时间';
    return result;
  }

  // 提取星期几
  result.weekdays = extractWeekdays(text);

  // 提取具体时间段
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*[-~至到]+\s*(\d{1,2}):(\d{2})/,
    /(\d{1,2})点(\d{0,2})\s*(?:到|至)\s*(\d{1,2})点(\d{0,2})/,
    /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/
  ];

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      const startTime = `${String(match[1]).padStart(2, '0')}:${match[2] || '00'}`;
      const endTime = `${String(match[3]).padStart(2, '0')}:${match[4] || '00'}`;
      result.time = `${startTime}-${endTime}`;

      // 计算时长
      const startMinutes = parseInt(match[1]) * 60 + parseInt(match[2] || 0);
      const endMinutes = parseInt(match[3]) * 60 + parseInt(match[4] || 0);
      const durationMinutes = endMinutes - startMinutes;

      if (durationMinutes > 0) {
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        if (hours > 0) {
          result.duration = minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
        } else {
          result.duration = `${minutes}分钟`;
        }
      }
      break;
    }
  }

  // 如果没有找到时间，尝试常见时间描述
  if (!result.time) {
    if (/早|上午|morning/i.test(text)) {
      result.time = '上午';
    } else if (/下午|afternoon/i.test(text)) {
      result.time = '下午';
    } else if (/晚|evening|night/i.test(text)) {
      result.time = '晚上';
    }
  }

  return result;
}

/**
 * 提取星期几
 */
function extractWeekdays(text) {
  const found = new Set();

  for (const [weekday, aliases] of Object.entries(CONFIG.weekdayMap)) {
    for (const alias of aliases) {
      if (text.includes(alias)) {
        found.add(weekday);
        break;
      }
    }
  }

  // 检查"每天"、"每日"
  if (/每天|每日|every day/i.test(text)) {
    return ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  }

  // 检查"工作日"
  if (/工作日|weekday/i.test(text)) {
    return ['周一', '周二', '周三', '周四', '周五'];
  }

  // 检查"周末"
  if (/周末|weekend/i.test(text)) {
    return ['周六', '周日'];
  }

  return Array.from(found);
}

/**
 * 提取描述 - 清理已提取的字段
 */
function extractDescription(originalText, extracted) {
  let description = originalText;

  // 移除已识别的行
  const linesToRemove = [];

  // 移除标题行
  const titleLine = description.split('\n').find(l =>
    l.trim() === extracted.title || l.includes(extracted.title.substring(0, 10))
  );
  if (titleLine) linesToRemove.push(titleLine);

  // 移除包含关键字的行
  const removePatterns = [
    /^时间[:：]/,
    /^地点[:：]/,
    /^价格[:：]/,
    /^费用[:：]/
  ];

  description = description
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      return !linesToRemove.some(l => l.includes(trimmed)) &&
             !removePatterns.some(p => p.test(trimmed));
    })
    .join('\n')
    .trim();

  // 限制长度
  if (description.length > 500) {
    description = description.substring(0, 500) + '...';
  }

  return description || '暂无描述';
}

/**
 * 生成唯一ID
 */
function generateId() {
  return Date.now();
}

/**
 * 生成活动编号
 */
function generateActivityNumber(existingItems) {
  const maxNum = existingItems.reduce((max, item) => {
    const num = parseInt(item.activityNumber);
    return num > max ? num : max;
  }, 0);

  return String(maxNum + 1).padStart(4, '0');
}

// ==================== UI交互函数 ====================

/**
 * 解析按钮点击
 */
function parseText() {
  const inputText = document.getElementById('inputText').value;

  if (!inputText.trim()) {
    alert('请先输入活动文本！');
    return;
  }

  try {
    // 解析文本
    const activity = parseActivityFromText(inputText);

    // 显示结果
    displayResult(activity);

    // 保存到全局变量，方便导出
    window.parsedActivity = activity;

  } catch (error) {
    console.error('解析错误:', error);
    alert('解析失败，请检查文本格式！');
  }
}

/**
 * 显示解析结果
 */
function displayResult(activity) {
  const resultDiv = document.getElementById('result');

  resultDiv.innerHTML = `
    <div class="result-item">
      <h3>📝 活动信息</h3>
      <p><strong>标题：</strong>${activity.title}</p>
      <p><strong>分类：</strong>${activity.category}</p>
      <p><strong>地点：</strong>${activity.location}</p>
      <p><strong>价格：</strong>${activity.price}</p>
      <p><strong>时间：</strong>${activity.time}</p>
      <p><strong>时长：</strong>${activity.duration}</p>
      ${activity.weekdays.length > 0 ? `<p><strong>星期：</strong>${activity.weekdays.join(', ')}</p>` : ''}
      <p><strong>类型：</strong>${activity.timeInfo}</p>
      ${activity.description ? `<p><strong>描述：</strong>${activity.description}</p>` : ''}
    </div>
    <button class="export-btn" onclick="exportToJSON()">
      💾 导出为JSON格式
    </button>
    <button class="export-btn" style="background: #667eea;" onclick="saveToExcel()">
      📊 保存到Excel文件
    </button>
  `;
}

/**
 * 批量解析按钮点击
 */
function parseBatch() {
  const inputText = document.getElementById('inputText').value;

  if (!inputText.trim()) {
    alert('请先输入活动文本！');
    return;
  }

  try {
    // 批量解析（自动识别分割）
    const result = parseMultipleActivities(inputText, true);

    console.log('批量解析结果:', result);

    // 显示批量结果
    displayBatchResults(result);

    // 保存到全局变量
    window.parsedBatch = result;

    // 显示提示
    const successMsg = `✅ 成功解析 ${result.activities.length} 个活动！`;
    const failMsg = result.failedSections.length > 0
      ? `\n⚠️ ${result.failedSections.length} 个活动解析失败，请检查控制台`
      : '';
    alert(successMsg + failMsg);

  } catch (error) {
    console.error('批量解析错误:', error);
    alert('批量解析失败，请检查文本格式！\n\n错误信息: ' + error.message);
  }
}

/**
 * 显示批量解析结果
 */
function displayBatchResults(result) {
  const resultDiv = document.getElementById('result');

  let html = `
    <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; color: #1976d2;">📊 批量解析统计</h3>
      <p style="margin: 5px 0;">🔍 识别活动总数：<strong>${result.total}</strong></p>
      <p style="margin: 5px 0;">✅ 成功解析：<strong style="color: #4caf50;">${result.activities.length}</strong></p>
      ${result.failedSections.length > 0 ?
        `<p style="margin: 5px 0; color: #f44336;">⚠️ 解析失败：<strong>${result.failedSections.length}</strong></p>` : ''
      }
    </div>
  `;

  // 显示每个活动
  result.activities.forEach((activity, index) => {
    html += `
      <div class="result-item" style="border-left-color: ${
        index === 0 ? '#667eea' :
        index === 1 ? '#4ECDC4' :
        index === 2 ? '#FF6B6B' :
        index === 3 ? '#FFE66D' :
        '#95E1D3'
      };">
        <h3>🎯 活动 ${index + 1}</h3>
        <p><strong>标题：</strong>${activity.title}</p>
        <p><strong>分类：</strong>${activity.category}</p>
        <p><strong>地点：</strong>${activity.location}</p>
        <p><strong>价格：</strong>${activity.price}</p>
        <p><strong>时间：</strong>${activity.time}</p>
        ${activity.weekdays.length > 0 ? `<p><strong>星期：</strong>${activity.weekdays.join(', ')}</p>` : ''}
        ${activity.description ? `<p style="font-size: 12px; color: #666; margin-top: 8px;"><strong>原始文本：</strong><br>${activity._rawText.substring(0, 100)}...</p>` : ''}
      </div>
    `;
  });

  // 显示失败的活动
  if (result.failedSections.length > 0) {
    html += `
      <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin-top: 20px;">
        <h3 style="color: #c62828; margin: 0 0 15px 0;">⚠️ 解析失败的活动</h3>
    `;
    result.failedSections.forEach(failed => {
      html += `
        <div style="background: white; padding: 10px; margin: 10px 0; border-radius: 4px; border-left: 3px solid #f44336;">
          <p style="margin: 5px 0; font-weight: 600;">活动 ${failed.index}</p>
          <p style="margin: 5px 0; font-size: 12px; color: #666;">${failed.text}</p>
        </div>
      `;
    });
    html += '</div>';
  }

  // 导出按钮
  html += `
    <div style="margin-top: 20px;">
      <button class="export-btn" onclick="exportBatchToJSON()">
        💾 导出所有活动为JSON
      </button>
      <button class="export-btn" style="background: #667eea;" onclick="saveBatchToExcel()">
        📊 批量保存到Excel
      </button>
      <button class="export-btn" style="background: #f44336;" onclick="showFailedOnly()">
        ⚠️ 仅显示失败项
      </button>
    </div>
  `;

  resultDiv.innerHTML = html;
}

/**
 * 仅显示失败的活动
 */
function showFailedOnly() {
  if (!window.parsedBatch || !window.parsedBatch.failedSections.length) {
    alert('没有解析失败的活动！');
    return;
  }

  const result = window.parsedBatch.failedSections;
  const resultDiv = document.getElementById('result');

  let html = `
    <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #c62828; margin: 0 0 15px 0;">⚠️ ${result.length} 个活动解析失败</h3>
      <p style="margin: 10px 0;">💡 建议：检查这些活动的文本格式，或手动修正后重新解析</p>
    </div>
  `;

  result.forEach((failed, index) => {
    html += `
      <div class="result-item" style="border-left-color: #f44336;">
        <h3>❌ 活动 ${failed.index}</h3>
        <textarea style="width: 100%; min-height: 100px; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit;">${failed.text}</textarea>
        <button onclick="retrySingleActivity(${index})" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
          🔄 重新解析这个活动
        </button>
      </div>
    `;
  });

  resultDiv.innerHTML = html;
}

/**
 * 重试单个失败的活动
 */
function retrySingleActivity(failedIndex) {
  const failed = window.parsedBatch.failedSections[failedIndex];
  const textareas = document.querySelectorAll('.result-item textarea');
  const newText = textareas[failedIndex].value;

  try {
    const activity = parseActivityFromText(newText);
    alert('✅ 重新解析成功！');

    // 添加到成功列表
    window.parsedBatch.activities.push(activity);
    window.parsedBatch.failedSections.splice(failedIndex, 1);

    // 刷新显示
    displayBatchResults(window.parsedBatch);

  } catch (error) {
    alert('❌ 仍然解析失败: ' + error.message);
  }
}

/**
 * 导出为JSON
 */
function exportToJSON() {
  if (!window.parsedActivity) {
    alert('请先解析活动！');
    return;
  }

  const json = JSON.stringify(window.parsedActivity, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `activity_${Date.now()}.json`;
  a.click();

  URL.revokeObjectURL(url);
  alert('✅ JSON文件已导出！');
}

/**
 * 保存到Excel（需要后端支持）
 */
async function saveToExcel() {
  if (!window.parsedActivity) {
    alert('请先解析活动！');
    return;
  }

  // 这里需要调用后端API将数据保存到Excel
  alert('📊 此功能需要后端API支持\n\n数据已准备好，可以手动复制到Excel文件中');
  console.log('准备保存的数据:', window.parsedActivity);
}

/**
 * 清空所有内容
 */
function clearAll() {
  if (confirm('确定要清空所有内容吗？')) {
    document.getElementById('inputText').value = '';
    document.getElementById('result').innerHTML = `
      <p style="color: #999; text-align: center; padding: 50px 0;">
        解析结果将显示在这里...
      </p>
    `;
    window.parsedActivity = null;
  }
}

// ==================== 图片上传功能 ====================

/**
 * 处理图片上传
 */
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // 显示预览
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('previewImg').src = e.target.result;
    document.getElementById('imagePreview').style.display = 'block';
    document.getElementById('uploadArea').style.display = 'none';
  };
  reader.readAsDataURL(file);

  alert('⚠️ 图片上传成功！\n\n请查看图片内容，然后手动复制文字到输入框进行解析。\n\n（OCR文字识别功能需要后端API支持）');
}

/**
 * 清除图片
 */
function clearImage() {
  document.getElementById('imageInput').value = '';
  document.getElementById('previewImg').src = '';
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('uploadArea').style.display = 'block';
}

// 拖放支持
document.addEventListener('DOMContentLoaded', function() {
  const uploadArea = document.getElementById('uploadArea');

  uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    uploadArea.style.borderColor = '#667eea';
    uploadArea.style.background = '#f0f0ff';
  });

  uploadArea.addEventListener('dragleave', function(e) {
    e.preventDefault();
    uploadArea.style.borderColor = '#ddd';
    uploadArea.style.background = '#fafafa';
  });

  uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadArea.style.borderColor = '#ddd';
    uploadArea.style.background = '#fafafa';

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      document.getElementById('imageInput').files = files;
      handleImageUpload({ target: { files: files } });
    }
  });
});

// ==================== 批量处理功能 ====================

/**
 * 智能分割文本为多个活动
 * 自动检测活动边界，处理各种混乱格式
 */
function smartSplitActivities(text) {
  const activities = [];
  const lines = text.split('\n');

  let currentActivity = [];
  let emptyLineCount = 0;
  let lastLineWasActivity = false;

  // 活动边界检测模式
  const boundaryPatterns = [
    /^[==\-\*]{3,}$/,                    // ===, ---, ***
    /^\d+[\.、]\s*/,                     // 1. 2.
    /^活动\s*\d+[:：]/,                  // 活动1:
    /^\[\d+\]/,                          // [1] [2]
    /^(?:▌|▍|▎|▏|●|○|■|□)/,             // 符号开头
  ];

  // 可能是新活动的开始（标题行特征）
  function looksLikeTitle(line) {
    if (!line.trim()) return false;

    // 短行（标题通常较短）
    if (line.length > 50) return false;

    // 包含活动关键词
    const activityKeywords = ['瑜伽', '课程', '体验', '工作坊', '活动', '交换', '拳', '舞', '课'];
    if (activityKeywords.some(kw => line.includes(kw))) {
      return true;
    }

    // 不包含时间、价格等字段标识符
    const fieldMarkers = ['时间', '地点', '价格', '费用', '联系', '电话', 'Time', 'Price', 'Location'];
    if (fieldMarkers.some(marker => line.startsWith(marker))) {
      return false;
    }

    return true;
  }

  // 检测是否是边界线
  function isBoundary(line) {
    return boundaryPatterns.some(pattern => pattern.test(line.trim()));
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const prevLine = i > 0 ? lines[i - 1].trim() : '';

    // 空行处理
    if (!line) {
      emptyLineCount++;

      // 多个空行或一个空行后可能表示活动分割
      if (emptyLineCount >= 2 && currentActivity.length > 0) {
        activities.push(currentActivity.join('\n'));
        currentActivity = [];
        emptyLineCount = 0;
        lastLineWasActivity = false;
      }
      continue;
    }

    // 检测明显的边界标记
    if (isBoundary(line)) {
      // 保存之前的活动
      if (currentActivity.length > 0) {
        activities.push(currentActivity.join('\n'));
        currentActivity = [];
      }
      emptyLineCount = 0;
      lastLineWasActivity = false;
      continue;
    }

    // 检测新活动开始（标题行）
    const isNewActivity = looksLikeTitle(line) && !lastLineWasActivity;

    // 如果看起来像新活动，且有已有内容，先保存
    if (isNewActivity && currentActivity.length > 3 && emptyLineCount >= 1) {
      activities.push(currentActivity.join('\n'));
      currentActivity = [];
    }

    // 添加到当前活动
    currentActivity.push(line);
    emptyLineCount = 0;
    lastLineWasActivity = true;
  }

  // 保存最后一个活动
  if (currentActivity.length > 0) {
    activities.push(currentActivity.join('\n'));
  }

  // 如果没有识别出多个活动，尝试按空行分割
  if (activities.length === 0 || (activities.length === 1 && activities[0].length > 500)) {
    console.log('尝试按空行分割...');
    return text.split(/\n\s*\n/).filter(section => section.trim());
  }

  return activities.filter(a => a.trim().length > 10);
}

/**
 * 批量解析多个活动（自动识别分割）
 */
function parseMultipleActivities(text, autoSplit = true) {
  let sections;

  if (autoSplit) {
    // 智能自动分割
    sections = smartSplitActivities(text);
    console.log(`🔍 自动识别出 ${sections.length} 个活动`);
  } else {
    // 使用分隔符
    sections = text.split(/\n-{3,}\n/).filter(s => s.trim());
  }

  const activities = [];
  const failedSections = [];

  sections.forEach((section, index) => {
    if (!section.trim()) return;

    try {
      const activity = parseActivityFromText(section.trim());
      activity._rawText = section.trim(); // 保留原始文本
      activity._sectionIndex = index + 1;
      activities.push(activity);
    } catch (error) {
      console.error(`解析活动 ${index + 1} 失败:`, error);
      failedSections.push({
        index: index + 1,
        text: section.substring(0, 100),
        error: error.message
      });
    }
  });

  console.log(`✅ 成功解析 ${activities.length} 个活动`);
  if (failedSections.length > 0) {
    console.warn(`⚠️ ${failedSections.length} 个活动解析失败:`, failedSections);
  }

  return {
    activities,
    failedSections,
    total: sections.length
  };
}

// ==================== 导出功能 ====================

/**
 * 批量导出为JSON
 */
function exportBatchToJSON() {
  if (!window.parsedBatch || !window.parsedBatch.activities.length) {
    alert('没有可导出的活动！');
    return;
  }

  const activities = window.parsedBatch.activities.map(a => ({
    id: generateId(),
    activityNumber: String(window.parsedBatch.activities.indexOf(a) + 1).padStart(4, '0'),
    title: a.title,
    category: a.category,
    location: a.location,
    price: a.price,
    time: a.time,
    duration: a.duration,
    timeInfo: a.timeInfo,
    weekdays: a.weekdays,
    minPrice: a.minPrice,
    maxPrice: a.maxPrice,
    description: a.description,
    flexibleTime: a.flexibleTime,
    status: a.status,
    requireBooking: a.requireBooking
  }));

  const json = JSON.stringify(activities, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `activities_batch_${Date.now()}.json`;
  a.click();

  URL.revokeObjectURL(url);
  alert(`✅ 已导出 ${activities.length} 个活动！`);
}

/**
 * 批量保存到Excel（需要后端支持）
 */
async function saveBatchToExcel() {
  if (!window.parsedBatch || !window.parsedBatch.activities.length) {
    alert('没有可保存的活动！');
    return;
  }

  // 准备数据
  const activities = window.parsedBatch.activities;

  alert(`📊 准备保存 ${activities.length} 个活动到Excel\n\n⚠️ 此功能需要后端API支持\n\n当前数据已准备好，您可以：\n\n1. 导出为JSON格式\n2. 手动复制到Excel文件\n3. 联系开发者添加后端保存功能`);

  console.log('准备保存的活动数据:', activities);
}
