# Chiengmai 项目归档目录

此目录用于存放项目的历史备份。

## 归档规范

### 命名格式
```
YYYY-MM-DD-描述.tar.gz
```

例如：`2026-02-06-before-refactor.tar.gz`

### 归档操作步骤

当需要创建备份时：
```bash
cd ~/Documents/my_project

# 1. 压缩需要备份的内容
tar -czf Chiengmai/archives/$(date +%Y-%m-%d)-描述.tar.gz 需要备份的目录

# 2. 如果备份的是 Chiengmai 项目本身
tar -czf Chiengmai/archives/$(date +%Y-%m-%d)-backup.tar.gz Chiengmai
```

### 现有归档

| 文件 | 日期 | 说明 |
|------|------|------|
| Chiengmai-backups.tar.gz | 2026-02-06 | Chiengmai.backup 和 Chiengmai-backup-20260129-011001 的合并备份 |

---

**注意**：定期清理过期的旧备份，保留最近 3-6 个月的备份即可。
