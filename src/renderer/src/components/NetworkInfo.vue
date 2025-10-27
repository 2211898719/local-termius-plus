<script setup lang="ts">
import { computed } from 'vue'
import { NetworkInterface } from '../../../main/types/server'

interface Props {
  interfaces: NetworkInterface[]
}

const props = defineProps<Props>()

// 处理空数据
const displayInterfaces = computed(() => {
  if (props.interfaces.length === 0) {
    return [
      {
        name: 'eth0',
        ip: '192.168.1.101',
        mac: '00:1B:44:11:3A:B7',
        subnet: '255.255.255.0',
        status: 'up' as const
      }
    ]
  }
  return props.interfaces
})

// 获取状态颜色
const getStatusColor = (status: string): string => {
  return status === 'up' ? '#52c41a' : '#ff4d4f'
}

// 获取状态文本
const getStatusText = (status: string): string => {
  return status === 'up' ? '已连接' : '未连接'
}
</script>

<template>
  <div class="network-info">
    <div class="info-header">
      <h3 class="info-title">网络连接信息</h3>
      <button class="view-all-btn">查看全部</button>
    </div>
    
    <div class="interfaces-list">
      <div 
        v-for="iface in displayInterfaces" 
        :key="iface.name"
        class="interface-item"
      >
        <div class="interface-header">
          <div class="interface-name">{{ iface.name }}</div>
          <div class="interface-ip">({{ iface.ip }})</div>
          <div 
            class="interface-status"
            :style="{ color: getStatusColor(iface.status) }"
          >
            {{ getStatusText(iface.status) }}
          </div>
        </div>
        
        <div class="interface-details">
          <div class="detail-row">
            <span class="detail-label">MAC地址</span>
            <span class="detail-value">{{ iface.mac }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">子网掩码</span>
            <span class="detail-value">{{ iface.subnet }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.network-info {
  background-color: #ffffff;
  border-radius: 8px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 0 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.info-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.view-all-btn {
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.view-all-btn:hover {
  background-color: #f0f8ff;
}

.interfaces-list {
  padding: 0 16px 16px 16px;
}

.interface-item {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  transition: border-color 0.2s;
}

.interface-item:hover {
  border-color: #d9d9d9;
}

.interface-item:last-child {
  margin-bottom: 0;
}

.interface-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.interface-name {
  font-weight: 500;
  color: #333;
  font-family: monospace;
}

.interface-ip {
  color: #666;
  font-family: monospace;
}

.interface-status {
  margin-left: auto;
  font-size: 12px;
  font-weight: 500;
}

.interface-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.detail-label {
  color: #666;
  min-width: 60px;
}

.detail-value {
  color: #333;
  font-family: monospace;
  font-size: 12px;
}

@media (max-width: 768px) {
  .interface-header {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .interface-status {
    margin-left: 0;
    width: 100%;
  }
  
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  
  .detail-label {
    min-width: auto;
  }
}
</style>
