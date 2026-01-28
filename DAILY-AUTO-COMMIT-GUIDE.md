# 每日自动提交系统使用指南

**创建时间**: 2026-01-29
**目的**: 每天自动检查代码变更、运行测试、提交更新

---

## 🎯 系统概述

### 功能特性

✅ **自动化流程**
- 每天0点自动检查代码变更
- 运行测试验证功能
- 自动提交并推送更新
- 生成每日报告

✅ **CI/CD集成**
- GitHub Actions自动测试
- Pull Request自动检查
- 提交历史记录

✅ **安全性**
- 测试失败时不提交
- 详细的日志记录
- 手动审查机制

---

## 📋 系统组件

### 1. GitHub Actions工作流

**文件**: `.github/workflows/daily-auto-commit.yml`

**触发条件**:
- **定时触发**: 每天0点（UTC 16:00）
- **手动触发**: GitHub网页点击
- **Push触发**: 推送到main分支
- **PR触发**: 创建Pull Request

**工作内容**:
```yaml
Job 1: test         - 运行音乐Tab测试
Job 2: check        - 检查代码变更
Job 3: daily-report - 生成每日报告
```

### 2. 本地自动提交脚本

**文件**: `scripts/daily-auto-commit.sh`

**执行流程**:
```
1. 初始化（创建日志目录）
   ↓
2. 检查Git状态（是否有未提交的更改）
   ↓
3. 运行测试（音乐Tab、时间排序、音乐Tab数量）
   ↓
4. 提交更改（如果测试通过）
   ↓
5. 推送到远程仓库
   ↓
6. 生成每日报告
   ↓
7. 发送通知
```

---

## 🚀 安装和配置

### 步骤1: 设置Crontab定时任务

**编辑crontab**:
```bash
crontab -e
```

**添加以下行**（每天0点执行）:
```bash
# 每天0点运行自动提交脚本
0 0 * * * /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/scripts/daily-auto-commit.sh >> /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/logs/cron.log 2>&1
```

**保存并退出**:
- Vim: `:wq` + Enter
- Nano: `Ctrl+O` + Enter, `Ctrl+X`

### 步骤2: 验证Crontab

**查看当前crontab**:
```bash
crontab -l
```

**应该看到**:
```
# 每天0点运行自动提交脚本
0 0 * * * /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/scripts/daily-auto-commit.sh >> /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/logs/cron.log 2>&1
```

### 步骤3: 测试脚本

**手动运行一次**:
```bash
cd /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai
./scripts/daily-auto-commit.sh
```

**预期输出**:
```
[2026-01-29 00:00:00] ==========================================
[2026-01-29 00:00:00] 每日自动提交脚本启动
[2026-01-29 00:00:00] ==========================================
[2026-01-29 00:00:00] 工作目录: /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai
[2026-01-29 00:00:00] 日志文件: logs/daily-auto-commit-20260129.log
...
```

### 步骤4: 检查日志

**查看今天的日志**:
```bash
cat /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/logs/daily-auto-commit-$(date +%Y%m%d).log
```

**查看crontab日志**:
```bash
cat /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/logs/cron.log
```

---

## 📊 监控和报告

### 每日报告位置

**报告文件**: `logs/daily-report-YYYYMMDD.md`

**查看最新报告**:
```bash
cat logs/daily-report-$(date +%Y%m%d).md
```

**报告内容**:
- 代码状态（Git状态、最新提交）
- 测试结果（功能检查）
- 更新摘要（修改的文件）
- 相关链接（GitHub、测试页面）

### GitHub Actions报告

**访问地址**:
```
https://github.com/Lynnlgh0824/Chiengmai/actions
```

**查看工作流**:
- 点击"每日自动提交和测试"
- 查看运行历史
- 查看测试结果

---

## 🔧 手动操作

### 手动触发自动提交

**方法1: 直接运行脚本**
```bash
cd /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai
./scripts/daily-auto-commit.sh
```

**方法2: GitHub Actions手动触发**
1. 访问 https://github.com/Lynnlgh0824/Chiengmai/actions
2. 选择"每日自动提交和测试"
3. 点击"Run workflow"
4. 选择分支（main）
5. 点击"Run workflow"按钮

### 查看最近提交

**本地查看**:
```bash
cd /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai
git log --oneline -10
```

**查看GitHub**:
```
https://github.com/Lynnlgh0824/Chiengmai/commits/main
```

---

## ⚙️ 配置选项

### 修改执行时间

**默认**: 每天0点

**修改为其他时间**（例如每天早上6点）:
```bash
# 编辑crontab
crontab -e

# 修改为:
0 6 * * * /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/scripts/daily-auto-commit.sh >> /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/logs/cron.log 2>&1
```

### 修改执行频率

**每小时执行一次**:
```bash
0 * * * * /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/scripts/daily-auto-commit.sh >> /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/logs/cron.log 2>&1
```

**每周执行一次**（每周日0点）:
```bash
0 0 * * 0 /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/scripts/daily-auto-commit.sh >> /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/logs/cron.log 2>&1
```

**Crontab时间格式**:
```
* * * * * 命令
│ │ │ │ │
│ │ │ │ └─ 星期几 (0-7, 0和7都是周日)
│ │ │ └─── 月份 (1-12)
│ │ └───── 日期 (1-31)
│ └─────── 小时 (0-23)
└───────── 分钟 (0-59)
```

---

## 🛡️ 安全措施

### 测试失败保护

脚本会在以下情况下**拒绝提交**:
- ❌ 音乐Tab测试失败
- ❌ compareTimes函数缺失
- ❌ extractEndTime函数缺失
- ❌ 音乐Tab引用少于10处

**测试失败时的行为**:
```
[2026-01-29 00:00:30] ERROR: ❌ 有测试失败，跳过自动提交
[2026-01-29 00:00:30] 脚本执行失败
```

### 手动审查

即使自动提交成功，也应该:
1. 查看每日报告
2. 检查GitHub提交历史
3. 运行手动测试验证
4. 如有问题，手动回滚

---

## 📝 工作流程示例

### 示例1: 正常工作流

**场景**: 有代码更新，测试通过

```
0:00 - Cron触发脚本
  ↓
检查Git状态 → 发现未提交的更改
  ↓
运行测试 → 所有测试通过
  ↓
生成提交信息 → "auto: 每日自动提交 - 2026-01-29 00:00"
  ↓
git add -A
  ↓
git commit -m "..."
  ↓
git push origin main → 成功
  ↓
生成每日报告
  ↓
发送通知
```

### 示例2: 测试失败

**场景**: 有代码更新，但测试失败

```
0:00 - Cron触发脚本
  ↓
检查Git状态 → 发现未提交的更改
  ↓
运行测试 → 测试失败
  ↓
记录错误到日志
  ↓
跳过自动提交
  ↓
脚本退出（状态码1）
```

### 示例3: 无更新

**场景**: 没有代码更新

```
0:00 - Cron触发脚本
  ↓
检查Git状态 → 没有未提交的更改
  ↓
生成每日报告
  ↓
脚本退出（状态码0）
```

---

## 🐛 故障排查

### 问题1: Cron没有执行

**检查crontab**:
```bash
crontab -l
```

**检查cron服务**:
```bash
# macOS
sudo launchctl list | grep cron

# Linux
systemctl status cron
```

**查看cron日志**:
```bash
cat /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/logs/cron.log
```

### 问题2: 脚本执行失败

**查看详细日志**:
```bash
cat logs/daily-auto-commit-$(date +%Y%m%d).log
```

**手动运行测试**:
```bash
cd /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai
./scripts/daily-auto-commit.sh
```

**常见错误**:
- 权限问题: `chmod +x scripts/daily-auto-commit.sh`
- 路径错误: 检查`PROJECT_DIR`配置
- Git未配置: `git config user.name` 和 `git config user.email`

### 问题3: 测试失败

**运行音乐Tab测试**:
```bash
node test-music-tab.cjs
```

**检查函数是否存在**:
```bash
grep "function compareTimes" public/index.html
grep "function extractEndTime" public/index.html
```

**检查音乐Tab**:
```bash
grep -c "音乐" public/index.html
```

---

## 📚 相关文档

- [FINAL-SUMMARY-CODE-LOSS-PREVENTION.md](FINAL-SUMMARY-CODE-LOSS-PREVENTION.md) - 代码丢失问题总结
- [TIME-SORTING-FIX-V2.md](TIME-SORTING-FIX-V2.md) - 时间排序修复文档
- [MUSIC-TAB-RESTORE-REPORT.md](MUSIC-TAB-RESTORE-REPORT.md) - 音乐Tab恢复报告

---

## 🎯 最佳实践

### 1. 开发工作流

```
修复问题
  ↓
本地测试
  ↓
手动提交（重要修复）
  ↓
等待自动提交（每日0点）
  ↓
查看每日报告
  ↓
确认功能正常
```

### 2. 紧急修复

```
发现紧急问题
  ↓
立即修复
  ↓
手动提交并推送
  ↓
通知团队成员
```

### 3. 日常开发

```
正常开发
  ↓
本地测试
  ↓
可以不立即提交
  ↓
等待每天0点自动提交
  ↓
第二天检查报告确认
```

---

## ✅ 检查清单

### 安装验证

- [ ] Crontab已配置
- [ ] 脚本有执行权限
- [ ] 手动运行测试通过
- [ ] 日志目录存在
- [ ] GitHub Actions已启用

### 每日检查

- [ ] 查看每日报告
- [ ] 检查GitHub提交历史
- [ ] 验证应用功能正常
- [ ] 查看测试页面

### 故障处理

- [ ] 查看日志文件
- [ ] 手动运行脚本
- [ ] 检查测试结果
- [ ] 必要时手动回滚

---

**系统创建时间**: 2026-01-29
**版本**: v1.0
**状态**: ✅ 已配置

**下一步**: 等待明天0点自动执行，或手动运行测试。

---

## 🔗 快速命令参考

```bash
# 查看crontab
crontab -l

# 编辑crontab
crontab -e

# 手动运行脚本
./scripts/daily-auto-commit.sh

# 查看今天的日志
cat logs/daily-auto-commit-$(date +%Y%m%d).log

# 查看今天的报告
cat logs/daily-report-$(date +%Y%m%d).md

# 查看最近提交
git log --oneline -5

# 运行音乐Tab测试
node test-music-tab.cjs
```
