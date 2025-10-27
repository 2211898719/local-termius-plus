<script setup lang="ts">
import { computed } from 'vue'
import { DiskMountPoint } from '../../../main/types/server'

interface Props {
  mountPoints: DiskMountPoint[]
}

const props = defineProps<Props>()

// 格式化字节数
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化百分比
const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`
}

// 获取使用率颜色
const getUsageColor = (usage: number): string => {
  if (usage >= 90) return '#ff4d4f'
  if (usage >= 80) return '#faad14'
  if (usage >= 60) return '#1890ff'
  return '#52c41a'
}

// 处理空数据
const displayMountPoints = computed(() => {
  if (props.mountPoints.length === 0) {
    return [
      {
        mountPoint: '/',
        fileSystem: 'ext4',
        total: 100 * 1024 * 1024 * 1024, // 100GB
        used: 68 * 1024 * 1024 * 1024,   // 68GB
        usage: 68
      },
      {
        mountPoint: '/home',
        fileSystem: 'ext4',
        total: 50 * 1024 * 1024 * 1024,  // 50GB
        used: 25 * 1024 * 1024 * 1024,   // 25GB
        usage: 50
      }
    ]
  }
  return props.mountPoints
})
</script>

<template>
  <div class="disk-usage-table">
    <div class="table-header">
      <h3 class="table-title">磁盘使用详情</h3>
    </div>
    
    <div class="table-container">
      <table class="usage-table">
        <thead>
          <tr>
            <th>挂载点</th>
            <th>文件系统</th>
            <th>总容量</th>
            <th>已使用</th>
            <th>使用率</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="mount in displayMountPoints" :key="mount.mountPoint">
            <td class="mount-point">{{ mount.mountPoint }}</td>
            <td class="file-system">{{ mount.fileSystem }}</td>
            <td class="total-size">{{ formatBytes(mount.total) }}</td>
            <td class="used-size">{{ formatBytes(mount.used) }}</td>
            <td class="usage-cell">
              <div class="usage-info">
                <span 
                  class="usage-percentage"
                  :style="{ color: getUsageColor(mount.usage) }"
                >
                  {{ formatPercentage(mount.usage) }}
                </span>
                <div class="usage-bar">
                  <div 
                    class="usage-fill"
                    :style="{ 
                      width: `${mount.usage}%`,
                      backgroundColor: getUsageColor(mount.usage)
                    }"
                  ></div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.disk-usage-table {
  background-color: #ffffff;
  border-radius: 8px;
}

.table-header {
  padding: 16px 16px 0 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.table-container {
  padding: 0 16px 16px 16px;
}

.usage-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.usage-table th {
  background-color: #fafafa;
  color: #666;
  font-weight: 500;
  text-align: left;
  padding: 12px 8px;
  border-bottom: 1px solid #f0f0f0;
}

.usage-table td {
  padding: 12px 8px;
  border-bottom: 1px solid #f5f5f5;
  color: #333;
}

.usage-table tr:hover {
  background-color: #fafafa;
}

.mount-point {
  font-weight: 500;
  color: #333;
}

.file-system {
  color: #666;
  font-family: monospace;
}

.total-size,
.used-size {
  color: #666;
  font-family: monospace;
}

.usage-cell {
  width: 120px;
}

.usage-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.usage-percentage {
  font-weight: 500;
  min-width: 40px;
}

.usage-bar {
  flex: 1;
  height: 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.usage-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

@media (max-width: 768px) {
  .table-container {
    overflow-x: auto;
  }
  
  .usage-table {
    min-width: 500px;
  }
  
  .usage-table th,
  .usage-table td {
    padding: 8px 4px;
    font-size: 12px;
  }
}
</style>
