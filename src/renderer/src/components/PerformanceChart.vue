<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  title: string
  data: number[]
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: '#1890ff'
})

const chartRef = ref<HTMLCanvasElement>()
const animationId = ref<number>()
const timeData = ref<number[]>([])
const valueData = ref<number[]>([])

// 生成模拟数据
const generateMockData = () => {
  const now = Date.now()
  const dataPoints = 30
  
  for (let i = 0; i < dataPoints; i++) {
    timeData.value.push(now - (dataPoints - i) * 1000)
    // 生成模拟的CPU/内存使用率数据
    const baseValue = props.title.includes('CPU') ? 25 : 45
    const variation = Math.sin(i * 0.3) * 10 + Math.random() * 5
    valueData.value.push(Math.max(0, Math.min(100, baseValue + variation)))
  }
}

// 绘制图表
const drawChart = () => {
  if (!chartRef.value) return
  
  const canvas = chartRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const width = canvas.width
  const height = canvas.height
  
  // 清除画布
  ctx.clearRect(0, 0, width, height)
  
  // 设置样式
  ctx.strokeStyle = props.color
  ctx.lineWidth = 2
  ctx.fillStyle = props.color + '20' // 添加透明度
  
  // 绘制网格线
  ctx.strokeStyle = '#f0f0f0'
  ctx.lineWidth = 1
  
  // 水平网格线
  for (let i = 0; i <= 5; i++) {
    const y = (height / 5) * i
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  
  // 垂直网格线
  for (let i = 0; i <= 6; i++) {
    const x = (width / 6) * i
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  
  // 绘制数据线
  if (valueData.value.length > 1) {
    ctx.strokeStyle = props.color
    ctx.lineWidth = 2
    ctx.beginPath()
    
    valueData.value.forEach((value, index) => {
      const x = (width / (valueData.value.length - 1)) * index
      const y = height - (value / 100) * height
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    
    ctx.stroke()
    
    // 绘制填充区域
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fill()
  }
  
  // 绘制Y轴标签
  ctx.fillStyle = '#666'
  ctx.font = '12px Arial'
  ctx.textAlign = 'right'
  
  for (let i = 0; i <= 5; i++) {
    const y = (height / 5) * i
    const value = 100 - (i * 20)
    ctx.fillText(`${value}%`, width - 5, y + 4)
  }
  
  // 绘制X轴标签
  ctx.textAlign = 'center'
  ctx.fillText('0s', 0, height - 5)
  ctx.fillText('30s', width, height - 5)
}

// 更新数据
const updateData = () => {
  const now = Date.now()
  
  // 移除最旧的数据点
  if (timeData.value.length > 30) {
    timeData.value.shift()
    valueData.value.shift()
  }
  
  // 添加新的数据点
  timeData.value.push(now)
  const baseValue = props.title.includes('CPU') ? 25 : 45
  const variation = Math.sin(Date.now() * 0.001) * 10 + Math.random() * 5
  valueData.value.push(Math.max(0, Math.min(100, baseValue + variation)))
  
  drawChart()
}

// 动画循环
const animate = () => {
  updateData()
  animationId.value = requestAnimationFrame(animate)
}

onMounted(() => {
  generateMockData()
  drawChart()
  
  // 开始动画
  setTimeout(() => {
    animate()
  }, 1000)
})

onUnmounted(() => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
})
</script>

<template>
  <div class="performance-chart">
    <div class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
      <div class="chart-tabs">
        <button class="tab active">实时</button>
        <button class="tab">今日</button>
        <button class="tab">本周</button>
      </div>
    </div>
    
    <div class="chart-container">
      <canvas
        ref="chartRef"
        width="400"
        height="200"
        class="chart-canvas"
      ></canvas>
    </div>
  </div>
</template>

<style scoped>
.performance-chart {
  background-color: #ffffff;
  border-radius: 8px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.chart-tabs {
  display: flex;
  gap: 8px;
}

.tab {
  padding: 4px 12px;
  background-color: transparent;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  transition: all 0.2s;
}

.tab:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.tab.active {
  background-color: #1890ff;
  border-color: #1890ff;
  color: #ffffff;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 200px;
}

.chart-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
