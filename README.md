# 服务器运维管理工具

一个基于 Electron + Vue 3 + TypeScript 的现代化服务器运维管理工具，使用 SSH2 协议进行服务器连接和管理。

## 📥 下载安装

### 最新版本下载

**推荐从 GitHub Releases 下载预编译版本：**

[![Latest Release](https://img.shields.io/github/v/release/your-username/local-termius-plus?style=for-the-badge)](https://github.com/2211898719/local-termius-plus/releases/latest)

### 支持平台

- 🍎 **macOS** (Intel + Apple Silicon)
  - `.dmg` 安装包
  - `.zip` 便携版本
- 🪟 **Windows** 
  - `.exe` 安装包
- 🐧 **Linux**
  - `.AppImage` 便携版本

### 快速开始

1. 访问 [Releases 页面](https://github.com/2211898719/local-termius-plus/releases)
2. 下载对应平台的安装包
3. 安装并运行应用
4. 开始管理你的服务器！

> 💡 **提示**: 建议下载最新稳定版本，获得最佳体验和最新功能。

### macOS 安全限制解除

如果遇到 "无法打开，因为无法验证开发者" 的提示，请按以下步骤操作：

#### 方法一：系统偏好设置（推荐）
1. 打开 **系统偏好设置** > **安全性与隐私**
2. 在 **通用** 标签页中找到被阻止的应用
3. 点击 **仍要打开** 按钮

#### 方法二：命令行解除限制
```bash
# 解除单个应用的隔离属性
sudo xattr -cr /Applications/local-termius-plus.app

# 或者针对下载的 .dmg 文件
sudo xattr -cr ~/Downloads/local-termius-plus-*.dmg
```

#### 方法三：临时允许
```bash
# 允许从任何来源安装应用（不推荐）
sudo spctl --master-disable

# 使用后建议重新启用安全设置
sudo spctl --master-enable
```

> ⚠️ **安全提醒**: 方法三会降低系统安全性，建议使用前两种方法。

## 功能特性

### 🔧 服务器管理
- **多服务器支持**: 支持管理多台服务器，按环境分组（生产、测试、开发）
- **SSH连接**: 基于 SSH2 协议的稳定连接
- **实时状态监控**: 实时显示服务器连接状态
- **服务器配置**: 支持密码和私钥认证

### 📊 系统监控
- **CPU监控**: 实时CPU使用率监控和历史趋势
- **内存监控**: 内存使用情况监控
- **磁盘监控**: 磁盘使用率和挂载点详情
- **网络监控**: 网络接口状态和流量监控

### 🎨 现代化界面
- **响应式设计**: 适配不同屏幕尺寸
- **实时图表**: 动态性能监控图表
- **直观操作**: 简洁易用的用户界面
- **状态指示**: 清晰的状态和警告提示

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite
- **后端**: Electron + Node.js
- **SSH连接**: ssh2 + node-ssh
- **图表**: Canvas API
- **样式**: CSS3 + 响应式设计

## 🛠️ 开发指南

### 环境要求
- Node.js 16+
- pnpm (推荐) 或 npm

### 从源码构建

#### 安装依赖
```bash
pnpm install
```

#### 开发模式
```bash
pnpm dev
```

#### 构建应用
```bash
pnpm build
```

#### 打包应用
```bash
# macOS
pnpm build:mac

# Windows
pnpm build:win

# Linux
pnpm build:linux
```

#### 发布新版本
```bash
# 自动发布（推荐）
npm run release

# 手动发布
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

> 💡 **开发者提示**: 使用 `npm run release` 脚本可以自动读取版本号、创建标签并触发 GitHub Actions 构建发布。

## 使用说明

### 1. 添加服务器
1. 点击左侧"添加根分组"按钮创建新的服务器分组
2. 在分组中添加服务器配置：
   - 服务器名称
   - IP地址
   - 端口（默认22）
   - 用户名
   - 密码或私钥

### 2. 连接服务器
1. 在左侧服务器列表中选择要连接的服务器
2. 点击"远程连接"按钮建立SSH连接
3. 连接成功后可以查看服务器状态和指标

### 3. 监控服务器
- **实时指标**: 查看CPU、内存、磁盘、网络使用情况
- **性能图表**: 观察系统性能趋势
- **详细信息**: 查看磁盘挂载点和网络接口详情

### 4. 执行命令
- 通过SSH连接执行远程命令
- 查看命令执行结果
- 支持交互式终端操作

## 项目结构

```
src/
├── main/                 # Electron主进程
│   ├── services/        # 服务层
│   │   ├── SSHManager.ts    # SSH连接管理
│   │   └── ServerManager.ts # 服务器管理
│   ├── types/           # 类型定义
│   │   └── server.ts        # 服务器相关类型
│   └── index.ts         # 主进程入口
├── preload/             # 预加载脚本
│   ├── index.ts         # API暴露
│   └── index.d.ts       # 类型定义
└── renderer/            # 渲染进程
    ├── src/
    │   ├── components/  # Vue组件
    │   │   ├── ServerSidebar.vue      # 服务器侧边栏
    │   │   ├── ServerDashboard.vue    # 服务器仪表板
    │   │   ├── MetricCard.vue         # 指标卡片
    │   │   ├── PerformanceChart.vue   # 性能图表
    │   │   ├── DiskUsageTable.vue     # 磁盘使用表格
    │   │   └── NetworkInfo.vue        # 网络信息
    │   └── App.vue      # 主应用组件
    └── index.html       # HTML模板
```

## 配置说明

### SSH连接配置
```typescript
interface ServerConfig {
  id: string
  name: string
  host: string
  port: number
  username: string
  password?: string      // 密码认证
  privateKey?: string    // 私钥认证
  groupId: string
  status: 'running' | 'stopped' | 'maintenance' | 'error'
}
```

### 监控指标
- **CPU使用率**: 通过 `top` 命令获取
- **内存使用**: 通过 `free` 命令获取
- **磁盘使用**: 通过 `df` 命令获取
- **网络接口**: 通过 `ip addr` 命令获取

## 安全注意事项

1. **密码安全**: 建议使用SSH密钥认证而非密码
2. **网络安全**: 确保SSH连接使用安全网络
3. **权限控制**: 使用最小权限原则配置SSH用户
4. **日志记录**: 重要操作会记录在控制台日志中

## 故障排除

### 连接问题
1. 检查网络连接
2. 验证SSH服务是否运行
3. 确认用户名和密码/密钥正确
4. 检查防火墙设置

### 性能问题
1. 检查服务器资源使用情况
2. 优化SSH连接参数
3. 调整监控频率

## 开发指南

### 添加新功能
1. 在 `src/main/services/` 中添加服务逻辑
2. 在 `src/renderer/src/components/` 中添加UI组件
3. 更新类型定义和API接口

### 自定义主题
修改 `src/renderer/src/assets/main.css` 中的样式变量

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

---

**注意**: 这是一个演示项目，在生产环境中使用前请确保进行充分的安全测试和配置。