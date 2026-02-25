# 定期链接验证指南

> 📅 创建日期：2026-01-25
> 🔄 频率：每月一次
> 🎯 目的：确保文档中的链接保持有效

---

## 为什么需要定期验证

文档中的链接可能会因为以下原因失效：

1. **网站关闭** - 商家停止运营
2. **网站改版** - URL 结构改变
3. **域名过期** - 未续费导致无法访问
4. **服务器问题** - 临时性故障

---

## 验证方法

### 方法 1：使用验证脚本（推荐）

```bash
node scripts/verify-links.js
```

**输出示例：**
```
📋 读取数据源文件...

🔍 发现 45 个网站链接

⏳ 开始验证...

📊 验证结果统计:
✅ 有效: 16 个
❌ 无效: 29 个

💾 无效链接已保存到: docs/data/invalid-urls.txt
```

### 方法 2：手动验证

访问以下文件并逐一检查：

- [docs/data/chiangmai-activities-sources.md](data/chiangmai-activities-sources.md)

查看标记为 ❌ 的链接，尝试搜索新的地址。

---

## 验证流程

### 1️⃣ 运行验证脚本

```bash
# 确保在项目根目录
cd /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai

# 运行验证
node scripts/verify-links.js
```

### 2️⃣ 查看结果

检查终端输出和生成的文件：

```bash
# 查看无效链接列表
cat docs/data/invalid-urls.txt
```

### 3️⃣ 更新失效链接

对于每个失效链接，执行以下步骤：

#### 步骤 A：搜索新地址

```bash
# 使用浏览器搜索
# 格式："旧网站名 Chiang Mai website 2025"
```

#### 步骤 B：测试新地址

```bash
# 使用 curl 测试
curl -I "https://new-website.com"
```

#### 步骤 C：更新文档

编辑 `docs/data/chiangmai-activities-sources.md`，更新：

- 网站链接
- 状态标记（❌ → ✅）
- 验证日期

### 4️⃣ 提交更新

```bash
git add docs/data/chiangmai-activities-sources.md
git commit -m "docs: 更新失效链接（2026-01-25）"
git push
```

---

## 定期验证计划

### 每月任务（第1个周日）

```bash
# 每月第1个周日执行
node scripts/verify-links.js
```

### 季度任务（每3个月）

1. 验证所有链接
2. 删除已关闭的商家
3. 添加新发现的商家
4. 更新文档说明

### 年度任务（每年1月）

1. 全面审查文档结构
2. 更新验证脚本
3. 重新评估所有数据源
4. 生成年度报告

---

## 设置自动化提醒

### 方法 1：使用 GitHub Actions

创建 `.github/workflows/verify-links.yml`:

```yaml
name: Verify Links

on:
  schedule:
    - cron: '0 0 1 * *'  # 每月1号运行
  workflow_dispatch:      # 手动触发

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Run verification
        run: node scripts/verify-links.js
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: invalid-urls
          path: docs/data/invalid-urls.txt
```

### 方法 2：本地 Cron 任务

编辑 crontab:

```bash
crontab -e
```

添加：

```bash
# 每月1号早上9点运行链接验证
0 9 1 * * cd /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai && node scripts/verify-links.js >> docs/data/verification-log.txt 2>&1
```

### 方法 3：使用日历提醒

在日历应用中添加重复事件：

- **标题：** 验证清迈活动链接
- **频率：** 每月第1个周日
- **提醒：** 提前1天
- **备注：** 运行 `node scripts/verify-links.js`

---

## 快速操作清单

### 每月验证清单

- [ ] 运行 `node scripts/verify-links.js`
- [ ] 查看无效链接列表
- [ ] 搜索失效网站的新地址
- [ ] 更新文档中的链接
- [ ] 更新验证日期
- [ ] 提交更改到 Git
- [ ] 记录验证日志

### 紧急验证（发现大量失效时）

- [ ] 检查是否是网络问题
- [ ] 手动验证几个关键链接
- [ ] 确认是否需要全面更新
- [ ] 考虑联系商家确认状态
- [ ] 在文档中添加警告说明

---

## 验证结果处理

### 场景 1：少数链接失效（< 10%）

**操作：**
1. 更新失效链接
2. 标记为 ❌
3. 继续使用

### 场景 2：中等数量失效（10-30%）

**操作：**
1. 优先搜索新地址
2. 标记无法找到的
3. 添加说明文字
4. 记录到 CHANGELOG

### 场景 3：大量链接失效（> 30%）

**操作：**
1. 暂停使用该文档
2. 添加显著警告
3. 考虑重新收集数据
4. 评估是否需要更换数据源

---

## 工具和资源

### 验证工具

- **verify-links.js** - 项目自带的验证脚本
- **curl** - 测试单个链接
- **在线工具** - [Link Checker](https://validator.w3.org/checklink)

### 搜索资源

- Google 搜索
- Facebook 页面
- TripAdvisor 评价
- Instagram 帐号

---

## 常见问题

### Q: 链接超时算失效吗？

A: 不一定。超时可能是：
- 网络问题
- 服务器响应慢
- 防火墙阻止

建议：手动验证几次再决定。

### Q: 网站改版了怎么办？

A:
1. 找到新的 URL
2. 更新文档
3. 标记为 ⚠️ 重定向

### Q: 商家已关闭怎么办？

A:
1. 标记为 ❌ 已关闭
2. 保留信息供参考
3. 在说明中添加备注

---

## 记录模板

### 验证日志模板

```markdown
## 链接验证日志 - YYYY-MM-DD

### 统计
- 总链接数: 45
- 有效链接: XX 个
- 失效链接: XX 个
- 更新链接: X 个

### 更新内容
1. Wild Rose Yoga: .com → .org ✅
2. Free Bird Cafe: 删除（无网站）❌
3. ...

### 待处理
- [ ] 需要确认的链接: X 个
- [ ] 需要删除的条目: X 个

### 下次验证
- 计划日期: YYYY-MM-DD
```

---

**维护者：** 项目维护者
**最后更新：** 2026-01-25
**下次验证：** 2026-02-01（每月第1个周日）
