<script setup lang="ts">
interface Props {
  title: string
  value: string
  trend?: number
  trendText?: string
  progress?: number
  color?: string
  warning?: boolean
  warningText?: string
  status?: 'normal' | 'warning' | 'error'
  statusText?: string
  subInfo?: string
}

withDefaults(defineProps<Props>(), {
  color: '#1890ff',
  progress: 0
})

// 获取趋势图标
const getTrendIcon = (trend?: number) => {
  if (trend === undefined) return ''
  return trend > 0 ? '↗' : '↘'
}

// 获取趋势颜色
const getTrendColor = (trend?: number) => {
  if (trend === undefined) return '#666'
  return trend > 0 ? '#ff4d4f' : '#52c41a'
}

// 获取状态图标
const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'normal':
      return '✓'
    case 'warning':
      return '⚠'
    case 'error':
      return '✗'
    default:
      return ''
  }
}

// 获取状态颜色
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'normal':
      return '#52c41a'
    case 'warning':
      return '#faad14'
    case 'error':
      return '#ff4d4f'
    default:
      return '#666'
  }
}
</script>

<template>
  <div class="metric-card">
    <div class="card-header">
      <h3 class="card-title">{{ title }}</h3>
      <div class="card-value">{{ value }}</div>
    </div>
    
    <div class="card-content">
      <!-- 趋势信息 -->
      <div v-if="trend !== undefined" class="trend-info">
        <span 
          class="trend-icon"
          :style="{ color: getTrendColor(trend) }"
        >
          {{ getTrendIcon(trend) }}
        </span>
        <span 
          class="trend-text"
          :style="{ color: getTrendColor(trend) }"
        >
          {{ trendText }}
        </span>
      </div>
      
      <!-- 警告信息 -->
      <div v-if="warning" class="warning-info">
        <span class="warning-icon">⚠</span>
        <span class="warning-text">{{ warningText }}</span>
      </div>
      
      <!-- 状态信息 -->
      <div v-if="status" class="status-info">
        <span 
          class="status-icon"
          :style="{ color: getStatusColor(status) }"
        >
          {{ getStatusIcon(status) }}
        </span>
        <span 
          class="status-text"
          :style="{ color: getStatusColor(status) }"
        >
          {{ statusText }}
        </span>
      </div>
      
      <!-- 子信息 -->
      <div v-if="subInfo" class="sub-info">
        {{ subInfo }}
      </div>
    </div>
    
    <!-- 进度条 -->
    <div v-if="progress !== undefined" class="progress-container">
      <div class="progress-bar">
        <div 
          class="progress-fill"
          :style="{ 
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: color
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metric-card {
  background-color: #ffffff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  transition: box-shadow 0.2s;
}

.metric-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  margin-bottom: 12px;
}

.card-title {
  font-size: 14px;
  color: #666;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.card-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  line-height: 1.2;
}

.card-content {
  margin-bottom: 12px;
}

.trend-info {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.trend-icon {
  font-size: 14px;
  font-weight: bold;
}

.trend-text {
  font-size: 12px;
}

.warning-info {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.warning-icon {
  font-size: 14px;
  color: #faad14;
}

.warning-text {
  font-size: 12px;
  color: #faad14;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.status-icon {
  font-size: 14px;
  font-weight: bold;
}

.status-text {
  font-size: 12px;
}

.sub-info {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.progress-container {
  margin-top: 8px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background-color: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}
</style>
