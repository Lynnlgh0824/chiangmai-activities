# 私有文档目录

此目录包含内部文档，**不会提交到Git仓库**。

## 目录说明

- **internal-notes/** - 内部文档和笔记
- **daily-logs/** - 每日工作记录

## 使用指南

### 私有文档类型
1. **包含敏感信息的文档**
   - API密钥和密码
   - 内部服务器地址
   - 真实的配置信息

2. **内部工作记录**
   - 每日工作总结
   - 内部讨论记录
   - 临时笔记

3. **未公开的文档**
   - 计划中的功能
   - 内部分析报告
   - 草稿文档

### 公开文档目录

公开文档请放在：
- \`docs/\` - 公开的技术文档
- \`docs/architecture/\` - 架构文档
- \`docs/guides/\` - 使用指南
- \`CHANGELOG.md\` - 版本更新日志

## 安全提醒

⚠️ **永远不要将以下内容提交到Git**：
- 真实的密码或密钥
- API凭证
- 内部IP地址
- 包含敏感信息的工作记录

✅ **使用占位符**：
\`\`\`markdown
# 不好的写法
FEISHU_APP_SECRET=kWMjBJaDJYuzegYQPRVdehaEtMOs0iL3

# 好的写法
FEISHU_APP_SECRET=your_app_secret_here
\`\`\`

---

**最后更新**: 2026-01-29
