# 应用升级功能实现指南

## 📋 功能概述

本项目已实现完整的应用自动升级功能，包括：

- ✅ **自动检查更新** - 应用启动时自动检查新版本
- ✅ **手动检查更新** - 用户可手动触发更新检查
- ✅ **下载进度显示** - 实时显示下载进度和速度
- ✅ **更新通知** - 发现新版本时显示通知
- ✅ **自动安装** - 下载完成后可一键安装
- ✅ **错误处理** - 完善的错误提示和重试机制

## 🏗️ 架构设计

### 后端服务 (Main Process)

**UpdateService** (`src/main/services/UpdateService.ts`)
- 基于 `electron-updater` 实现
- 支持 GitHub Releases 作为更新源
- 提供完整的更新生命周期管理
- 事件驱动的更新状态通知

### 前端组件 (Renderer Process)

**UpdateManager** (`src/renderer/src/components/UpdateManager.vue`)
- 基于 Naive UI 的现代化界面
- 实时显示更新状态和进度
- 支持用户交互和设置管理

### IPC 通信

通过 `preload` 脚本暴露安全的 API：
- `window.api.updateManager.*` - 更新管理接口
- 事件监听和状态同步
- 类型安全的 TypeScript 支持

## 🔧 配置说明

### 1. electron-builder 配置

```yaml
# electron-builder.yml
publish:
  provider: github
  owner: 2211898719
  repo: local-termius-plus
```

### 2. GitHub Actions 配置

```yaml
# .github/workflows/release.yml
- name: Build for macOS
  run: pnpm exec electron-builder --mac --publish=never
```

## 🚀 使用方法

### 开发者发布新版本

1. **更新版本号**
   ```bash
   # 修改 package.json 中的 version
   "version": "1.0.1"
   ```

2. **发布新版本**
   ```bash
   # 使用发布脚本
   npm run release
   
   # 或手动创建标签
   git tag -a v1.0.1 -m "Release v1.0.1"
   git push origin v1.0.1
   ```

3. **GitHub Actions 自动构建**
   - 构建各平台安装包
   - 创建 GitHub Release
   - 上传构建产物

### 用户更新应用

1. **自动检查** - 应用启动时自动检查更新
2. **手动检查** - 在设置页面点击"检查更新"
3. **下载安装** - 发现新版本后点击下载和安装

## 📱 用户界面

### 更新管理器组件

```vue
<template>
  <UpdateManager />
</template>
```

**功能特性：**
- 当前版本显示
- 更新状态指示
- 下载进度条
- 更新日志展示
- 自动检查设置

## 🔄 更新流程

### 1. 检查更新
```typescript
// 检查是否有新版本
await window.api.updateManager.checkForUpdates()
```

### 2. 下载更新
```typescript
// 下载新版本
await window.api.updateManager.downloadUpdate()
```

### 3. 安装更新
```typescript
// 安装并重启应用
await window.api.updateManager.installUpdate()
```

## 📊 事件监听

```typescript
// 监听更新事件
window.api.updateManager.onUpdateAvailable((updateInfo) => {
  console.log('发现新版本:', updateInfo.version)
})

window.api.updateManager.onUpdateDownloadProgress((progress) => {
  console.log('下载进度:', progress.percent + '%')
})

window.api.updateManager.onUpdateDownloaded(() => {
  console.log('更新下载完成')
})
```

## ⚙️ 高级配置

### 自定义更新源

```typescript
// 在 UpdateService 中配置
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://your-update-server.com/updates'
})
```

### 更新策略

```typescript
// 配置更新行为
autoUpdater.autoDownload = false  // 禁用自动下载
autoUpdater.autoInstallOnAppQuit = true  // 退出时自动安装
```

## 🛠️ 故障排除

### 常见问题

1. **更新检查失败**
   - 检查网络连接
   - 确认 GitHub Releases 可访问
   - 查看控制台错误信息

2. **下载失败**
   - 检查磁盘空间
   - 确认网络稳定性
   - 重试下载

3. **安装失败**
   - 确认应用权限
   - 关闭其他相关进程
   - 手动重启应用

### 调试模式

```typescript
// 启用详细日志
autoUpdater.logger = require('electron-log')
autoUpdater.logger.transports.file.level = 'debug'
```

## 🔒 安全考虑

1. **代码签名** - 确保安装包已签名
2. **HTTPS** - 使用安全的更新源
3. **完整性验证** - 验证下载文件的完整性
4. **权限控制** - 限制更新相关权限

## 📈 性能优化

1. **增量更新** - 使用 `.blockmap` 文件支持增量下载
2. **后台下载** - 在后台静默下载更新
3. **缓存管理** - 合理管理更新缓存
4. **用户体验** - 避免阻塞主界面

## 🎯 最佳实践

1. **版本管理** - 遵循语义化版本规范
2. **发布说明** - 提供详细的更新日志
3. **测试验证** - 充分测试更新流程
4. **回滚机制** - 提供版本回滚选项
5. **用户通知** - 及时通知用户更新状态

---

通过以上实现，应用具备了完整的自动更新能力，为用户提供了便捷的升级体验。
