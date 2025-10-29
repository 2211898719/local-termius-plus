<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { NSplit, NMessageProvider, NConfigProvider, darkTheme, useOsTheme } from 'naive-ui'
import Sidebar from './components/Sidebar.vue'
import DockViewLayout from './components/DockViewLayout.vue'
import UpdateManager from './components/UpdateManager.vue'
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
}

// 响应式数据
const selectedServer = ref<ServerConfig | null>(null)
const serverMetrics = ref<ServerMetrics | null>(null)
const dockViewRef = ref<InstanceType<typeof DockViewLayout>>()

// Split 组件的尺寸管理
const splitSize = ref(0.3) // 侧边栏宽度比例 (30%)
const minSize = ref(0.2)   // 最小宽度比例 (20%)
const maxSize = ref(0.5)   // 最大宽度比例 (50%)

// 处理 Split 尺寸变化
const handleSplitResize = (sizes: number[]) => {
  splitSize.value = sizes[0]
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
        <n-split
          :default-size="splitSize"
          :min="minSize"
          :max="maxSize"
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
              @toggle-theme="toggleTheme"
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
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<style scoped>
.app-container {
  height: 100vh;
}

.main-split {
  height: 100vh;
}

.main-split :deep(.n-split-pane) {
  height: 100vh;
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
