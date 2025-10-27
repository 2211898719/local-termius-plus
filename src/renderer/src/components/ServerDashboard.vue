<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ServerConfig, ServerMetrics } from '../../../main/types/server'
import MetricCard from './MetricCard.vue'
import PerformanceChart from './PerformanceChart.vue'
import DiskUsageTable from './DiskUsageTable.vue'
import NetworkInfo from './NetworkInfo.vue'

interface Props {
  server: ServerConfig | null
  metrics: ServerMetrics | null
}

interface Emits {
  (e: 'connect', server: ServerConfig): void
  (e: 'disconnect', server: ServerConfig): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isConnected = ref(false)
const connectionStatus = ref<any>(null)

// 检查连接状态
const checkConnectionStatus = async () => {
  if (!props.server) return
  
  try {
    isConnected.value = await window.api.serverManager.isConnected(props.server.id)
    connectionStatus.value = await window.api.serverManager.getConnectionStatus(props.server.id)
  } catch (error) {
    console.error('Failed to check connection status:', error)
  }
}

// 连接/断开服务器
const toggleConnection = async () => {
  if (!props.server) return
  
  if (isConnected.value) {
    emit('disconnect', props.server)
  } else {
    emit('connect', props.server)
  }
}

// 获取服务器路径
const getServerPath = computed(() => {
  if (!props.server) {
    return '未选择服务器'
  }
  // 这里应该根据实际的分组结构来构建路径
  return '生产环境 / Web服务器'
})

// 格式化字节数（暂时未使用，保留以备后用）
// const formatBytes = (bytes: number): string => {
//   if (bytes === 0) return '0 B'
//   const k = 1024
//   const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
//   const i = Math.floor(Math.log(bytes) / Math.log(k))
//   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
// }

// 格式化百分比
const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`
}

// 生命周期
onMounted(() => {
  checkConnectionStatus()
})

// 监听服务器变化
const handleServerStatusChanged = (server: ServerConfig) => {
  if (props.server && server.id === props.server.id) {
    checkConnectionStatus()
  }
}

onMounted(() => {
  window.api.onServerStatusChanged(handleServerStatusChanged)
})

onUnmounted(() => {
  window.api.removeAllListeners('server-status-changed')
})
</script>

<template>
  <div class="server-dashboard">
    <!-- 头部信息 -->
    <div class="dashboard-header">
      <div class="server-info">
        <h1 class="server-name">{{ server?.name || '未选择服务器' }}</h1>
        <div class="server-details">
          <span class="server-ip">{{ server?.host || 'N/A' }}</span>
          <span class="server-path">{{ getServerPath }}</span>
        </div>
      </div>
      <div class="header-actions">
        <button class="action-btn">
          <span class="action-icon">🕒</span>
          历史记录
        </button>
        <button class="action-btn">
          <span class="action-icon">⚙️</span>
          配置
        </button>
        <button 
          class="action-btn primary"
          @click="toggleConnection"
        >
          <span class="action-icon">_</span>
          远程连接
        </button>
      </div>
    </div>

    <!-- 指标卡片 -->
    <div class="metrics-grid" v-if="metrics">
      <MetricCard
        title="CPU使用率"
        :value="formatPercentage(metrics.cpu.usage)"
        :trend="-5"
        trend-text="较昨日下降5%"
        :progress="metrics.cpu.usage"
        color="#1890ff"
      />
      <MetricCard
        title="内存使用率"
        :value="formatPercentage(metrics.memory.usage)"
        :trend="3"
        trend-text="较昨日上升3%"
        :progress="metrics.memory.usage"
        color="#13c2c2"
      />
      <MetricCard
        title="磁盘使用率"
        :value="formatPercentage(metrics.disk.usage)"
        :warning="metrics.disk.usage > 80"
        warning-text="空间不足"
        :progress="metrics.disk.usage"
        color="#fa8c16"
      />
      <MetricCard
        title="网络流量"
        :value="'1.2 GB/s'"
        :status="'normal'"
        status-text="正常"
        :sub-info="`接收 580 MB/s | 发送 620 MB/s`"
        color="#52c41a"
      />
    </div>

    <!-- 性能监控图表 -->
    <div class="charts-section" v-if="metrics">
      <div class="chart-container">
        <PerformanceChart
          title="CPU性能监控"
          :data="[]"
          color="#1890ff"
        />
      </div>
      <div class="chart-container">
        <PerformanceChart
          title="内存性能监控"
          :data="[]"
          color="#13c2c2"
        />
      </div>
    </div>

    <!-- 详细信息 -->
    <div class="details-section" v-if="metrics">
      <div class="detail-container">
        <DiskUsageTable :mount-points="metrics.disk.mountPoints" />
      </div>
      <div class="detail-container">
        <NetworkInfo :interfaces="metrics.network.interfaces" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.server-dashboard {
  padding: 24px;
  background-color: #ffffff;
  height: 100%;
  overflow-y: auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.server-info {
  flex: 1;
}

.server-name {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.server-details {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #666;
  font-size: 14px;
}

.server-ip {
  font-weight: 500;
  color: #333;
}

.server-path {
  color: #999;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #666;
}

.action-btn:hover {
  background-color: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.action-btn.primary {
  background-color: #1890ff;
  border-color: #1890ff;
  color: #ffffff;
}

.action-btn.primary:hover {
  background-color: #40a9ff;
  border-color: #40a9ff;
}

.action-icon {
  font-size: 16px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.chart-container {
  background-color: #ffffff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
}

.details-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-container {
  background-color: #ffffff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
}

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .details-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
