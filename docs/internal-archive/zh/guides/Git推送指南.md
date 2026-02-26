# Git 推送认证指南

## 🔐 使用 Personal Access Token 推送代码

### 步骤 1: 创建 Personal Access Token

1. 访问 GitHub: https://github.com/settings/tokens
2. 点击 **Generate new token** → **Generate new token (classic)**
3. 配置 Token:
   - **Name**: `chiangmai-activities`
   - **Expiration**: 选择过期时间（建议 90 天）
   - **Scopes**: 勾选 `repo` (完整的仓库访问权限)
4. 点击 **Generate token**
5. ⚠️ **重要**: 复制生成的 token（只显示一次！）

### 步骤 2: 推送代码

在终端执行以下命令：

```bash
cd /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai

# 推送时使用 token 作为密码
git push
```

当提示输入用户名和密码时：
- **Username**: `Lynnlgh0824`
- **Password**: 粘贴你的 Personal Access Token (不是 GitHub 密码！)

### 步骤 3: 保存凭据（可选）

为了避免每次都输入 token，可以保存凭据：

```bash
# macOS 使用 credential helper
git config --global credential.helper osxkeychain
```

下次推送时，输入一次 token 后就会保存。

---

## 🚀 推送成功后的自动部署

推送成功后，Vercel 会自动部署：
- 等待 1-2 分钟
- 访问: https://go-cnx.vercel.app
- 更新内容会自动上线

---

## 📋 待推送的提交 (5个)

```
d6892b7 集成周课表视图到主页面
916bd90 优化首页交互布局
915d93e 优化用户体验和性能
c61f207 修复页面显示bug
62e7604 fix: 修复CORS配置和周课表链接
```

---

## ❓ 常见问题

### Q: Token 推送失败？
**A**: 确保 Token 有 `repo` 权限，检查用户名是否正确。

### Q: 忘记保存 Token？
**A**: 需要重新生成，访问: https://github.com/settings/tokens

### Q: 推送后 Vercel 没有部署？
**A**: 检查 Vercel 仪表板的部署日志，可能需要手动触发重新部署。

---

**需要帮助?**
- Git 文档: https://git-scm.com/docs
- GitHub Token: https://github.com/settings/tokens
