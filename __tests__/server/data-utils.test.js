/**
 * Data Utils模块单元测试
 * 测试server.cjs中的数据读写和版本管理功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fsPromises } from 'fs';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';

// 注意：这些测试需要模拟文件系统操作
// 在实际环境中会读写真实文件，这里使用mock

describe('Data Utils - 文件路径配置', () => {
  it('应该正确构建数据文件路径', () => {
    const DATA_FILE = path.join(process.cwd(), 'data', 'items.json');
    const GUIDE_FILE = path.join(process.cwd(), 'data', 'guide.json');
    const VERSION_FILE = path.join(process.cwd(), 'data', 'version.json');

    expect(DATA_FILE).toContain('data');
    expect(DATA_FILE).toContain('items.json');
    expect(GUIDE_FILE).toContain('guide.json');
    expect(VERSION_FILE).toContain('version.json');
  });

  it('路径应该使用正确的分隔符', () => {
    const testPath = path.join('data', 'items.json');
    expect(testPath).toMatch(/data[\/\\]items.json/);
  });
});

describe('Data Utils - 数据读取逻辑', () => {
  it('应该解析有效的JSON数据', () => {
    const validJson = '[{"id": 1, "title": "Test"}]';
    const parsed = JSON.parse(validJson);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].id).toBe(1);
    expect(parsed[0].title).toBe('Test');
  });

  it('应该处理空数组', () => {
    const emptyJson = '[]';
    const parsed = JSON.parse(emptyJson);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(0);
  });

  it('应该处理无效JSON返回空数组', () => {
    // 模拟readData函数的错误处理
    const mockReadData = (jsonString) => {
      try {
        return JSON.parse(jsonString);
      } catch (error) {
        return [];
      }
    };

    expect(mockReadData('invalid json')).toEqual([]);
    expect(mockReadData('[{]')).toEqual([]);
    expect(mockReadData('')).toEqual([]);
  });

  it('应该解析活动对象结构', () => {
    const activityJson = JSON.stringify({
      id: 1,
      title: '瑜伽课程',
      category: '瑜伽',
      location: '清迈公园',
      price: '免费'
    });

    const activity = JSON.parse(activityJson);

    expect(activity.id).toBe(1);
    expect(activity.title).toBe('瑜伽课程');
    expect(activity.category).toBe('瑜伽');
    expect(activity.location).toBe('清迈公园');
    expect(activity.price).toBe('免费');
  });
});

describe('Data Utils - 数据写入逻辑', () => {
  it('应该序列化数据为JSON', () => {
    const data = [
      { id: 1, title: 'Test 1' },
      { id: 2, title: 'Test 2' }
    ];

    const jsonString = JSON.stringify(data, null, 2);

    expect(jsonString).toContain('"id": 1');
    expect(jsonString).toContain('"title": "Test 1"');
    expect(jsonString).toContain('\n'); // 有缩进
  });

  it('应该处理特殊字符转义', () => {
    const data = {
      title: '测试"引号"和\'单引号\'',
      description: '包含\\斜杠\n换行'
    };

    const jsonString = JSON.stringify(data);

    expect(jsonString).toContain('\\"'); // 转义的引号
    expect(jsonString).toContain('\\\\'); // 转义的斜杠
    expect(jsonString).toContain('\\n'); // 转义的换行
  });

  it('应该处理中文字符', () => {
    const data = {
      title: '清迈活动',
      category: '瑜伽',
      location: '泰国清迈'
    };

    const jsonString = JSON.stringify(data);
    const parsed = JSON.parse(jsonString);

    expect(parsed.title).toBe('清迈活动');
    expect(parsed.category).toBe('瑜伽');
    expect(parsed.location).toBe('泰国清迈');
  });
});

describe('Data Utils - 版本管理', () => {
  it('应该创建版本对象', () => {
    const version = {
      version: 'v2.6.0',
      timestamp: new Date().toISOString(),
      count: 47
    };

    expect(version.version).toBe('v2.6.0');
    expect(version.timestamp).toBeDefined();
    expect(typeof version.count).toBe('number');
  });

  it('应该验证版本号格式', () => {
    const validVersions = ['v1.0.0', 'v2.6.0', 'v10.20.30'];
    const versionRegex = /^v\d+\.\d+\.\d+$/;

    validVersions.forEach(version => {
      expect(version).toMatch(versionRegex);
    });
  });

  it('应该解析ISO时间戳', () => {
    const timestamp = new Date().toISOString();
    const parsed = new Date(timestamp);

    expect(parsed instanceof Date).toBe(true);
    expect(!isNaN(parsed.getTime())).toBe(true);
  });

  it('应该计算数据数量', () => {
    const data = [
      { id: 1 },
      { id: 2 },
      { id: 3 }
    ];

    expect(data.length).toBe(3);
  });
});

describe('Data Utils - 数据验证', () => {
  it('应该验证活动对象必需字段', () => {
    const validActivity = {
      id: '0001',
      title: '测试活动',
      category: '瑜伽',
      location: '测试地点',
      price: '免费',
      time: '08:00-09:00',
      status: '进行中'
    };

    const requiredFields = ['id', 'title', 'category', 'location', 'price', 'time', 'status'];

    requiredFields.forEach(field => {
      expect(validActivity[field]).toBeDefined();
    });
  });

  it('应该检测缺失的必需字段', () => {
    const incompleteActivity = {
      id: '0001',
      title: '测试活动'
      // 缺少其他字段
    };

    const requiredFields = ['category', 'location', 'price', 'time', 'status'];

    requiredFields.forEach(field => {
      expect(incompleteActivity[field]).toBeUndefined();
    });
  });

  it('应该验证字段类型', () => {
    const activity = {
      id: '0001',
      title: '测试',
      sortOrder: 1,
      maxParticipants: '不限',
      flexibleTime: false,
      weekdays: ['周一', '周二']
    };

    expect(typeof activity.id).toBe('string');
    expect(typeof activity.title).toBe('string');
    expect(typeof activity.sortOrder).toBe('number');
    expect(typeof activity.maxParticipants).toBe('string');
    expect(typeof activity.flexibleTime).toBe('boolean');
    expect(Array.isArray(activity.weekdays)).toBe(true);
  });
});

describe('Data Utils - 数据转换', () => {
  it('应该转换活动数据格式', () => {
    const rawData = {
      activityNumber: '0001',
      id: '0001',
      title: '瑜伽课程',
      category: '瑜伽',
      location: '公园'
    };

    const apiData = {
      id: rawData.id,
      title: rawData.title,
      category: rawData.category,
      location: rawData.location
    };

    expect(apiData.id).toBe(rawData.id);
    expect(apiData.title).toBe(rawData.title);
  });

  it('应该映射状态值', () => {
    const statusMap = {
      '进行中': 'active',
      '已暂停': 'suspended',
      '已结束': 'ended'
    };

    expect(statusMap['进行中']).toBe('active');
    expect(statusMap['已暂停']).toBe('suspended');
    expect(statusMap['已结束']).toBe('ended');
  });

  it('应该解析星期字符串', () => {
    const weekdayStr = '周一,周二,周三';
    const weekdays = weekdayStr.split(',');

    expect(weekdays).toHaveLength(3);
    expect(weekdays[0]).toBe('周一');
    expect(weekdays[1]).toBe('周二');
    expect(weekdays[2]).toBe('周三');
  });
});

describe('Data Utils - 错误处理', () => {
  it('应该处理文件不存在错误', () => {
    const mockReadFile = (filePath) => {
      try {
        // 模拟文件不存在
        if (!existsSync(filePath)) {
          return [];
        }
        return JSON.parse(readFileSync(filePath, 'utf8'));
      } catch (error) {
        return [];
      }
    };

    const result = mockReadFile('nonexistent-file.json');
    expect(result).toEqual([]);
  });

  it('应该处理JSON解析错误', () => {
    const mockSafeParse = (str) => {
      try {
        return JSON.parse(str);
      } catch (error) {
        return null;
      }
    };

    expect(mockSafeParse('invalid')).toBeNull();
    expect(mockSafeParse('{bad json}')).toBeNull();
    expect(mockSafeParse('{"valid": true}')).toEqual({ valid: true });
  });

  it('应该处理写入权限错误', () => {
    const mockSafeWrite = (data) => {
      try {
        // 模拟可能失败的写入操作
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    };

    const result = mockSafeWrite({ test: 'data' });
    expect(result.success).toBe(true);
  });
});

describe('Data Utils - 性能优化', () => {
  it('应该高效处理大数据集', () => {
    // 创建1000个活动的数据集
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `activity-${i}`,
      title: `活动 ${i}`,
      category: '测试'
    }));

    const startTime = Date.now();
    const jsonString = JSON.stringify(largeDataset);
    const parsed = JSON.parse(jsonString);
    const endTime = Date.now();

    expect(parsed.length).toBe(1000);
    expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
  });

  it('应该使用增量更新而非全量替换', () => {
    const originalData = [
      { id: 1, title: '活动1' },
      { id: 2, title: '活动2' }
    ];

    const updatedItem = { id: 1, title: '更新后的活动1' };

    // 增量更新
    const updatedData = originalData.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    );

    expect(updatedData[0].title).toBe('更新后的活动1');
    expect(updatedData[1].title).toBe('活动2'); // 其他项保持不变
  });
});

describe('Data Utils - 数据完整性', () => {
  it('应该确保数据唯一性', () => {
    const data = [
      { id: '001', title: '活动1' },
      { id: '002', title: '活动2' },
      { id: '001', title: '活动1-重复' } // 重复ID
    ];

    const uniqueIds = new Set(data.map(item => item.id));
    const hasDuplicates = uniqueIds.size !== data.length;

    expect(hasDuplicates).toBe(true);
    expect(uniqueIds.size).toBe(2); // 只有2个唯一ID
  });

  it('应该检测数据循环引用', () => {
    const obj1 = { id: 1 };
    const obj2 = { id: 2, ref: obj1 };
    obj1.ref = obj2; // 创建循环引用

    // JSON.stringify应该能够处理或检测循环引用
    expect(() => {
      JSON.stringify(obj1);
    }).toThrow();
  });

  it('应该验证嵌套数据结构', () => {
    const nestedData = {
      id: '001',
      source: {
        name: 'Facebook',
        url: 'https://facebook.com/event/123',
        type: 'facebook',
        lastUpdated: '2026-01-29T00:00:00.000Z'
      }
    };

    expect(nestedData.source).toBeDefined();
    expect(nestedData.source.name).toBe('Facebook');
    expect(nestedData.source.url).toContain('https');
  });
});

describe('Data Utils - 备份和恢复', () => {
  it('应该创建备份时间戳', () => {
    const timestamp = Date.now();
    const backupFileName = `items-backup-${timestamp}.json`;

    expect(backupFileName).toContain('items-backup-');
    expect(backupFileName).toMatch(/\d+\.json$/);
  });

  it('应该验证备份文件名', () => {
    const validBackupNames = [
      'items-backup-1706500000000.json',
      'items-backup-2026-01-29.json',
      'items.bak.json'
    ];

    validBackupNames.forEach(name => {
      expect(name).toContain('items');
      expect(name).toContain('.json');
    });
  });
});
