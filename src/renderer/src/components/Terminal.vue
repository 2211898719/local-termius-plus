<template>
  <div class="terminal-container" :class="{ 'dark-theme': isDarkTheme }">
    <!-- 连接状态显示 -->
    <div v-if="!isConnected" class="connection-status">
      <div v-if="connecting" class="connecting-state">
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: connectionProgress + '%' }"></div>
          </div>
          <div class="progress-text">正在连接服务器 "{{ server?.name }}"...</div>
        </div>
      </div>
      <div v-else-if="connectionError" class="error-state">
        <div class="error-icon">⚠️</div>
        <div class="error-message">{{ connectionError }}</div>
        <button @click="retryConnection" class="retry-btn">重试连接</button>
      </div>
      <div v-else class="disconnected-state">
        <div class="disconnected-icon">🔌</div>
        <div class="disconnected-message">未连接到服务器</div>
        <button @click="connect" class="connect-btn">连接服务器</button>
      </div>
    </div>

    <!-- 终端显示 -->
    <div ref="terminalRef" class="terminal" :class="{ 'terminal-hidden': !isConnected }"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import 'xterm/css/xterm.css'

const props = defineProps({
  params: {
    type: Object,
    default: () => ({})
  },
  isDarkTheme: {
    type: Boolean,
    default: false
  }
})

// 连接状态管理
const connectionProgress = ref(0)
const connectionError = ref('')

// 从 params 中获取服务器信息
const server = computed(() => {
  const serverInfo = props.params?.params?.server || null
  console.log('Terminal server computed:', serverInfo)
  return serverInfo
})

// 从 params 中获取主题信息，如果没有则使用 props
const isDarkTheme = computed(() => {
  return props.params?.params?.isDarkTheme ?? props.isDarkTheme
})

const emit = defineEmits<{
  connected: [serverId: string]
  disconnected: [serverId: string]
  error: [error: string]
}>()

const terminalRef = ref<HTMLElement>()
const terminal = ref<Terminal>()
const fitAddon = ref<FitAddon>()
const isConnected = ref(false)
const connecting = ref(false)
const canProcessData = ref(false) // 新增：控制是否可以处理数据
const resizeObserver = ref<ResizeObserver>()
let resizeTimeout: NodeJS.Timeout | null = null

// 生成唯一的连接 ID
const connectionId = ref<string>(`conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

// 主题配置
const darkTheme = {
  background: '#1e1e1e',
  foreground: '#d4d4d4',
  cursor: '#ffffff',
  black: '#000000',
  red: '#cd3131',
  green: '#0dbc79',
  yellow: '#e5e510',
  blue: '#2472c8',
  magenta: '#bc3fbc',
  cyan: '#11a8cd',
  white: '#e5e5e5',
  brightBlack: '#666666',
  brightRed: '#f14c4c',
  brightGreen: '#23d18b',
  brightYellow: '#f5f543',
  brightBlue: '#3b8eea',
  brightMagenta: '#d670d6',
  brightCyan: '#29b8db',
  brightWhite: '#e5e5e5'
}

const lightTheme = {
  background: '#ffffff',
  foreground: '#333333',
  cursor: '#000000',
  black: '#000000',
  red: '#cd3131',
  green: '#0dbc79',
  yellow: '#e5e510',
  blue: '#2472c8',
  magenta: '#bc3fbc',
  cyan: '#11a8cd',
  white: '#e5e5e5',
  brightBlack: '#666666',
  brightRed: '#f14c4c',
  brightGreen: '#23d18b',
  brightYellow: '#f5f543',
  brightBlue: '#3b8eea',
  brightMagenta: '#d670d6',
  brightCyan: '#29b8db',
  brightWhite: '#000000'
}

// 计算当前主题
const currentTheme = computed(() => {
  return isDarkTheme.value ? darkTheme : lightTheme
})

console.log('收到的参数:', props.params)
console.log('服务器信息:', server.value)
console.log('生成的连接 ID:', connectionId.value)


// 初始化终端
const initTerminal = () => {
  if (!terminalRef.value) return

  terminal.value = new Terminal({
    convertEol: true, //启用时，光标将设置为下一行的开头
    scrollback: 30000, //滚动缓冲区大小
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    tabStopWidth: 1,
    screenReaderMode: false,
    drawBoldTextInBrightColors: true,
    rows: 24, // 设置初始行数
    cols: 80, // 设置初始列数
    theme: currentTheme.value
  })

  // 创建并加载addon
  fitAddon.value = new FitAddon()
  const webLinksAddon = new WebLinksAddon()

  try {
    terminal.value.loadAddon(fitAddon.value)
    terminal.value.loadAddon(webLinksAddon)
  } catch (error) {
    console.warn('Error loading terminal addons:', error)
  }

  terminal.value.open(terminalRef.value)

  // 监听终端输入
  terminal.value.onData((data) => {
    if (isConnected.value && connectionId.value) {
      // 发送数据到SSH连接
      window.api.sshManager.sendData(connectionId.value, data)
    }
  })

  // 监听终端大小变化
  terminal.value.onResize((size) => {
    console.log(`Terminal resized to: ${size.cols}x${size.rows}`)
    console.log(
      `Connection status: isConnected=${isConnected.value}, connectionId=${connectionId.value}`
    )
    if (connectionId.value) {
      // 只要有连接ID就尝试调用resize，让后端判断连接状态
      window.api.sshManager.resizeTerminal(connectionId.value, size.cols, size.rows)
    }
  })

  // 应用主题
  applyTheme()

  // 初始调整大小
  nextTick(() => {
    try {
      fitAddon.value?.fit()
    } catch (error) {
      console.warn('Error fitting terminal:', error)
    }
  })

}

// n-scrollbar 会自动处理滚动条显示，无需手动控制

// 连接服务器
const connect = async () => {
  if (!server.value || connecting.value) return

  connecting.value = true
  connectionError.value = ''
  connectionProgress.value = 0
  console.log('连接服务器', server.value, '连接ID:', connectionId.value)

  // 提前设置数据处理状态，确保事件监听器能立即处理数据
  canProcessData.value = true

  // 模拟连接进度
  const progressInterval = setInterval(() => {
    if (connectionProgress.value < 90) {
      connectionProgress.value += Math.random() * 20
    }
  }, 200)

  try {
    console.log('调用 connectToServer API...')
    const success = await window.api.serverManager.connectToServer(
      server.value.id,
      connectionId.value
    )
    console.log('连接结果:', success)

    // 完成进度
    connectionProgress.value = 100

    if (success) {
      isConnected.value = true
      emit('connected', connectionId.value)

      // 事件监听器已在onMounted中设置，这里只需要设置连接状态

      // 连接成功后立即设置终端尺寸并触发resize
      await nextTick(() => {
        if (terminal.value && fitAddon.value) {
          try {
            fitAddon.value.fit()
            // 获取终端尺寸并立即触发resize事件
            const dimensions = fitAddon.value.proposeDimensions()
            if (dimensions) {
              console.log('Terminal connected, triggering initial resize:', dimensions)
              // 确保在连接状态设置后再进行resize
              setTimeout(() => {
                terminal.value?.resize(dimensions.cols, dimensions.rows)
                // 直接调用resize API，确保首次resize被调用
                console.log('Directly calling resize API after connection')
                window.api.sshManager.resizeTerminal(
                  connectionId.value,
                  dimensions.cols,
                  dimensions.rows
                )
              }, 10) // 短暂延迟确保状态更新完成
            }
          } catch (error) {
            console.warn('Error fitting terminal after connection:', error)
          }
        }
      })
    } else {
      connectionError.value = `连接服务器 "${server.value.name}" 失败，请检查服务器配置和网络连接`
      isConnected.value = false
      canProcessData.value = false
      emit('error', connectionError.value)
    }
  } catch (error) {
    console.error('Connection error:', error)
    connectionError.value = `连接服务器 "${server.value?.name || '未知'}" 时发生错误: ${error}`
    isConnected.value = false
    canProcessData.value = false
    emit('error', connectionError.value)
  } finally {
    clearInterval(progressInterval)
    connecting.value = false
  }
}

// 重试连接
const retryConnection = () => {
  connectionError.value = ''
  connect()
}

// 断开连接
const disconnect = async () => {
  if (!connectionId.value || !isConnected.value) return

  try {
    await window.api.serverManager.disconnectFromServer(server.value.id)
    isConnected.value = false
    canProcessData.value = false
    connectionError.value = ''
    emit('disconnected', connectionId.value)
  } catch (error) {
    console.error('Disconnect error:', error)
    connectionError.value = `断开连接时发生错误: ${error}`
    emit('error', connectionError.value)
  }
}

// 监听服务器变化
watch(
  () => server.value,
  async (newServer, oldServer) => {
    if (oldServer && isConnected.value) {
      disconnect()
    }
    if (newServer) {
      terminal.value?.write(
        `\r\n准备连接到 ${newServer.name} (${newServer.host}:${newServer.port})\r\n`
      )
      // 自动连接新服务器
      await connect()
    }
  }
)

// 处理终端大小变化
const handleResize = () => {
  try {
    if (fitAddon.value && terminal.value) {
      // 使用 nextTick 确保 DOM 更新完成后再调整尺寸
      nextTick(() => {
        fitAddon.value?.fit()
        // 尺寸调整会通过onResize事件自动处理
      })
    }
  } catch (error) {
    console.warn('Error fitting terminal on resize:', error)
  }
}

// 设置 ResizeObserver 来观察终端元素大小变化
const setupResizeObserver = () => {
  if (!terminalRef.value) return

  resizeObserver.value = new ResizeObserver((entries) => {
    for (const _entry of entries) {
      // 防抖处理，避免频繁的尺寸调整
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
      resizeTimeout = setTimeout(() => {
        handleResize()
      }, 16) // 约 60fps 的更新频率
    }
  })

  resizeObserver.value.observe(terminalRef.value)
}

// 应用主题
const applyTheme = () => {
  if (!terminal.value) return

  try {
    terminal.value.options.theme = currentTheme.value
    console.log('Terminal theme applied:', isDarkTheme.value ? 'dark' : 'light')
  } catch (error) {
    console.error('Error applying terminal theme:', error)
  }
}

// 监听主题变化
watch(() => isDarkTheme.value, () => {
  applyTheme()
})

onMounted(async () => {
  console.log('Terminal mounted, props:', props.params)
  console.log('Server info:', server.value)
  initTerminal()

  // 设置 ResizeObserver 来观察终端元素大小变化
  setupResizeObserver()

  // 预先设置数据监听器，确保不丢失任何数据
  if (connectionId.value) {
    window.api.sshManager.onData(connectionId.value, (data: string) => {
      console.log('Received SSH data in Terminal:', data.substring(0, 50) + '...')
      console.log('Terminal instance:', !!terminal.value)
      console.log('Terminal element:', !!terminalRef.value)
      console.log('Can process data:', canProcessData.value)
      if (terminal.value && canProcessData.value) {
        terminal.value.write(data)
        console.log('Data written to terminal')
      } else {
        console.log('Terminal not ready or cannot process data, skipping data')
      }
    })

    // 监听连接状态变化
    window.api.sshManager.onConnectionStatusChanged(connectionId.value, (status: any) => {
      if (status.status === 'disconnected') {
        isConnected.value = false
        emit('disconnected', connectionId.value)
      }
    })
  }

  // 等待一个微任务，确保事件监听器完全设置好
  await nextTick()

  // 如果有服务器信息，自动连接
  if (server.value) {
    console.log('Auto-connecting to server:', server.value.name)
    await connect()
  }

  // n-scrollbar 会自动处理滚动条显示
})

onUnmounted(() => {
  if (isConnected.value && connectionId.value) {
    disconnect()
  }

  // 清理SSH监听器
  if (connectionId.value) {
    window.api.sshManager.removeListeners(connectionId.value)
  }

  // 清理防抖定时器
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }

  // 清理 ResizeObserver
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }

  // 安全地清理终端
  if (terminal.value) {
    try {
      terminal.value.dispose()
    } catch (error) {
      console.warn('Error disposing terminal:', error)
    }
  }
})
</script>

<style scoped>
.terminal-container {
  height: 100%;
  background: #1e1e1e;
  position: relative;
  padding: 12px;
  box-sizing: border-box;
}

/* 浅色主题下的终端容器背景 */
.terminal-container:not(.dark-theme) {
  background: #ffffff;
}

.terminal {
  height: 100%;
  padding: 0;
  box-sizing: border-box;
  background: #1e1e1e;
  border-radius: 6px;
  overflow: hidden;
}

/* 浅色主题下的终端背景 */
.terminal-container:not(.dark-theme) .terminal {
  background: #ffffff;
}

.terminal-hidden {
  display: none;
}

/* 连接状态样式 - 主题自适应 */
.connection-status {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  color: #333333;
}

/* 深色主题下的连接状态样式 */
.dark-theme .connection-status {
  background: #1e1e1e;
  color: #d4d4d4;
}

.connecting-state {
  text-align: center;
  width: 100%;
  max-width: 400px;
}

.progress-container {
  padding: 20px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2080f0, #18a058);
  border-radius: 4px;
  transition: width 0.3s ease;
  animation: progress-glow 2s ease-in-out infinite alternate;
}

@keyframes progress-glow {
  from {
    box-shadow: 0 0 5px rgba(32, 128, 240, 0.5);
  }
  to {
    box-shadow: 0 0 15px rgba(32, 128, 240, 0.8);
  }
}

/* 深色主题下的进度条样式 */
.dark-theme .progress-bar {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.progress-text {
  font-size: 14px;
  color: #333333;
}

/* 深色主题下的进度文本样式 */
.dark-theme .progress-text {
  color: #d4d4d4;
}

.error-state {
  text-align: center;
  padding: 40px 20px;
  max-width: 400px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-message {
  font-size: 14px;
  color: #d03050;
  margin-bottom: 20px;
  line-height: 1.5;
}

.retry-btn {
  background: var(--n-color-primary);
  color: var(--n-color-primary-text);
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: var(--n-color-primary-hover);
}

.disconnected-state {
  text-align: center;
  padding: 40px 20px;
  max-width: 400px;
}

.disconnected-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.disconnected-message {
  font-size: 14px;
  color: #8a8a8a;
  margin-bottom: 20px;
}

/* 深色主题下的断开连接消息样式 */
.dark-theme .disconnected-message {
  color: #8a8a8a;
}

.connect-btn {
  background: var(--n-color-success);
  color: var(--n-color-success-text);
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.connect-btn:hover {
  background: var(--n-color-success-hover);
}

/* 确保 xterm 终端正确填充容器 */
:deep(.xterm) {
  height: 100% !important;
  width: 100% !important;
}

/* 美化终端滚动条 - 主题自适应 */
:deep(.xterm-viewport::-webkit-scrollbar) {
  width: 8px;
}

:deep(.xterm-viewport::-webkit-scrollbar-track) {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

:deep(.xterm-viewport::-webkit-scrollbar-thumb) {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

:deep(.xterm-viewport::-webkit-scrollbar-thumb:hover) {
  background: rgba(0, 0, 0, 0.5);
  border-color: rgba(0, 0, 0, 0.2);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
}

:deep(.xterm-viewport::-webkit-scrollbar-thumb:active) {
  background: rgba(0, 0, 0, 0.7);
  border-color: rgba(0, 0, 0, 0.3);
}

:deep(.xterm-viewport::-webkit-scrollbar-corner) {
  background: rgba(0, 0, 0, 0.1);
}

/* 深色主题下的滚动条样式 */
.dark-theme :deep(.xterm-viewport::-webkit-scrollbar-track) {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dark-theme :deep(.xterm-viewport::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dark-theme :deep(.xterm-viewport::-webkit-scrollbar-thumb:hover) {
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
}

.dark-theme :deep(.xterm-viewport::-webkit-scrollbar-thumb:active) {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(255, 255, 255, 0.3);
}

.dark-theme :deep(.xterm-viewport::-webkit-scrollbar-corner) {
  background: rgba(255, 255, 255, 0.1);
}

/* 隐藏滚动条按钮 */
:deep(.xterm-viewport::-webkit-scrollbar-button) {
  display: none;
}
</style>
