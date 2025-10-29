# 应用升级功能测试指南

## 🧪 测试环境准备

### 1. 本地开发测试

#### 安装依赖
```bash
pnpm install
```

#### 启动开发模式
```bash
pnpm dev
```

### 2. 构建测试版本

#### 构建应用
```bash
# 跳过 typecheck 避免错误
pnpm exec electron-vite build
```

#### 打包测试版本
```bash
# macOS
pnpm exec electron-builder --mac --publish=never

# Windows  
pnpm exec electron-builder --win --publish=never

# Linux
pnpm exec electron-builder --linux AppImage --publish=never
```

## 🔍 测试场景

### 场景1: 本地模拟更新测试

#### 1.1 修改版本号
```bash
# 修改 package.json 中的版本号
# 例如：从 "1.0.0" 改为 "1.0.1"
```

#### 1.2 创建测试 Release
```bash
# 创建测试标签
git tag -a v1.0.1 -m "Test release v1.0.1"
git push origin v1.0.1
```

#### 1.3 触发 GitHub Actions
- 访问 GitHub Actions 页面
- 查看 "Release" 工作流执行状态
- 等待构建完成

#### 1.4 测试更新功能
1. 运行当前版本的应用
2. 在设置页面点击"检查更新"
3. 验证更新检测和下载流程

### 场景2: 完整发布流程测试

#### 2.1 使用发布脚本
```bash
# 确保版本号已更新
npm run release
```

#### 2.2 验证发布结果
- 检查 GitHub Releases 页面
- 确认各平台安装包已上传
- 验证文件过滤是否正确

### 场景3: 更新界面测试

#### 3.1 集成更新组件
在应用中添加更新管理组件：

```vue
<!-- 在 App.vue 或设置页面中添加 -->
<template>
  <div>
    <!-- 其他内容 -->
    <UpdateManager />
  </div>
</template>

<script setup>
import UpdateManager from './components/UpdateManager.vue'
</script>
```

#### 3.2 测试用户交互
- 点击"检查更新"按钮
- 验证加载状态显示
- 测试下载进度显示
- 验证错误处理

## 🛠️ 测试工具和方法

### 1. 开发者工具测试

#### 控制台日志
```javascript
// 在渲染进程中查看更新日志
window.api.updateManager.onUpdateAvailable((info) => {
  console.log('更新可用:', info)
})

window.api.updateManager.onUpdateError((error) => {
  console.error('更新错误:', error)
})
```

#### 手动触发更新
```javascript
// 在控制台中手动触发更新检查
window.api.updateManager.checkForUpdates()
```

### 2. 网络环境测试

#### 模拟网络问题
- 断开网络连接测试错误处理
- 使用慢速网络测试下载进度
- 模拟网络中断测试重试机制

#### 代理环境测试
- 在代理环境下测试更新功能
- 验证网络配置是否正确

### 3. 平台兼容性测试

#### macOS 测试
```bash
# 构建 macOS 版本
pnpm exec electron-builder --mac --publish=never

# 测试安全限制
sudo xattr -cr dist/local-termius-plus-*.dmg
```

#### Windows 测试
```bash
# 构建 Windows 版本
pnpm exec electron-builder --win --publish=never
```

#### Linux 测试
```bash
# 构建 Linux 版本
pnpm exec electron-builder --linux AppImage --publish=never
```

## 📋 测试检查清单

### ✅ 功能测试

- [ ] 应用启动时自动检查更新
- [ ] 手动检查更新功能
- [ ] 更新可用时显示通知
- [ ] 下载进度正确显示
- [ ] 下载完成后显示安装选项
- [ ] 安装更新后应用重启
- [ ] 错误情况下的提示信息
- [ ] 网络异常时的处理

### ✅ 界面测试

- [ ] 更新管理器界面正常显示
- [ ] 按钮状态正确切换
- [ ] 进度条动画流畅
- [ ] 错误信息清晰易懂
- [ ] 响应式设计适配

### ✅ 兼容性测试

- [ ] macOS Intel 版本
- [ ] macOS ARM64 版本
- [ ] Windows 版本
- [ ] Linux AppImage 版本

### ✅ 发布流程测试

- [ ] GitHub Actions 构建成功
- [ ] Release 文件正确上传
- [ ] 文件过滤规则生效
- [ ] 版本号正确显示

## 🐛 常见问题排查

### 问题1: 更新检查失败

**可能原因：**
- GitHub Releases 不可访问
- 网络连接问题
- 版本号格式错误

**解决方法：**
```bash
# 检查网络连接
ping github.com

# 验证 GitHub Releases
curl -I https://github.com/2211898719/local-termius-plus/releases/latest

# 检查版本号格式
cat package.json | grep version
```

### 问题2: 下载失败

**可能原因：**
- 磁盘空间不足
- 网络不稳定
- 文件权限问题

**解决方法：**
```bash
# 检查磁盘空间
df -h

# 检查网络稳定性
ping -c 10 github.com

# 检查文件权限
ls -la dist/
```

### 问题3: 安装失败

**可能原因：**
- 应用正在运行
- 权限不足
- 文件损坏

**解决方法：**
```bash
# 关闭应用进程
pkill -f local-termius-plus

# 检查权限
ls -la /Applications/local-termius-plus.app

# 重新下载安装包
```

## 📊 测试数据记录

### 测试环境信息
- 操作系统: 
- Node.js 版本: 
- Electron 版本: 
- 网络环境: 

### 测试结果记录
- 更新检查: ✅/❌
- 下载功能: ✅/❌  
- 安装功能: ✅/❌
- 界面显示: ✅/❌
- 错误处理: ✅/❌

### 问题记录
- 问题描述:
- 复现步骤:
- 解决方案:
- 测试结果:

## 🚀 快速测试命令

```bash
# 1. 构建测试版本
pnpm exec electron-vite build && pnpm exec electron-builder --mac --publish=never

# 2. 创建测试标签
git tag -a v1.0.1-test -m "Test release" && git push origin v1.0.1-test

# 3. 运行应用测试
./dist/mac/local-termius-plus.app/Contents/MacOS/local-termius-plus

# 4. 清理测试标签
git tag -d v1.0.1-test && git push origin :refs/tags/v1.0.1-test
```

## 📝 测试报告模板

```markdown
# 更新功能测试报告

## 测试概述
- 测试时间: 
- 测试版本: 
- 测试环境: 

## 测试结果
- 自动检查: ✅/❌
- 手动检查: ✅/❌
- 下载功能: ✅/❌
- 安装功能: ✅/❌

## 发现问题
1. 问题描述
2. 影响程度
3. 解决方案

## 测试结论
- 功能完整性: ✅/❌
- 用户体验: ✅/❌
- 稳定性: ✅/❌
```

通过以上测试指南，你可以全面验证应用升级功能的正确性和稳定性。
