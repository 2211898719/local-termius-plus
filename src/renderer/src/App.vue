<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { darkTheme, NConfigProvider, NMessageProvider, NSplit, NModal, NIcon, useOsTheme } from 'naive-ui'
import { Icon } from '@vicons/utils'
import { DarkModeRound, LightModeRound, SettingsRound, VerticalAlignTopSharp } from '@vicons/material'
import Sidebar from './components/Sidebar.vue'
import DockViewLayout from './components/DockViewLayout.vue'
import SettingsPage from './components/SettingsPage.vue'
import { ServerConfig, ServerMetrics } from '../../main/types/server'

// 主题管理
const osTheme = useOsTheme()
const themeMode = ref<'light' | 'dark' | 'system'>('system') // 主题模式：light, dark, system

// 初始化主题
onMounted(() => {
  // 从localStorage读取保存的主题设置，如果没有则使用系统主题
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
    themeMode.value = savedTheme as 'light' | 'dark' | 'system'
  } else {
    themeMode.value = 'system'
  }
})

// 计算实际的主题状态
const isDarkTheme = computed(() => {
  if (themeMode.value === 'system') {
    return osTheme.value === 'dark'
  }
  return themeMode.value === 'dark'
})

// 计算主题
const theme = computed(() => (isDarkTheme.value ? darkTheme : null))

// 切换主题
const toggleTheme = () => {
  if (themeMode.value === 'light') {
    themeMode.value = 'dark'
  } else if (themeMode.value === 'dark') {
    themeMode.value = 'system'
  } else {
    themeMode.value = 'light'
  }
  localStorage.setItem('theme', themeMode.value)
  
  // 更新根元素的主题类名
  const root = document.documentElement
  root.classList.remove('light-theme', 'dark-theme')
  
  if (themeMode.value === 'system') {
    // 使用系统主题
    root.classList.add(osTheme.value === 'dark' ? 'dark-theme' : 'light-theme')
  } else {
    // 使用指定主题
    root.classList.add(themeMode.value === 'dark' ? 'dark-theme' : 'light-theme')
  }
}

// 响应式数据
const selectedServer = ref<ServerConfig | null>(null)
const serverMetrics = ref<ServerMetrics | null>(null)
const dockViewRef = ref<InstanceType<typeof DockViewLayout>>()
const showSettingsModal = ref(false)
const isAlwaysOnTop = ref(false)

// Split 组件的尺寸管理
const splitSize = ref(0.2) // 侧边栏宽度比例 (30%)
const minSize = ref(0) // 最小宽度比例 (20%)
const maxSize = ref(0.5) // 最大宽度比例 (50%)

// 处理 Split 尺寸变化
const handleSplitResize = (sizes: number[]) => {
  if (sizes[0] < 0.2) {
    splitSize.value = 0
  } else {
    splitSize.value = sizes[0]
  }
}

// 选择服务器
const selectServer = async (server: ServerConfig) => {
  selectedServer.value = server
  if (server) {
    // 获取服务器指标
    try {
      const metrics = await window.api.serverManager.getServerMetrics(server.id)
      serverMetrics.value = metrics
    } catch (error) {
      console.error('Failed to get server metrics:', error)
    }
  }
}

// 双击服务器创建新连接面板
const handleServerDoubleClick = (server: ServerConfig) => {
  console.log('Double clicked server:', server)
  if (dockViewRef.value) {
    dockViewRef.value.createNewConnectionPanel(server)
  }
}

// 连接服务器
const connectToServer = async (server: ServerConfig) => {
  try {
    const connected = await window.api.serverManager.connectToServer(server.id)
    if (connected) {
      console.log(`Connected to ${server.name}`)
    } else {
      console.error(`Failed to connect to ${server.name}`)
    }
  } catch (error) {
    console.error('Connection error:', error)
  }
}

// 断开服务器连接
const disconnectFromServer = async (server: ServerConfig) => {
  try {
    await window.api.serverManager.disconnectFromServer(server.id)
    console.log(`Disconnected from ${server.name}`)
  } catch (error) {
    console.error('Disconnection error:', error)
  }
}

// 打开设置模态框
const handleOpenSettings = () => {
  showSettingsModal.value = true
}

// 切换窗口置顶状态
const toggleAlwaysOnTop = async () => {
  try {
    isAlwaysOnTop.value = await window.api.windowManager.toggleAlwaysOnTop()
  } catch (error) {
    console.error('Failed to toggle always on top:', error)
  }
}

// 获取窗口置顶状态
const getAlwaysOnTopStatus = async () => {
  try {
    isAlwaysOnTop.value = await window.api.windowManager.isAlwaysOnTop()
  } catch (error) {
    console.error('Failed to get always on top status:', error)
  }
}

// 事件监听器
const handleServerStatusChanged = (server: ServerConfig) => {
  console.log('Server status changed:', server)
  // 更新服务器状态
  if (selectedServer.value && selectedServer.value.id === server.id) {
    selectedServer.value = server
  }
}

const handleMetricsUpdated = (serverId: string, metrics: ServerMetrics) => {
  if (selectedServer.value && selectedServer.value.id === serverId) {
    serverMetrics.value = metrics
  }
}

// 终端事件处理
const handleTerminalConnected = (serverId: string) => {
  console.log(`Terminal connected to server ${serverId}`)
}

const handleTerminalDisconnected = (serverId: string) => {
  console.log(`Terminal disconnected from server ${serverId}`)
}

const handleTerminalError = (error: string) => {
  console.error('Terminal error:', error)
}

// 更新检查
const checkForUpdatesOnStartup = async () => {
  try {
    // 延迟3秒后检查更新，避免影响启动速度
    setTimeout(async () => {
      await window.api.updateManager.checkForUpdates()
    }, 3000)
  } catch (error) {
    console.error('Failed to check for updates on startup:', error)
  }
}

// 生命周期
onMounted(() => {
  // 设置事件监听
  window.api.onServerStatusChanged(handleServerStatusChanged)
  window.api.onMetricsUpdated(handleMetricsUpdated)

  // 启动时检查更新
  checkForUpdatesOnStartup()
  
  // 获取窗口置顶状态
  getAlwaysOnTopStatus()
  
  // 初始化主题类名
  const root = document.documentElement
  root.classList.remove('light-theme', 'dark-theme')
  
  if (themeMode.value === 'system') {
    root.classList.add(osTheme.value === 'dark' ? 'dark-theme' : 'light-theme')
  } else {
    root.classList.add(themeMode.value === 'dark' ? 'dark-theme' : 'light-theme')
  }
  
  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleThemeChange = () => {
    if (themeMode.value === 'system') {
      root.classList.remove('light-theme', 'dark-theme')
      root.classList.add(mediaQuery.matches ? 'dark-theme' : 'light-theme')
    }
  }
  
  mediaQuery.addEventListener('change', handleThemeChange)
  
  // 保存清理函数
  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handleThemeChange)
  })
})

onUnmounted(() => {
  // 清理事件监听
  window.api.removeAllListeners('server-status-changed')
  window.api.removeAllListeners('metrics-updated')
})
</script>

<template>
  <n-config-provider :theme="theme">
    <n-message-provider>
      <div class="app-container">
        <!-- 顶部操作栏 -->
        <div class="top-bar">
          <div class="top-bar-left">
            <!-- 应用标题 -->
            <div class="app-title">Local Termius Plus</div>
          </div>
          <div class="top-bar-right">
            <!-- 窗口置顶按钮 -->
            <button 
              class="top-bar-btn" 
              @click="toggleAlwaysOnTop" 
              title="窗口置顶"
              :class="{ 'top-bar-btn-active': isAlwaysOnTop }"
            >
              <n-icon>
                <Icon>
                  <VerticalAlignTopSharp />
                </Icon>
              </n-icon>
            </button>
            <!-- 主题切换按钮 -->
            <button class="top-bar-btn" @click="toggleTheme" title="切换主题">
              <n-icon>
                <Icon>
                  <component :is="themeMode === 'dark' ? LightModeRound : DarkModeRound" />
                </Icon>
              </n-icon>
            </button>
            <!-- 设置按钮 -->
            <button class="top-bar-btn" @click="handleOpenSettings" title="设置">
              <n-icon>
                <Icon>
                  <SettingsRound />
                </Icon>
              </n-icon>
            </button>
          </div>
        </div>

        <!-- 主内容区 -->
        <n-split
          :default-size="splitSize"
          :min="minSize"
          :max="maxSize"
          :size="splitSize"
          @update:size="handleSplitResize"
          class="main-split"
        >
          <template #1>
            <!-- 左侧侧边栏 -->
            <Sidebar
              :theme-mode="themeMode"
              :is-dark-theme="isDarkTheme"
              @select-server="selectServer"
              @connect-server="connectToServer"
              @disconnect-server="disconnectFromServer"
              @server-double-click="handleServerDoubleClick"
            />
          </template>

          <template #2>
            <!-- 右侧dockview布局 -->
            <div class="main-content">
              <DockViewLayout
                ref="dockViewRef"
                :selected-server="selectedServer"
                :server-metrics="serverMetrics"
                :is-dark-theme="isDarkTheme"
                @connect-server="connectToServer"
                @disconnect-server="disconnectFromServer"
                @terminal-connected="handleTerminalConnected"
                @terminal-disconnected="handleTerminalDisconnected"
                @terminal-error="handleTerminalError"
              />
            </div>
          </template>
        </n-split>

        <!-- 设置模态框 -->
        <n-modal
          v-model:show="showSettingsModal"
          preset="card"
          title="设置"
          style="width: 600px; max-height: 80vh;"
          :bordered="false"
          size="huge"
          role="dialog"
          aria-modal="true"
        >
          <SettingsPage />
        </n-modal>
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<style scoped>
:deep(.n-split__resize-trigger-wrapper) {
  width: 8px !important;
}

:deep(.n-split__resize-trigger) {
  width: 100% !important;
}
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-bar {
  -webkit-app-region: drag;
  height: 40px;
  background-color: var(--n-color-background-1);
  border-bottom: 1px solid var(--n-color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-sizing: border-box;
}

.top-bar {
  -webkit-app-region: drag;
  height: 40px;
  background-color: var(--n-color-background-1);
  border-bottom: 1px solid var(--n-color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-sizing: border-box;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  margin-left: 60px;
  color: var(--n-color-text-1);
}

.top-bar-right {
  display: flex;
  gap: 12px;
  -webkit-app-region: no-drag;
}

.top-bar-btn {
  width: 40px;
  height: 40px;
  border: none;
  background-color: transparent;
  color: var(--n-color-text-2);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.top-bar-btn:hover {
  background-color: var(--n-color-background-2);
  color: var(--n-color-text-1);
}

.top-bar-btn-active {
  color: #22c55e;
}

.top-bar-btn-active:hover {
  color: #22c55e;
}

.top-bar-btn-active {
  color: #22c55e;
}

.top-bar-btn-active:hover {
  color: #22c55e;
}

.main-split {
  flex: 1;
  height: calc(100vh - 60px);
}

.main-split :deep(.n-split-pane) {
  height: calc(100vh - 60px);
}

.main-content {
  height: 100%;
  overflow: hidden;
}



/* 响应式设计 */
@media (max-width: 768px) {
  .main-split {
    --n-split-min: 0.25; /* 25% */
  }
}

@media (max-width: 480px) {
  .main-split {
    --n-split-min: 0.3; /* 30% */
  }
}
</style>

<style>
/* 主题相关样式 - 非 scoped */
.light-theme .top-bar {
  background-color: #f5f5f5 !important;
  border-bottom: 1px solid #e0e0e0 !important;
}

.light-theme .app-title {
  color: #333 !important;
}

.light-theme .top-bar-btn {
  color: #666 !important;
}

.light-theme .top-bar-btn:hover {
  color: #333 !important;
}
</style>
