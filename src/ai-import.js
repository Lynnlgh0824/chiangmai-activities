/**
 * AI 智能解析工具 - 增强版
 * 支持多种数据格式：
 * 1. Emoji 格式（🧘📍🕖💰）
 * 2. 结构化文本格式（标题/星期/时间/地点）
 * 3. 原有小红书格式
 */

// ===== Emoji 字段映射 =====
const emojiFieldMap = {
  // 原有emoji
  '🧘': { field: 'category', value: '瑜伽' },
  '🧘‍♀️': { field: 'category', value: '瑜伽' },
  '📍': { field: 'location', extract: true },
  '🕖': { field: 'time', extract: true },
  '💰': { field: 'price', extract: true },
  '⚠️': { field: 'description', extract: true },
  '💡': { field: 'description', extract: true },
  '🥊': { field: 'category', value: '泰拳' },
  '🥋': { field: 'category', value: '咏春拳' },
  '💃': { field: 'category', value: '舞蹈' },
  '🚣': { field: 'category', value: '划船' },
  '🎾': { field: 'category', value: '网球' },
  '⛳': { field: 'category', value: '高尔夫' },
  '🔫': { field: 'category', value: '射击' },
  '🚶': { field: 'category', value: '徒步' },
  '🧗': { field: 'category', value: '攀岩' },
  '🏋️': { field: 'category', value: '健身' },
  '🏋️‍♂️': { field: 'category', value: '健身' },
  '🏊': { field: 'category', value: '游泳' },
  '🏊‍♀️': { field: 'category', value: '游泳' },
  '🌍': { field: 'category', value: '语言交换' },
  '🇺🇸': { field: 'category', value: '英语角' },
  // 新增emoji
  '🎹': { field: 'category', value: '音乐' },
  '🎤': { field: 'category', value: '音乐' },
  '🎸': { field: 'category', value: '音乐' },
  '🥁': { field: 'category', value: '音乐' },
  '🎻': { field: 'category', value: '音乐' },
  '🎨': { field: 'category', value: '艺术' },
  '🖌️': { field: 'category', value: '艺术' },
  '📚': { field: 'category', value: '学习' },
  '✏️': { field: 'category', value: '学习' },
  '🆓': { field: 'price', value: '免费' },
  '🎁': { field: 'price', value: '免费' },
  '⭐': { field: 'rating', extract: true },
};

// 分类映射
const categoryMap = {
  '瑜伽': '瑜伽',
  '摇摆舞': '舞蹈',
  '探戈': '舞蹈',
  '萨尔萨舞': '舞蹈',
  '声音疗愈': '冥想',
  '语言交换': '文化艺术',
  '英语角': '文化艺术',
};

// ===== 主解析函数 =====
function parseText() {
  const inputText = document.getElementById('inputText').value.trim();

  if (!inputText) {
    alert('请先粘贴文本内容');
    return;
  }

  // 检测数据格式
  const format = detectFormat(inputText);

  let results = [];

  if (format === 'emoji') {
    results = parseEmojiFormat(inputText);
  } else if (format === 'descriptive') {
    results = parseDescriptiveFormat(inputText);
  } else if (format === 'structured') {
    results = parseStructuredFormat(inputText);
  } else {
    // 默认格式（原有逻辑）
    results = parseDefaultFormat(inputText);
  }

  displayResults(results);
}

// ===== 格式检测 =====
function detectFormat(text) {
  // 检查是否包含 emoji
  const hasEmoji = /[\p{Emoji}\p{Extended_Pictorial}]/u.test(text);

  // 检查是否有明确的"星期X"独立行
  const hasWeekdayLine = /^[星期周][一二三四五六七八日天]\s*$/m.test(text);

  // 检查是否是新格式：简短标题行 + 📍地点信息
  const lines = text.split('\n').filter(l => l.trim());
  let hasDescriptiveFormat = false;
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    const nextLine = lines[i + 1].trim();
    // 当前行是简短中文标题（2-6字），下一行包含📍
    if (/^[\u4e00-\u9fa5]{2,6}$/.test(line) && nextLine.includes('📍')) {
      hasDescriptiveFormat = true;
      break;
    }
  }

  if (hasEmoji && hasWeekdayLine) {
    // 同时包含 emoji 和星期行，优先用 emoji 格式
    return 'emoji';
  }

  if (hasDescriptiveFormat) {
    return 'descriptive';  // 新的描述性格式
  }

  if (hasEmoji) {
    return 'emoji';
  }

  if (hasWeekdayLine) {
    return 'structured';
  }

  return 'default';
}

// ===== 解析 Emoji 格式 =====
function parseEmojiFormat(text) {
  // 按空行或 ⸻ 分隔符分隔多个活动
  const items = text.split(/\n\s*(?:⸻\s*)?\n|\n\s*⸻\s*\n/).filter(item => item.trim().length > 10);

  return items.map((item, index) => {
    const activity = createEmptyActivity(index);

    const lines = item.split('\n').map(line => line.trim()).filter(line => line);

    // 跳过分隔符行
    if (lines.length === 1 && (lines[0] === '⸻' || lines[0] === '—')) {
      return null;
    }

    lines.forEach(line => {
      // 跳过分隔符
      if (line === '⸻' || line === '—' || line === '―' || line === '＝') {
        return;
      }

      // 检查是否以 emoji 开头
      const emojiMatch = line.match(/^(\p{Extended_Pictorial}\p{Emoji_Component}*)\s*(.+)$/u);
      if (emojiMatch) {
        const emoji = emojiMatch[1];
        const content = emojiMatch[2] ? emojiMatch[2].trim() : '';

        // 查找对应的字段
        for (const [key, config] of Object.entries(emojiFieldMap)) {
          if (emoji.includes(key)) {
            if (config.value) {
              activity[config.field] = config.value;
            } else if (config.extract && content) {
              if (config.field === 'time') {
                extractTimeFromLine(content, activity);
              } else if (config.field === 'price') {
                extractPriceFromLine(content, activity);
              } else if (config.field === 'description') {
                activity.description = (activity.description || '') + content + '\n';
              } else {
                activity[config.field] = content;
              }
            }
            break;
          }
        }
      } else {
        // 不是emoji开头的行，收集为描述（排除纯价格行）
        if (line.length > 5 && !line.match(/^[\d\s🐷฿¥¥$]+$/) && !line.includes('http')) {
          activity.description = (activity.description || '') + line + '\n';
        }
      }
    });

    // 智能时间提取（从整个文本）
    extractTimeInfo(item, activity);

    // 清理描述
    if (activity.description) {
      activity.description = activity.description.trim();
    }

    // 设置默认标题（如果没提取到）
    if (!activity.title) {
      activity.title = activity.category || '未命名活动';
    }

    return activity;
  }).filter(act => act !== null);
}

// ===== 解析描述性格式（新格式：标题 + 📍地点 + 描述） =====
function parseDescriptiveFormat(text) {
  // 按空行分隔，同时过滤掉分类标题行（一、二、三、四等）
  const items = text.split(/\n\s*\n/).filter(item => {
    const trimmed = item.trim();
    // 过滤掉空内容和纯分类标题
    return trimmed.length > 5 && !/^[一二三四五六七八九十]+、[\u4e00-\u9fa5\u4e00-\u9fa5]+$/.test(trimmed);
  });

  return items.map((item, index) => {
    const activity = createEmptyActivity(index);
    const lines = item.split('\n').map(line => line.trim()).filter(line => line);

    let currentActivity = null;

    lines.forEach((line, lineIndex) => {
      // 第一行通常是标题（2-6个中文字符）
      if (lineIndex === 0 && /^[\u4e00-\u9fa5]{2,10}$/.test(line)) {
        activity.title = line;
        // 自动分类
        autoCategorizeByText(line, activity);
        return;
      }

      // 检查📍地点信息
      if (line.includes('📍')) {
        const locationMatch = line.match(/📍\s*([^，。]+)/);
        if (locationMatch) {
          activity.location = locationMatch[1].trim();
          // 提取剩余部分作为描述
          const afterLocation = line.substring(line.indexOf(activity.location) + activity.location.length).trim();
          if (afterLocation && afterLocation.length > 0) {
            activity.description = afterLocation;
          }
        }
        return;
      }

      // 提取价格（支持🐷和其他格式）
      if (line.includes('🐷') || /(\d+)\s*(泰铢|฿)/.test(line)) {
        extractPriceFromLine(line, activity);
        return;
      }

      // 检查"免费"
      if (/免费/i.test(line)) {
        activity.price = '免费';
        activity.priceMin = 0;
        activity.priceMax = 0;
      }

      // 其他长文本作为描述
      if (line.length > 5 && !line.includes('http') && lineIndex > 0) {
        activity.description = (activity.description || '') + line + '\n';
      }
    });

    // 清理描述
    if (activity.description) {
      activity.description = activity.description.trim();
    }

    // 智能时间提取
    extractTimeInfo(item, activity);

    // 设置默认标题
    if (!activity.title) {
      activity.title = activity.category || '未命名活动';
    }

    // 如果是免费或价格信息，设置灵活时间
    if (activity.price === '免费' || (!activity.time && !activity.weekdays.length)) {
      activity.flexibleTime = true;
      activity.time = '灵活时间';
    }

    return activity;
  });
}

// ===== 解析结构化文本格式 =====
function parseStructuredFormat(text) {
  // 按空行分隔多个活动
  const blocks = text.split(/\n\s*\n/).filter(block => block.trim().length > 5);

  const activities = [];
  let currentActivity = null;

  blocks.forEach((block, blockIndex) => {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l);
    const activity = createEmptyActivity(activities.length);

    lines.forEach(line => {
      // 跳过空行和标题行
      if (!line || line === '所有课程均在 3C 楼层举行。' || line.includes('请乘坐钟楼电梯')) {
        return;
      }

      // 检测标题（简短的中文名称）
      if (/^[\u4e00-\u9fa5]{2,10}$/.test(line) &&
          !line.includes('星期') &&
          !line.includes('上午') &&
          !line.includes('下午') &&
          !line.includes('晚上') &&
          !line.includes('地点：') &&
          !line.startsWith('*')) {
        activity.title = line;
        // 自动分类
        for (const [keyword, category] of Object.entries(categoryMap)) {
          if (line.includes(keyword)) {
            activity.category = category;
            break;
          }
        }
        return;
      }

      // 检测星期
      if (/^[星期周][一二三四五六七八日天]\s*$/.test(line)) {
        const dayMap = {
          '一': '周一', '二': '周二', '三': '周三', '四': '周四',
          '五': '周五', '六': '周六', '日': '周日', '天': '周日',
        };
        const day = line.replace(/[星期周]/, '').replace('天', '日');
        activity.weekdays.push(dayMap[day] || day);
        activity.type = 'weekly';
        return;
      }

      // 检测时间（支持"上午/下午/晚上"）
      if (line.includes('上午') || line.includes('下午') || line.includes('晚上')) {
        const timeMatches = line.matchAll(/(\d{1,2}):(\d{2})\s*[-~至]\s*(\d{1,2}):(\d{2})/g);
        for (const match of timeMatches) {
          let hour = parseInt(match[1]);
          const minute = match[2];
          let endHour = parseInt(match[3]);
          const endMinute = match[4];

          // 转换为24小时制
          if (line.includes('上午') && hour === 12) hour = 0;
          if (line.includes('下午') || line.includes('晚上')) {
            if (hour < 12) hour += 12;
            if (endHour < 12) endHour += 12;
          }

          const startTime = `${String(hour).padStart(2, '0')}:${minute}`;
          const endTime = `${String(endHour).padStart(2, '0')}:${endMinute}`;

          if (!activity.time) {
            activity.time = startTime + '-' + endTime;
          } else {
            activity.time += ', ' + startTime + '-' + endTime;
          }
        }
        return;
      }

      // 检测地点
      if (line.startsWith('地点：')) {
        activity.location = line.replace('地点：', '').trim();
        return;
      }

      // 检测价格（捐赠信息）
      if (line.includes('捐赠') || line.includes('泰铢')) {
        const priceMatch = line.match(/(\d+)\s*泰铢/);
        if (priceMatch) {
          activity.price = `捐赠 ${priceMatch[1]}泰铢`;
          activity.priceMin = parseInt(priceMatch[1]);
          activity.priceMax = parseInt(priceMatch[1]);
        }
        if (line.includes('免费')) {
          if (activity.price) {
            activity.price += '（可捐赠）';
          } else {
            activity.price = '免费（可捐赠）';
          }
          activity.priceMin = 0;
        }
        return;
      }

      // 注意事项（以 * 开头）
      if (line.startsWith('*')) {
        activity.description = (activity.description || '') + line + '\n';
        return;
      }

      // 其他长文本作为描述
      if (line.length > 10 && !line.startsWith('http')) {
        activity.description = (activity.description || '') + line + ' ';
      }
    });

    // 清理描述
    if (activity.description) {
      activity.description = activity.description.trim();
    }

    // 设置默认值
    if (!activity.title) {
      activity.title = '未命名活动';
    }

    if (!activity.time && activity.weekdays.length > 0) {
      activity.time = '灵活时间';
    }

    activities.push(activity);
  });

  return activities;
}

// ===== 解析默认格式（原有逻辑） =====
function parseDefaultFormat(text) {
  // 按 --- 或 === 分隔
  const items = text.split(/\n\s*-+\s*\n|\n\s*={3,}\s*\n/).filter(item => item.trim().length > 10);

  return items.map((item, index) => {
    const lines = item.split('\n').map(line => line.trim()).filter(line => line);
    const activity = createEmptyActivity(index);

    // 提取标题
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i];
      if (line.length > 5 && line.length < 50 && !line.includes('￥') && !line.includes('฿')) {
        activity.title = line;
        break;
      }
    }

    // 原有的提取逻辑...
    extractPriceInfo(text, activity);
    extractTimeInfo(text, activity);
    extractLocation(text, activity);
    autoCategorize(text, activity);

    // 提取描述
    const descriptionLines = lines.filter(line =>
      line.length > 10 &&
      !line.includes('http') &&
      !line.includes('฿') &&
      !line.includes('￥')
    );
    activity.description = descriptionLines.slice(0, 3).join(' ').substring(0, 200);

    return activity;
  });
}

// ===== 创建空的活动对象 =====
function createEmptyActivity(index) {
  return {
    id: Date.now() + index,
    title: '',
    category: '其他',
    description: '',
    price: '待询价',
    priceMin: 0,
    priceMax: 0,
    time: '',
    date: '',
    weekdays: [],
    location: '清迈',
    duration: '2小时',
    flexibleTime: false,
    type: 'once',
    url: '',
  };
}

// ===== 从一行提取时间 =====
function extractTimeFromLine(line, activity) {
  // 检查"每天"
  if (/每天/i.test(line)) {
    activity.weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    activity.type = 'weekly';
  }

  // 检查"每周X"
  const weekdayMatch = line.match(/每周([一二三四五六七])/);
  if (weekdayMatch) {
    const dayMap = { '一': '周一', '二': '周二', '三': '周三', '四': '周四', '五': '周五', '六': '周六', '七': '周日' };
    const day = dayMap[weekdayMatch[1]];
    if (!activity.weekdays.includes(day)) {
      activity.weekdays.push(day);
    }
    activity.type = 'weekly';
  }

  // 提取时间范围
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*[-~至to]*\s*(\d{1,2}):(\d{2})/,
    /(\d{1,2})\s*[-~至]\s*(\d{1,2})\s*(?:点|pm|am)?/i,
  ];

  for (const pattern of timePatterns) {
    const match = line.match(pattern);
    if (match) {
      if (match[1].includes(':')) {
        activity.time = `${match[1]}-${match[3]}:${match[4]}`;
      } else {
        const start = match[1].padStart(2, '0') + ':00';
        const end = match[2].padStart(2, '0') + ':00';
        activity.time = `${start}-${end}`;
      }
      break;
    }
  }
}

// ===== 从一行提取价格 =====
function extractPriceFromLine(line, activity) {
  // 检查"免费"
  if (/免费/i.test(line)) {
    activity.price = '免费';
    activity.priceMin = 0;
    activity.priceMax = 0;
    return;
  }

  // 提取价格（支持🐷符号和各种格式）
  const pricePatterns = [
    // 100–400🐷 格式
    /(\d+)\s*[-–—]\s*(\d+)\s*🐷/,
    // 单价格式：300🐷
    /(\d+)\s*🐷/,
    // 1100铢=245元 格式
    /(\d+)\s*(?:铢|泰铢|฿|THB|บาท)\s*[=＝]\s*(?:约)?[¥￥]?\s*(\d+)\s*元/,
    // 价格范围：500-1000泰铢
    /(\d+)\s*[-~至]\s*(\d+)\s*(铢|泰铢|฿|THB|บาท)/,
    // 单价：500泰铢
    /(\d+)\s*(铢|泰铢|฿|THB|บาท)/,
  ];

  for (const pattern of pricePatterns) {
    const match = line.match(pattern);
    if (match) {
      if (match[2]) {
        // 价格范围
        if (match[0].includes('🐷')) {
          activity.price = `${match[1]}-${match[2]}泰铢`;
          activity.priceMin = parseInt(match[1]);
          activity.priceMax = parseInt(match[2]);
        } else if (match[0].includes('=')) {
          // 1100铢=245元 格式，只取泰铢
          activity.price = `${match[1]}泰铢`;
          activity.priceMin = parseInt(match[1]);
          activity.priceMax = parseInt(match[1]);
        } else {
          activity.price = `${match[1]}-${match[2]}${match[3]}`;
          activity.priceMin = parseInt(match[1]);
          activity.priceMax = parseInt(match[2]);
        }
      } else {
        const currency = match[0].includes('🐷') ? '泰铢' : (match[match.length - 1] || '泰铢');
        activity.price = `${match[1]}${currency}`;
        activity.priceMin = parseInt(match[1]);
        activity.priceMax = parseInt(match[1]);
      }
      break;
    }
  }
}

// ===== 智能时间提取 =====
function extractTimeInfo(text, activity) {
  // 如果已经有时间信息，跳过
  if (activity.time || activity.weekdays.length > 0) {
    return;
  }

  // 检查"每天"
  if (/每天/i.test(text)) {
    activity.weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    activity.type = 'weekly';
  }

  // 检查"每周X"
  const weekdayMatch = text.match(/每周([一二三四五六七])/);
  if (weekdayMatch) {
    const dayMap = { '一': '周一', '二': '周二', '三': '周三', '四': '周四', '五': '周五', '六': '周六', '七': '周日' };
    const day = dayMap[weekdayMatch[1]];
    if (!activity.weekdays.includes(day)) {
      activity.weekdays.push(day);
    }
    activity.type = 'weekly';
  }

  // 提取时间范围
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*[-~至to]*\s*(\d{1,2}):(\d{2})/,
    /(\d{1,2})点(\d{0,2})\s*[-~至]*\s*(\d{1,2})点(\d{0,2})/,
    /(\d{1,2})\s*[-~至]\s*(\d{1,2})\s*(?:点|pm|am)?/i,
  ];

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[1].includes(':')) {
        activity.time = `${match[1]}-${match[3]}`;
      } else {
        const start = match[1].padStart(2, '0') + ':00';
        const end = match[2] ? match[2].padStart(2, '0') + ':00' : '00';
        activity.time = `${start}-${end}`;
      }
      break;
    }
  }
}

// ===== 智能价格提取 =====
function extractPriceInfo(text, activity) {
  if (activity.price !== '待询价') {
    return; // 已经提取过
  }

  if (/免费/i.test(text)) {
    activity.price = '免费';
    activity.priceMin = 0;
    activity.priceMax = 0;
    return;
  }

  const pricePatterns = [
    /(\d+)\s*(?:铢|泰铢|฿|THB|บาท)\s*[=＝]\s*(?:约)?[¥￥]?\s*(\d+)\s*元/,
    /(\d+)\s*[-~至]\s*(\d+)\s*(铢|泰铢|฿|THB|บาท)/,
    /(\d+)\s*(铢|泰铢|฿|THB|บาท)/,
    /约?\s*[¥￥]?\s*(\d+)\s*元/,
  ];

  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2] && match[0].includes('=')) {
        activity.price = `${match[1]}泰铢`;
        activity.priceMin = parseInt(match[1]);
        activity.priceMax = parseInt(match[1]);
      } else if (match[2]) {
        activity.price = `${match[1]}-${match[2]}${match[3]}`;
        activity.priceMin = parseInt(match[1]);
        activity.priceMax = parseInt(match[2]);
      } else {
        activity.price = `${match[1]}${match[match.length - 1]}`;
        activity.priceMin = parseInt(match[1]);
        activity.priceMax = parseInt(match[1]);
      }
      break;
    }
  }
}

// ===== 智能地点提取 =====
function extractLocation(text, activity) {
  if (activity.location !== '清迈') {
    return; // 已经提取过
  }

  const locationPatterns = [
    /清迈([^，。\n]{2,15})/,
    /宁曼路/,
    /古城/,
    /塔佩门/,
    /素贴山/,
    /湄平河/,
    /Nong Buak Haad/,
    /宁曼1号/,
    /Moat House/,
    /Much Room Cafe/,
    /清迈客栈/,
    /Wat Fa Ham/,
    /TK Academy/,
    /Lanna Golf/,
    /Thai Green/,
    /Main Wall/,
    /Go gym/,
    /HUAYKAEW/,
    /One Nimman/,
  ];

  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      activity.location = match[0];
      break;
    }
  }
}

// ===== 自动分类 =====
function autoCategorize(text) {
  const categoryKeywords = {
    '瑜伽': ['瑜伽', 'Yoga', 'yoga'],
    '冥想': ['冥想', 'meditation', '声音疗愈'],
    '美食体验': ['烹饪', '美食', '泰餐', 'cooking', '厨艺'],
    '户外探险': ['泰拳', '拳击', '徒步', 'trekking', '攀岩'],
    '文化艺术': ['泰语', '文化', '艺术', '手工艺', '语言交换', '英语角'],
    '舞蹈': ['摇摆舞', '探戈', '萨尔萨舞'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()))) {
      return category;
    }
  }

  return '其他';
}

// ===== 根据标题自动分类 =====
function autoCategorizeByText(title, activity) {
  const categoryMap = {
    '瑜伽': ['瑜伽', 'Yoga', 'yoga'],
    '冥想': ['冥想', 'meditation'],
    '音乐': ['钢琴', '声乐', '音乐', '钢琴', '声乐'],
    '艺术': ['艺术', '画画', '绘画', '美术馆', '博物馆'],
    '文化艺术': ['语言交换', '英语角', '泰语', '语言'],
    '舞蹈': ['摇摆舞', '探戈', '萨尔萨舞', '尊巴'],
    '泰拳': ['泰拳', '拳击', '拳'],
    '户外探险': ['跑步', '马拉松', '露营', '徒步'],
    '健身': ['健身', '尊巴', '运动'],
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(keyword => title.includes(keyword))) {
      activity.category = category;
      return;
    }
  }
}

// ===== 显示结果 =====
function displayResults(results) {
  const resultDiv = document.getElementById('result');

  if (results.length === 0) {
    resultDiv.innerHTML = '<p style="color: #999; text-align: center; padding: 50px 0;">未解析到任何数据</p>';
    return;
  }

  let html = `<p style="margin-bottom: 20px;">✅ 成功解析 ${results.length} 条活动数据</p>`;

  results.forEach((item, index) => {
    const typeText = item.type === 'weekly' ? '固定频率活动' : '临时活动';
    const timeInfo = item.type === 'weekly'
      ? `星期: ${(item.weekdays || []).join(', ')} | 时间: ${item.time || '未设置'}`
      : `日期: ${item.date || '未设置'} | 时间: ${item.time || '未设置'}`;

    html += `
      <div class="result-item">
        <h3>${index + 1}. ${item.title || '未命名活动'}</h3>
        <p><strong>类型:</strong> ${typeText}</p>
        <p><strong>分类:</strong> ${item.category}</p>
        <p><strong>价格:</strong> ${item.price}</p>
        <p><strong>${timeInfo}</strong></p>
        <p><strong>地点:</strong> ${item.location}</p>
        ${item.description ? `<p><strong>描述:</strong> ${item.description.substring(0, 100)}...</p>` : ''}
        ${item.url ? `<p><strong>链接:</strong> <a href="${item.url}" target="_blank">${item.url}</a></p>` : ''}
      </div>
    `;
  });

  html += `
    <button class="export-btn" onclick="exportData()">
      📊 导出为 JSON（写入 Excel）
    </button>
  `;

  resultDiv.innerHTML = html;
  window.parsedData = results;
}

// ===== 清空所有 =====
function clearAll() {
  document.getElementById('inputText').value = '';
  document.getElementById('result').innerHTML = '<p style="color: #999; text-align: center; padding: 50px 0;">解析结果将显示在这里...</p>';
  window.parsedData = null;
}

// ===== 导出数据 =====
function exportData() {
  if (!window.parsedData || window.parsedData.length === 0) {
    alert('没有数据可导出');
    return;
  }

  const dataStr = JSON.stringify(window.parsedData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-import-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  alert('✅ JSON 文件已导出！\n\n下一步操作：\n1. 将下载的 JSON 文件移动到 scraper 目录\n2. 打开终端，进入 scraper 目录\n3. 运行命令:\n   node excel-writer-import.js <你的文件名>.json\n4. 数据将自动写入到清迈活动数据.xlsx');
}

// ===== 图片上传处理 =====

// 拖放处理
document.addEventListener('DOMContentLoaded', function() {
  const uploadArea = document.getElementById('uploadArea');

  if (uploadArea) {
    // 拖放事件
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#667eea';
      uploadArea.style.background = '#f0f0ff';
    });

    uploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#ddd';
      uploadArea.style.background = '#fafafa';
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#ddd';
      uploadArea.style.background = '#fafafa';

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleImageFile(files[0]);
      }
    });

    // 点击上传
    uploadArea.addEventListener('click', () => {
      document.getElementById('imageInput').click();
    });
  }
});

// 处理文件选择
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    handleImageFile(file);
  }
}

// 处理图片文件
function handleImageFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    // 显示预览
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const uploadArea = document.getElementById('uploadArea');

    previewImg.src = e.target.result;
    preview.style.display = 'block';
    uploadArea.style.display = 'none';

    // 提示用户
    alert('✅ 图片已上传！\n\n💡 使用方法：\n1. 查看上方图片中的文字内容\n2. 手动复制文字（Ctrl+C / Cmd+C）\n3. 粘贴到下方输入框\n4. 点击"AI 智能解析"按钮\n\n提示：您可以随时移除图片并上传其他图片');
  };
  reader.readAsDataURL(file);
}

// 清除图片
function clearImage() {
  const preview = document.getElementById('imagePreview');
  const uploadArea = document.getElementById('uploadArea');
  const imageInput = document.getElementById('imageInput');

  preview.style.display = 'none';
  uploadArea.style.display = 'block';
  imageInput.value = '';

  if (document.getElementById('previewImg')) {
    document.getElementById('previewImg').src = '';
  }
}
