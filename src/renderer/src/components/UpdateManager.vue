<template>
  <div class="update-manager">
    <n-card title="应用更新" class="update-card">
      <template #header-extra>
        <n-space>
          <n-button 
            type="primary" 
            :loading="isChecking" 
            @click="checkForUpdates"
            :disabled="isDownloading"
          >
            {{ isChecking ? '检查中...' : '检查更新' }}
          </n-button>
          <n-button 
            v-if="updateInfo" 
            type="success" 
            :loading="isDownloading"
            @click="downloadUpdate"
            :disabled="isChecking"
          >
            {{ isDownloading ? '下载中...' : '下载更新' }}
          </n-button>
          <n-button 
            v-if="updateDownloaded" 
            type="warning" 
            @click="installUpdate"
          >
            安装更新
          </n-button>
        </n-space>
      </template>

      <n-space vertical>
        <!-- 当前版本信息 -->
        <n-descriptions label-placement="left" :column="1">
          <n-descriptions-item label="当前版本">
            <n-tag type="info">{{ currentVersion }}</n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="状态">
            <n-tag :type="statusType">{{ statusText }}</n-tag>
          </n-descriptions-item>
        </n-descriptions>

        <!-- 更新信息 -->
        <n-alert 
          v-if="updateInfo" 
          type="success" 
          title="发现新版本"
          :show-icon="true"
        >
          <template #header>
            新版本 {{ updateInfo.version }} 可用
          </template>
          <div v-if="updateInfo.releaseNotes">
            <n-text depth="3">更新内容：</n-text>
            <div class="release-notes">
              {{ updateInfo.releaseNotes }}
            </div>
          </div>
        </n-alert>

        <!-- 下载进度 -->
        <n-card v-if="isDownloading" title="下载进度" size="small">
          <n-progress 
            type="line" 
            :percentage="downloadProgress.percent"
            :show-indicator="true"
          />
          <div class="progress-info">
            <n-text depth="3">
              {{ formatBytes(downloadProgress.transferred) }} / {{ formatBytes(downloadProgress.total) }}
              ({{ formatBytes(downloadProgress.bytesPerSecond) }}/s)
            </n-text>
          </div>
        </n-card>

        <!-- 更新完成 -->
        <n-alert 
          v-if="updateDownloaded" 
          type="warning" 
          title="更新下载完成"
          :show-icon="true"
        >
          更新已下载完成，点击"安装更新"按钮重启应用以完成更新。
        </n-alert>

        <!-- 错误信息 -->
        <n-alert 
          v-if="updateError" 
          type="error" 
          title="更新失败"
          :show-icon="true"
        >
          {{ updateError }}
        </n-alert>

        <!-- 自动更新设置 -->
        <n-divider />
        <n-space vertical>
          <n-text strong>自动更新设置</n-text>
          <n-space>
            <n-switch v-model:value="autoCheckEnabled" @update:value="toggleAutoCheck">
              <template #checked>启用自动检查</template>
              <template #unchecked>禁用自动检查</template>
            </n-switch>
            <n-text depth="3">应用启动时自动检查更新</n-text>
          </n-space>
        </n-space>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { NCard, NSpace, NButton, NDescriptions, NDescriptionsItem, NTag, NAlert, NProgress, NText, NDivider, NSwitch, useMessage } from 'naive-ui'

const message = useMessage()

// 响应式数据
const currentVersion = ref('')
const updateInfo = ref<any>(null)
const isChecking = ref(false)
const isDownloading = ref(false)
const updateDownloaded = ref(false)
const updateError = ref('')
const downloadProgress = ref({
  percent: 0,
  transferred: 0,
  total: 0,
  bytesPerSecond: 0
})
const autoCheckEnabled = ref(true)

// 计算属性
const statusType = computed(() => {
  if (isChecking.value) return 'warning'
  if (isDownloading.value) return 'info'
  if (updateDownloaded.value) return 'success'
  if (updateInfo.value) return 'success'
  return 'default'
})

const statusText = computed(() => {
  if (isChecking.value) return '检查更新中'
  if (isDownloading.value) return '下载更新中'
  if (updateDownloaded.value) return '更新已下载'
  if (updateInfo.value) return '有新版本可用'
  return '已是最新版本'
})

// 方法
const checkForUpdates = async () => {
  try {
    isChecking.value = true
    updateError.value = ''
    await window.api.updateManager.checkForUpdates()
  } catch (error) {
    console.error('检查更新失败:', error)
    updateError.value = '检查更新失败，请稍后重试'
  }
}

const downloadUpdate = async () => {
  try {
    isDownloading.value = true
    updateError.value = ''
    await window.api.updateManager.downloadUpdate()
  } catch (error) {
    console.error('下载更新失败:', error)
    updateError.value = '下载更新失败，请稍后重试'
    isDownloading.value = false
  }
}

const installUpdate = async () => {
  try {
    await window.api.updateManager.installUpdate()
  } catch (error) {
    console.error('安装更新失败:', error)
    updateError.value = '安装更新失败，请稍后重试'
  }
}

const toggleAutoCheck = (enabled: boolean) => {
  // 这里可以保存到本地存储
  localStorage.setItem('autoCheckEnabled', enabled.toString())
  message.success(enabled ? '已启用自动检查更新' : '已禁用自动检查更新')
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 事件监听
const setupEventListeners = () => {
  window.api.updateManager.onUpdateChecking(() => {
    isChecking.value = true
  })

  window.api.updateManager.onUpdateAvailable((info) => {
    updateInfo.value = info
    isChecking.value = false
    message.success(`发现新版本 ${info.version}`)
  })

  window.api.updateManager.onUpdateNotAvailable(() => {
    isChecking.value = false
    message.info('当前已是最新版本')
  })

  window.api.updateManager.onUpdateDownloadProgress((progress) => {
    downloadProgress.value = progress
  })

  window.api.updateManager.onUpdateDownloaded(() => {
    isDownloading.value = false
    updateDownloaded.value = true
    message.success('更新下载完成')
  })

  window.api.updateManager.onUpdateError((error) => {
    isChecking.value = false
    isDownloading.value = false
    updateError.value = error.message || '更新过程中发生错误'
    message.error('更新失败')
  })
}

const removeEventListeners = () => {
  window.api.updateManager.removeUpdateListeners()
}

// 生命周期
onMounted(async () => {
  // 获取当前版本
  currentVersion.value = await window.api.updateManager.getCurrentVersion()
  
  // 设置事件监听
  setupEventListeners()
  
  // 检查是否有可用的更新信息
  const info = await window.api.updateManager.getUpdateInfo()
  if (info) {
    updateInfo.value = info
  }
  
  // 检查是否正在检查或下载
  isChecking.value = await window.api.updateManager.isCheckingForUpdate()
  isDownloading.value = await window.api.updateManager.isDownloadingUpdate()
  
  // 加载自动检查设置
  const saved = localStorage.getItem('autoCheckEnabled')
  if (saved !== null) {
    autoCheckEnabled.value = saved === 'true'
  }
  
  // 如果启用了自动检查，则检查更新
  if (autoCheckEnabled.value && !updateInfo.value) {
    setTimeout(() => {
      checkForUpdates()
    }, 2000) // 延迟2秒检查
  }
})

onUnmounted(() => {
  removeEventListeners()
})
</script>

<style scoped>
.update-manager {
  padding: 16px;
}

.update-card {
  max-width: 600px;
  margin: 0 auto;
}

.release-notes {
  margin-top: 8px;
  padding: 8px;
  background: var(--n-color-target);
  border-radius: 4px;
  white-space: pre-wrap;
  font-size: 14px;
}

.progress-info {
  margin-top: 8px;
  text-align: center;
}
</style>
