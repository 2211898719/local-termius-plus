<template>
  <n-card class="sidebar-card" :bordered="false" embedded>
    <AssetManager 
      :theme-mode="themeMode"
      :is-dark-theme="isDarkTheme"
      @select-server="$emit('selectServer', $event)"
      @connect-server="$emit('connectServer', $event)"
      @disconnect-server="$emit('disconnectServer', $event)"
      @server-double-click="$emit('serverDoubleClick', $event)"
      @toggle-theme="$emit('toggleTheme')"
    />
  </n-card>
</template>

<script setup lang="ts">
import { NCard } from 'naive-ui'
import AssetManager from './AssetManager.vue'
import { ServerConfig } from '../../../main/types/server'

// Props定义
defineProps<{
  themeMode: 'light' | 'dark' | 'system'
  isDarkTheme: boolean
}>()

// 事件定义
const emit = defineEmits<{
  selectServer: [server: ServerConfig]
  connectServer: [server: ServerConfig]
  disconnectServer: [server: ServerConfig]
  serverDoubleClick: [server: ServerConfig]
  toggleTheme: []
}>()
</script>

<style scoped>
.sidebar-card {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.sidebar-card :deep(.n-card__content) {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
}
</style>
