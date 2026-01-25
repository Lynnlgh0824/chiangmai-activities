# 🔑 使用 Token 推送代码 - 超简单方法

## 步骤 1: 创建 GitHub Token（2分钟）

1. **访问**: https://github.com/settings/tokens

2. **点击**: "Generate new token" → "Generate new token (classic)"

3. **配置**:
   - **Note**: 输入 `Chiengmai Deploy`
   - **Expiration**: 选择 `90 days`
   - **Scopes**: 勾选 ✅ `repo` (这会自动勾选下面的所有子项)

4. **点击**: 底部的 "Generate token" 按钮

5. **重要**: 复制生成的 Token（类似 `ghp_xxxxxxxxxxxx`）
   - ⚠️ 只显示一次，务必立即复制！

---

## 步骤 2: 推送代码

### 方法 A: 让我帮你推送

**告诉我你的 Token**，我会立即推送代码。

⚠️ **安全提示**: Token 会在终端中显示，推送完成后你可以删除这个 Token。

---

### 方法 B: 手动推送

如果不想告诉我 Token，可以在终端手动执行：

```bash
git push -u origin main
```

**当提示输入用户名时**:
```
Username: Lynnlgh0824
```

**当提示输入密码时**:
```
Password: ghp_你的token
```
(粘贴你的 Token，不是 GitHub 密码)

---

## ✅ 推送成功后

你会看到类似这样的输出：

```
Enumerating objects: 11, done.
Counting objects: 100% (11/11), done.
Writing objects: 100% (10/10), done.
To github.com:Lynnlgh0824/chiengmai-activities.git
 * [new branch]      main -> main
```

然后访问 https://github.com/Lynnlgh0824/chiengmai-activities 就能看到你的代码了！

---

**准备好了吗？选择一个方法告诉我！** 🚀
