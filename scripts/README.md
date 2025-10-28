# Release Script

## 使用方法

### 1. 自动发布（推荐）

```bash
# 使用 npm 脚本
npm run release

# 或直接运行脚本
./scripts/release.sh
```

### 2. 手动发布

```bash
# 1. 更新 package.json 中的版本号
# 2. 提交更改
git add package.json
git commit -m "chore: bump version to 1.0.1"

# 3. 创建并推送标签
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1
```

## 脚本功能

- ✅ 自动读取 `package.json` 中的版本号
- ✅ 检查是否在 git 仓库中
- ✅ 检查是否有未提交的更改
- ✅ 检查标签是否已存在
- ✅ 确认发布信息
- ✅ 创建带注释的标签
- ✅ 推送到远程仓库
- ✅ 触发 GitHub Actions 自动构建和发布

## 注意事项

1. **版本号格式**：确保 `package.json` 中的版本号符合语义化版本规范（如 `1.0.0`）
2. **分支检查**：脚本会检查是否在 `main` 或 `master` 分支上
3. **未提交更改**：发布前请确保所有更改都已提交
4. **标签冲突**：如果标签已存在，脚本会提示删除方法

## GitHub Actions

推送标签后，GitHub Actions 会自动：
- 构建 macOS、Windows、Linux 版本
- 过滤并只保留必要的安装包文件
- 创建 GitHub Release
- 上传构建产物

## 文件过滤

Release 中只会包含以下文件：
- `local-termius-plus-*.dmg` (macOS)
- `local-termius-plus-*-arm64-mac.zip` (macOS ARM64)
- `local-termius-plus-*-mac.zip` (macOS Intel)
- `local-termius-plus-*-setup.exe` (Windows)
- `local-termius-plus-*.AppImage` (Linux)
