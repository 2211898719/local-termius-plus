<template>
  <div class="dockview-container" ref="dockviewContainer">
    <dockview-vue
      @ready="onReady"
      style="width:100%; height:100%"
      ref="dockviewRef"
    >
    </dockview-vue>
    
    <!-- 右键菜单 -->
    <n-dropdown
      :show="contextMenuVisible"
      :x="contextMenuPosition.x"
      :y="contextMenuPosition.y"
      :options="contextMenuOptions"
      @select="handleMenuSelect"
      @clickoutside="contextMenuVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import './dockview.css';
import { ref, onUnmounted, watch, computed, h } from 'vue'
import { NDropdown } from 'naive-ui'
import { DockviewVue } from 'dockview-vue'
import { DockviewApi } from 'dockview-core'
import { 
  themeAbyssSpaced, 
  themeLightSpaced 
} from 'dockview-core/dist/cjs/dockview/theme'
import { ServerConfig, ServerMetrics } from '../../../main/types/server'
import { Icon } from '@vicons/utils'
import ContentCopyFilled from '@vicons/material/ContentCopyFilled'
import CloseFilled from '@vicons/material/CloseFilled'
// import ServerDashboard from './ServerDashboard.vue'
// import Terminal from './Terminal.vue'

interface Props {
  selectedServer: ServerConfig | null
  serverMetrics: ServerMetrics | null
  isDarkTheme: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  connectServer: [server: ServerConfig]
  disconnectServer: [server: ServerConfig]
  terminalConnected: [serverId: string]
  terminalDisconnected: [serverId: string]
  terminalError: [error: string]
}>()

const dockviewRef = ref<InstanceType<typeof DockviewVue>>()
const dockviewContainer = ref<HTMLElement>()
let dockviewApi: DockviewApi | null = null

// 右键菜单状态
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const clickedTab = ref<any>(null) // 当前右键点击的tab

// 计算当前主题
const currentTheme = computed(() => {
  // 自定义主题，禁用分割线拖拽
  const customTheme = props.isDarkTheme ? { ...themeAbyssSpaced } : { ...themeLightSpaced }
  
  // 设置分割线为透明，禁用拖拽
  customTheme.sash = {
    size: 0,
    hoverSize: 0,
    disable: true
  }
  
  return customTheme
})

// 右键菜单选项
const contextMenuOptions = computed(() => [
  {
    label: '复制窗口',
    key: 'copy-window',
    icon: () => h(Icon, {}, { default: () => h(ContentCopyFilled) })
  },
  {
    label: '关闭所有窗口',
    key: 'close-all-windows',
    icon: () => h(Icon, {}, { default: () => h(CloseFilled) })
  },
  {
    label: '关闭其他窗口',
    key: 'close-other-windows',
    icon: () => h(Icon, {}, { default: () => h(CloseFilled) })
  }
])

// 应用主题
const applyTheme = () => {
  if (!dockviewApi) return
  
  try {
    dockviewApi.updateOptions({
      theme: currentTheme.value
    })
    console.log('Dockview theme applied:', props.isDarkTheme ? 'themeAbyssSpaced' : 'themeLightSpaced')
  } catch (error) {
    console.error('Error applying dockview theme:', error)
  }
}

// dockview 准备就绪时的回调
const onReady = (event: any) => {
  console.log('Dockview ready event:', event)
  const api = event.api
  console.log('Dockview API:', api)
  console.log('API methods:', Object.getOwnPropertyNames(api))
  console.log('addPanel method:', typeof api.addPanel)
  
  dockviewApi = api
  
  // 应用初始主题
  applyTheme()
  
  // 延迟创建初始面板，确保 API 完全初始化
  setTimeout(() => {
    createInitialPanels()
    setupTabContextMenu()
  }, 100)

  // 监听事件
  if (api.onDidAddPanel) {
    api.onDidAddPanel((event) => {
      console.log('Panel added:', event.id)
      // 重新设置tab右键菜单，因为可能有新的tab
      setTimeout(() => setupTabContextMenu(), 50)
    })
  }

  if (api.onDidRemovePanel) {
    api.onDidRemovePanel((event) => {
      console.log('Panel removed:', event.id)
    })
  }
}

// 创建初始面板
const createInitialPanels = () => {
  if (!dockviewApi) {
    console.error('Dockview API not available')
    return
  }

  if (typeof dockviewApi.addPanel !== 'function') {
    console.error('addPanel method not available on API:', dockviewApi)
    return
  }

  console.log('Creating initial panels...')

  try {
    // 不创建任何默认面板，保持空的 dockview 布局
    console.log('Dockview initialized with empty layout')
  } catch (error) {
    console.error('Error initializing dockview:', error)
  }
}

// 更新面板数据
const updatePanelData = () => {
  if (!dockviewApi) return
  // 没有默认面板需要更新，此函数保留以备将来使用
}

// 监听服务器变化
watch(() => props.selectedServer, (_newServer) => {
  updatePanelData()
  // 没有默认面板需要更新标题
}, { deep: true })

// 监听指标变化
watch(() => props.serverMetrics, () => {
  updatePanelData()
}, { deep: true })

// 监听主题变化
watch(() => props.isDarkTheme, () => {
  applyTheme()
})

// 添加新面板的方法
const addPanel = (id: string, title: string, component: string, params?: any) => {
  if (!dockviewApi) return

  const panel = dockviewApi.addPanel({
    id,
    component,
    title,
    params: {
      ...params,
      isDarkTheme: props.isDarkTheme
    }
  })

  return panel
}

// 创建新的连接面板
const createNewConnectionPanel = (server: ServerConfig) => {
  if (!dockviewApi) return

  const panelId = `terminal-${server.id}-${Date.now()}`
  const panel = dockviewApi.addPanel({
    id: panelId,
    component: 'terminal',
    title: `${server.name} - 远程连接`,
    params: {
      server: server,
      isDarkTheme: props.isDarkTheme
    }
  })

  return panel
}

// 移除面板的方法
const removePanel = (id: string) => {
  if (!dockviewApi) return
  const panel = dockviewApi.getPanel(id)
  if (panel) {
    dockviewApi.removePanel(panel)
  }
}

// 设置tab区域的右键菜单
const setupTabContextMenu = () => {
  if (!dockviewContainer.value || !dockviewApi) return
  
  // 查找所有的tab元素
  const tabs = dockviewContainer.value.querySelectorAll('.dv-tab')
  
  tabs.forEach(tab => {
    // 移除之前的事件监听器（如果有的话）
    tab.removeEventListener('contextmenu', handleTabContextMenu)
    // 添加新的右键菜单事件监听器
    tab.addEventListener('contextmenu', (event) => handleTabContextMenu(event, tab))
  })
}

// tab区域右键菜单处理函数
const handleTabContextMenu = (event: MouseEvent, tabElement: Element) => {
  event.preventDefault()
  event.stopPropagation()
  
  if (!dockviewApi) return
  
  // 尝试多种方式获取面板ID
  let panelId = tabElement.getAttribute('data-panel-id') || 
                tabElement.getAttribute('data-id') ||
                tabElement.id
  
  // 如果还是没有找到，尝试从父元素或兄弟元素中查找
  if (!panelId) {
    const parentElement = tabElement.closest('[data-panel-id]') || 
                         tabElement.closest('[data-id]')
    if (parentElement) {
      panelId = parentElement.getAttribute('data-panel-id') || 
                parentElement.getAttribute('data-id')
    }
  }
  
  // 如果仍然没有找到，尝试通过tab的文本内容匹配面板标题
  if (!panelId) {
    const tabText = tabElement.textContent?.trim()
    if (tabText) {
      const panels = dockviewApi.panels
      const matchingPanel = panels.find(panel => panel.title === tabText)
      if (matchingPanel) {
        panelId = matchingPanel.id
      }
    }
  }
  
  console.log('Tab element:', tabElement)
  console.log('Found panel ID:', panelId)
  
  if (panelId && dockviewApi) {
    const panel = dockviewApi.getPanel(panelId)
    clickedTab.value = panel
    console.log('Found panel:', panel)
  } else {
    console.warn('Could not find panel for tab element')
    clickedTab.value = null
  }
  
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  contextMenuVisible.value = true
}

// 菜单选择处理函数
const handleMenuSelect = (key: string) => {
  contextMenuVisible.value = false
  
  switch (key) {
    case 'copy-window':
      handleCopyWindow()
      break
    case 'close-all-windows':
      handleCloseAllWindows()
      break
    case 'close-other-windows':
      handleCloseOtherWindows()
      break
  }
}

// 复制窗口
const handleCopyWindow = () => {
  console.log('Copy window called')
  console.log('dockviewApi:', dockviewApi)
  console.log('clickedTab.value:', clickedTab.value)
  
  if (!dockviewApi) {
    console.error('Dockview API not available')
    return
  }
  
  if (!clickedTab.value) {
    console.error('No clicked tab available')
    return
  }
  
  const originalPanel = clickedTab.value
  console.log('Original panel:', originalPanel)
  console.log('Original panel params:', originalPanel.params)
  console.log('Original panel view:', originalPanel.view)
  
  const originalParams = originalPanel.params || {}
  
  // 创建新面板，复制原面板的配置
  const newPanelId = `${originalPanel.id}-copy-${Date.now()}`
  const newTitle = `${originalPanel.title} (副本)`
  
  try {
    const newPanel = dockviewApi.addPanel({
      id: newPanelId,
      component: originalPanel.view.contentComponent,
      title: newTitle,
      params: {
        ...originalParams,
        isDarkTheme: props.isDarkTheme
      }
    })
    
    console.log('Panel copied successfully:', newPanelId, newPanel)
  } catch (error) {
    console.error('Error copying panel:', error)
  }
}

// 关闭所有窗口
const handleCloseAllWindows = () => {
  if (!dockviewApi) return
  
  const panels = dockviewApi.panels
  panels.forEach(panel => {
    dockviewApi?.removePanel(panel)
  })
  
  console.log('All windows closed')
}

// 关闭其他窗口
const handleCloseOtherWindows = () => {
  console.log('Close other windows called')
  console.log('dockviewApi:', dockviewApi)
  console.log('clickedTab.value:', clickedTab.value)
  
  if (!dockviewApi) {
    console.error('Dockview API not available')
    return
  }
  
  if (!clickedTab.value) {
    console.error('No clicked tab available')
    return
  }
  
  const currentPanel = clickedTab.value
  const panels = dockviewApi.panels
  
  console.log('Current panel to keep:', currentPanel.id)
  console.log('All panels:', panels.map(p => p.id))
  
  panels.forEach(panel => {
    if (panel.id !== currentPanel.id) {
      console.log('Closing panel:', panel.id)
      dockviewApi?.removePanel(panel)
    } else {
      console.log('Keeping panel:', panel.id)
    }
  })
  
  console.log('Other windows closed, keeping:', currentPanel.id)
}

// 暴露方法给父组件
defineExpose({
  addPanel,
  removePanel,
  createNewConnectionPanel,
  getApi: () => dockviewApi
})

onUnmounted(() => {
  // 清理tab右键菜单事件监听器
  if (dockviewContainer.value) {
    const tabs = dockviewContainer.value.querySelectorAll('.dv-tab')
    tabs.forEach(tab => {
      tab.removeEventListener('contextmenu', handleTabContextMenu)
    })
  }
  
  if (dockviewApi) {
    dockviewApi.dispose()
  }
})
</script>

<style scoped>
/* dockview 容器样式 */
.dockview-container {
  width: 100%;
  height: 100%;
  position: relative;
}

/* dockview-vue 组件样式 */
:deep(.dockview) {
  --dv-activegroup-visiblepanel-tab-color: #ffffff;
  --dv-activegroup-visiblepanel-tab-background-color: #2d2d2d;
  --dv-inactivegroup-visiblepanel-tab-color: #cccccc;
  --dv-inactivegroup-visiblepanel-tab-background-color: #3c3c3c;
  --dv-group-view-background-color: #1e1e1e;
  --dv-tabs-and-actions-container-background-color: #2d2d2d;
  --dv-activegroup-visiblepanel-tab-divider-color: #404040;
  --dv-inactivegroup-visiblepanel-tab-divider-color: #404040;
  --dv-tab-divider-color: #404040;
  --dv-activegroup-visiblepanel-tab-highlighted-color: #1890ff;
  --dv-inactivegroup-visiblepanel-tab-highlighted-color: #1890ff;
  --dv-activegroup-hiddenpanel-tab-color: #999999;
  --dv-inactivegroup-hiddenpanel-tab-color: #666666;
  --dv-activegroup-hiddenpanel-tab-background-color: #2d2d2d;
  --dv-inactivegroup-hiddenpanel-tab-background-color: #3c3c3c;
  --dv-activegroup-hiddenpanel-tab-highlighted-color: #1890ff;
  --dv-inactivegroup-hiddenpanel-tab-highlighted-color: #1890ff;
  --dv-floatinggroup-tab-color: #ffffff;
  --dv-floatinggroup-tab-background-color: #2d2d2d;
  --dv-floatinggroup-tab-divider-color: #404040;
  --dv-floatinggroup-tab-highlighted-color: #1890ff;
  --dv-separator-border: #404040;
  --dv-drop-target-background-color: rgba(24, 144, 255, 0.1);
  --dv-drop-target-border-color: #1890ff;
  --dv-drag-over-background-color: rgba(24, 144, 255, 0.2);
  --dv-drag-over-border-color: #1890ff;
}

/* 确保 dockview 面板有正确的高度 */
:deep(.dockview-panel) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.dockview-panel-content) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
