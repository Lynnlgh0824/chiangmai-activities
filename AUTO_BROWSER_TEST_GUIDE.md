# Chiengmai 自动化浏览器测试使用指南

## 📋 已创建的自动化测试工具

### 1. `auto-browser-test.sh` - Shell 版本（推荐）
**用途**: 使用 curl 快速测试页面可访问性  
**优点**: 无需依赖，运行快速  
**测试内容**:
- ✅ 前端主页访问测试
- ✅ 管理页面访问测试
- ✅ 后端 API 测试
- ✅ 前端资源加载测试
- ✅ 生成测试报告

### 2. `auto-browser-test.py` - Python 版本
**用途**: 使用 Playwright 真实打开浏览器测试  
**优点**: 更真实的用户场景测试  
**依赖**: Python 3 + Playwright  
**测试内容**:
- ✅ Curl 快速测试
- ✅ 浏览器自动化测试（可选）
- ✅ 页面截图保存
- ✅ 标题验证

### 3. `scheduled-test.sh` - 定时测试调度
**用途**: 定期自动运行测试  
**功能**:
- ✅ 自动调用测试脚本
- ✅ 发送系统通知
- ✅ 记录测试日志

### 4. `install-scheduler.sh` - 定时任务安装
**用途**: 配置 macOS 定时任务  
**功能**:
- ✅ 创建 launchd 配置
- ✅ 设置运行间隔（每小时）
- ✅ 配置日志记录

---

## 🚀 快速开始

### 方式 1: 手动运行测试（最简单）

```bash
# 运行 Shell 版本（推荐）
./auto-browser-test.sh

# 或运行 Python 版本
python3 ./auto-browser-test.py
```

**测试结果**: ✅ 6/6 通过

---

### 方式 2: 配置定时自动测试

#### 第 1 步：安装定时任务
```bash
./install-scheduler.sh
```

这会：
- 创建定时任务配置
- 设置每小时运行一次
- 自动发送测试通知

#### 第 2 步：验证定时任务
```bash
# 查看已加载的任务
launchctl list | grep chiengmai

# 查看测试日志
tail -f logs/scheduled-test.log
```

#### 第 3 步：手动触发测试（可选）
```bash
# 立即运行一次定时任务
launchctl start com.chiengmai.test
```

---

## 📊 测试覆盖范围

### Shell 版本测试（6 项）
1. ✅ 前端主页 (HTTP 200)
2. ✅ 主页标题验证
3. ✅ HTML 结构验证
4. ✅ 管理页面 (HTTP 200)
5. ✅ 后端 API 响应
6. ✅ 前端资源加载

### Python 版本测试（额外功能）
1. ✅ 所有 Shell 版本的测试
2. ✅ 浏览器自动化测试
3. ✅ 页面截图保存
4. ✅ 标题详细验证

---

## 📈 测试结果示例

```
=========================================
📊 测试报告
=========================================

⏰ 完成时间: 2026-01-26 01:40:25

✅ 通过: 6
❌ 失败: 0

📋 日志已保存到: logs/auto-browser-20260126-014025.log

🎉 所有测试通过！系统运行正常！

🌐 访问地址:
   主页: http://localhost:5173
   管理: http://localhost:5173/admin.html
   API:  http://localhost:3000/api/health
```

---

## 🔔 自动通知功能

定时任务运行后会发送系统通知：

**测试通过** ✅
```
通知标题: "Chiengmai 测试"
通知内容: "✅ 测试通过"
```

**测试失败** ❌
```
通知标题: "Chiengmai 测试"
通知内容: "❌ 测试失败"
```

---

## 📝 日志文件

### 日志位置
所有测试日志保存在 `logs/` 目录：

```
logs/
├── auto-browser-20260126-014025.log      # 手动测试日志
├── scheduled-test.log                    # 定时任务日志
└── homepage-20260126-014025.png        # 页面截图
```

### 查看日志
```bash
# 查看最新测试日志
ls -lt logs/*.log | head -1

# 查看定时任务日志
tail -f logs/scheduled-test.log
```

---

## 🎯 使用场景

### 场景 1: 开发过程中快速验证
```bash
# 每次修改代码后运行
./auto-browser-test.sh
```

### 场景 2: 部署后验证
```bash
# 部署后立即运行测试
./auto-browser-test.sh
```

### 场景 3: 定时监控（自动）
```bash
# 安装后自动每小时运行
./install-scheduler.sh

# 查看状态
launchctl list | grep chiengmai
```

### 场景 4: CI/CD 集成
```yaml
# .github/workflows/test.yml
- name: Run browser tests
  run: ./auto-browser-test.sh
```

---

## ⚙️ 高级配置

### 修改测试间隔

编辑 `install-scheduler.sh`，修改 `StartInterval` 值：

```xml
<!-- 每 30 分钟 -->
<key>StartInterval</key>
<integer>1800</integer>

<!-- 每 2 小时 -->
<key>StartInterval</key>
<integer>7200</integer>

<!-- 每 24 小时 -->
<key>StartInterval</key>
<integer>86400</integer>
```

### 测试自定义 URL

编辑测试脚本，修改 `FRONTEND_URL` 等变量：

```bash
FRONTEND_URL="http://localhost:5173"  # 改为你的 URL
```

---

## 🛠️ 管理命令

### 查看定时任务状态
```bash
# 查看所有任务
launchctl list

# 查看特定任务
launchctl list | grep chiengmai

# 查看任务详细信息
launchctl print com.chiengmai.test
```

### 启动/停止定时任务
```bash
# 启动任务
launchctl load ~/Library/LaunchAgents/com.chiengmai.test.plist

# 停止任务
launchctl unload ~/Library/LaunchAgents/com.chiengmai.test.plist

# 重启任务
launchctl kickstart -k gui/$(id -u)/com.chiengmai.test
```

---

## 📊 测试失败处理

### 如果测试失败

1. **查看日志**
   ```bash
   cat logs/auto-browser-*.log
   ```

2. **检查服务**
   ```bash
   # 检查服务是否运行
   lsof -i:5173 -i:3000

   # 如果没有运行，启动服务
   ./restart-fixed.sh
   ```

3. **手动测试**
   ```bash
   # 在浏览器中访问
   open http://localhost:5173/
   ```

---

## ✅ 优势总结

### 相比手动测试的优势

| 特性 | 手动测试 | 自动化测试 |
|------|----------|------------|
| **时间** | 每次手动打开浏览器 | 一键运行，3 秒完成 |
| **准确性** | 容易遗漏 | 每次检查完整 |
| **可重复性** | 不同时间不同结果 | 结果一致 |
| **记录** | 需要自己记录 | 自动生成日志 |
| **通知** | 需要自己记住 | 自动发送通知 |
| **定时** | 必须手动运行 | 自动定时运行 |

### 适用场景

- ✅ 日常开发验证
- ✅ CI/CD 集成
- ✅ 定时监控
- ✅ 部署后验证
- ✅ 回归测试

---

## 🎉 开始使用

### 最简单的开始方式

```bash
# 1. 运行测试（现在）
./auto-browser-test.sh

# 2. 配置定时任务（可选）
./install-scheduler.sh

# 3. 完成！
```

现在系统会：
- ✅ 手动测试：随时运行 `./auto-browser-test.sh`
- ✅ 定时测试：每小时自动运行
- ✅ 自动通知：测试结果自动通知

**完全不需要手动打开浏览器测试！**

---

**创建日期**: 2026-01-26  
**测试状态**: ✅ 已验证可用  
**文档版本**: v1.0
