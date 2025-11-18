// Local Termius Plus 项目规则

## 1. 项目概述
Local Termius Plus 是一个基于 Electron 的 SSH 客户端，具有现代化界面和高级功能。它允许用户在单个应用中管理 SSH 服务器、代理和终端会话。

### 技术栈
- **Electron**: 跨平台桌面应用框架
- **Vue 3**: 响应式 UI 框架
- **TypeScript**: 类型安全的 JavaScript
- **Naive UI**: 现代化 UI 组件库
- **Dockview**: 终端会话的灵活布局系统
- **Xterm.js**: 终端模拟器
- **Node-SSH/ssh2**: SSH 连接处理
- **LowDB**: 用于配置管理的轻量级数据库

## 2. 目录结构

```
├── src/                    # 主源码目录
│   ├── main/               # 主进程代码
│   │   ├── database/       # 数据库相关代码
│   │   ├── entities/       # TypeORM 实体
│   │   ├── services/       # 核心业务服务
│   │   ├── types/          # TypeScript 类型定义
│   │   └── index.ts        # 主进程入口文件
│   ├── preload/            # 预加载脚本
│   │   ├── index.d.ts      # 类型定义
│   │   └── index.ts        # 预加载入口文件
│   └── renderer/           # 渲染进程代码
│       ├── index.html      # HTML 模板
│       └── src/
│           ├── components/  # Vue 组件
│           ├── App.vue      # 根组件
│           └── main.ts      # 渲染进程入口文件
├── build/                  # 构建配置
├── resources/              # 静态资源
├── package.json            # 依赖和脚本
├── tsconfig.json           # TypeScript 配置
├── eslint.config.mjs       # ESLint 配置
└── .prettierrc.yaml       # Prettier 配置
```

## 3. 编码规范

### 3.1 TypeScript
- 所有文件必须使用 TypeScript (.ts, .tsx, .vue)
- 尽可能使用显式类型注解
- 除非绝对必要，否则避免使用 `any` 类型
- 使用接口进行类型定义

### 3.2 ESLint & Prettier
- 提交前运行 `npm run lint`
- 运行 `npm run format` 自动格式化文件
- Prettier 配置：
  ```yaml
  singleQuote: true
  semi: false
  printWidth: 100
  trailingComma: none
  ```

### 3.3 Vue 组件
- 使用 `<script setup lang="ts">` 编写组合式 API
- 组件名称使用 PascalCase
- 保持组件功能单一且聚焦
- 使用 scoped 样式
- 组件结构示例：
  ```vue
  <script setup lang="ts">
  // 组件逻辑
  </script>
  <template>
  <!-- 模板 -->
  </template>
  <style scoped>
  /* 样式 */
  </style>
  ```

## 4. 构建与开发

### 4.1 开发
```bash
npm run dev          # 启动开发服务器
```

### 4.2 构建
```bash
npm run build        # 构建当前平台版本
npm run build:win    # 构建 Windows 版本
npm run build:mac    # 构建 macOS 版本
npm run build:linux  # 构建 Linux 版本
```

### 4.3 类型检查
```bash
npm run typecheck    # 检查 TypeScript 类型
```

## 5. 测试
- 运行 `npm test` 执行测试
- 遵循 `docs/TESTING_GUIDE.md` 中的测试指南

## 6. 部署
- 遵循 `docs/UPDATE_GUIDE.md` 中的部署指南
- 使用 `npm run release` 创建发布版本

## 7. 最佳实践

### 7.1 主进程
- 保持主进程代码简洁
- 使用 IPC 进行主进程和渲染进程之间的通信
- 在主进程中处理 SSH 连接

### 7.2 渲染进程
- 使用 Vue 组合式 API
- 保持组件轻量化
- 避免直接操作 DOM

### 7.3 服务
- 服务使用单例模式
- 业务逻辑放在服务中
- 使用事件发射器处理状态变化

### 7.4 类型定义
- 类型定义集中在 `src/main/types/`
- 使用一致的命名规范

## 8. 版本控制
- 遵循 Git flow
- 编写有意义的提交信息
- 使用 PR 进行代码审查

## 9. 文档
- 在 README.md 中记录新功能
- 当 API 更改时更新文档
- 为复杂代码编写清晰的注释