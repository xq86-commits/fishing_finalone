# 🚀 部署指南

## 从 Cursor 部署到 GitHub 仓库

### 仓库信息
- **仓库地址**: https://github.com/xq86-commits/fishing_V1.git
- **部署方式**: GitHub Pages（自动部署）

---

## 📋 首次设置步骤

### 1. 初始化 Git 仓库（如果尚未初始化）

```bash
git init
```

### 2. 添加远程仓库

```bash
git remote add origin https://github.com/xq86-commits/fishing_V1.git
```

如果已经存在远程仓库，可以更新：

```bash
git remote set-url origin https://github.com/xq86-commits/fishing_V1.git
```

### 3. 添加所有文件并提交

```bash
git add .
git commit -m "Initial commit"
```

### 4. 推送到 GitHub

```bash
git branch -M main
git push -u origin main
```

---

## 🔄 日常部署流程

### 方法一：使用 Git 命令（推荐）

1. **检查当前状态**
   ```bash
   git status
   ```

2. **添加更改的文件**
   ```bash
   git add .
   ```
   或者添加特定文件：
   ```bash
   git add <文件名>
   ```

3. **提交更改**
   ```bash
   git commit -m "描述你的更改"
   ```

4. **推送到 GitHub**
   ```bash
   git push origin main
   ```

5. **自动部署**
   - 推送后，GitHub Actions 会自动触发部署
   - 部署完成后，你的网站将在 GitHub Pages 上可用
   - 通常需要几分钟时间

### 方法二：使用 Cursor 的 Git 集成

1. 在 Cursor 中打开源代码管理面板（左侧边栏）
2. 暂存更改的文件
3. 输入提交信息
4. 点击提交
5. 点击同步/推送按钮

---

## ⚙️ GitHub Pages 设置

### 启用 GitHub Pages

1. 前往 GitHub 仓库页面
2. 点击 **Settings**（设置）
3. 在左侧菜单中找到 **Pages**
4. 在 **Source** 部分，选择：
   - **Branch**: `main` 或 `master`
   - **Folder**: `/ (root)`
5. 点击 **Save**

### 查看部署状态

1. 在仓库页面，点击 **Actions** 标签
2. 查看 "Deploy to GitHub Pages" 工作流
3. 绿色勾号表示部署成功

### 访问你的网站

部署成功后，你的网站将在以下地址可用：
```
https://xq86-commits.github.io/fishing_V1/
```

---

## 🔧 故障排除

### 如果部署失败

1. **检查 Actions 日志**
   - 前往仓库的 **Actions** 标签
   - 查看失败的工作流详情

2. **检查文件路径**
   - 确保 `index.html` 在根目录
   - 检查所有资源文件的路径是否正确

3. **检查分支名称**
   - 确保主分支是 `main` 或 `master`
   - 如果不同，更新 `.github/workflows/deploy.yml` 中的分支名称

### 如果更改没有显示

1. **清除浏览器缓存**
   - 按 `Ctrl+Shift+R` (Windows/Linux) 或 `Cmd+Shift+R` (Mac)

2. **检查部署是否完成**
   - 在 Actions 中确认部署已完成

3. **等待几分钟**
   - GitHub Pages 可能需要几分钟来更新

---

## 📝 注意事项

- ✅ 每次推送到 `main` 分支都会自动触发部署
- ✅ 部署通常需要 1-3 分钟完成
- ✅ 确保所有资源文件（图片、音频等）都包含在仓库中
- ✅ 检查 `.gitignore` 确保重要文件没有被忽略
- ⚠️ 不要提交敏感信息（API 密钥、密码等）

---

## 🎯 快速命令参考

```bash
# 查看状态
git status

# 添加所有更改
git add .

# 提交
git commit -m "更新描述"

# 推送
git push origin main

# 查看远程仓库
git remote -v
```

---

**祝你部署顺利！** 🎉

