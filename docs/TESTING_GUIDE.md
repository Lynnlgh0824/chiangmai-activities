# Chiengmai 自动化测试指南

## 快速开始

### 运行所有测试
```bash
# 方式1: 使用 npm（推荐）
npm run test

# 方式2: 使用 Python 脚本
python3 test-all.py

# 方式3: 使用 Bash 快捷方式
./test.sh
```

### 快速测试（跳过数据一致性检查）
```bash
npm run test:fast
# 或
python3 test-all.py --fast
```

### 不自动启动服务的测试
```bash
python3 test-all.py --no-start
```

---

## 测试内容

### 1. 主页功能测试
- ✅ 检查页面可访问性
- ✅ 验证页面标题
- ✅ 检查 React 应用容器
- ✅ 验证 JavaScript 加载
- ✅ 测试后端 API 连接

### 2. 日历页面功能测试
- ✅ 检查日历页面访问
- ✅ 验证 React 路由
- ✅ 检查脚本加载

### 3. 管理后台功能测试
- ✅ 检查管理页面访问
- ✅ 验证独立 HTML 页面
- ✅ 检查表单元素

### 4. API 端点测试
- ✅ 活动列表 API (/api/activities)
- ✅ 所有数据 API (/api/items)
- ✅ 健康检查 API (/api/health)

### 5. 数据一致性检查（快速模式跳过）
- ✅ 数据格式验证
- ✅ 必需字段检查
- ✅ 数据量验证
- ✅ 分类数据检查

---

## 测试报告

测试完成后会生成：
- **控制台输出**: 彩色的测试结果
- **日志文件**: logs/test-YYYYMMDD-HHMMSS.log

---

## NPM Scripts

```json
{
  "scripts": {
    "test": "python3 test-all.py",
    "test:fast": "python3 test-all.py --fast",
    "check": "python3 test-all.py --fast --no-start"
  }
}
```

---

## 更新日志

### v2.0.0 (2026-01-26)
- ✅ 创建统一测试脚本 test-all.py
- ✅ 添加自动启动服务功能
- ✅ 添加日志记录
- ✅ 修复 React 根容器检测
- ✅ 添加错误处理和重试机制
- ✅ 清理冗余脚本
