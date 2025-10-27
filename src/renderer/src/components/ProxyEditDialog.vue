<template>
  <div v-if="visible" class="dialog-overlay" @click="closeDialog">
    <div class="dialog" @click.stop>
      <div class="dialog-header">
        <h3>{{ proxy ? '编辑代理' : '添加代理' }}</h3>
        <button @click="closeDialog" class="close-btn">✕</button>
      </div>

      <form @submit.prevent="saveProxy" class="dialog-form">
        <div class="form-group">
          <label>名称 *</label>
          <input v-model="form.name" type="text" required />
        </div>

        <div class="form-group">
          <label>类型 *</label>
          <select v-model="form.type" required>
            <option value="http">HTTP</option>
            <option value="socks4">SOCKS4</option>
            <option value="socks5">SOCKS5</option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>主机 *</label>
            <input v-model="form.host" type="text" required />
          </div>
          <div class="form-group">
            <label>端口 *</label>
            <input v-model.number="form.port" type="number" required min="1" max="65535" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>用户名</label>
            <input v-model="form.username" type="text" />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="form.password" type="password" />
          </div>
        </div>

        <div class="form-group">
          <label>描述</label>
          <textarea v-model="form.description" rows="3"></textarea>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input v-model="form.enabled" type="checkbox" />
            启用此代理
          </label>
        </div>

        <div class="dialog-actions">
          <button type="button" @click="closeDialog" class="cancel-btn">
            取消
          </button>
          <button type="submit" class="save-btn">
            {{ proxy ? '更新' : '添加' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ProxyConfig, ProxyType } from '../../../main/types/server'

interface Props {
  visible: boolean
  proxy?: ProxyConfig | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [proxy: Partial<ProxyConfig>]
}>()

// 表单数据
const form = ref({
  name: '',
  type: 'http' as ProxyType,
  host: '',
  port: 8080,
  username: '',
  password: '',
  description: '',
  enabled: true
})

// 重置表单
const resetForm = () => {
  form.value = {
    name: '',
    type: 'http',
    host: '',
    port: 8080,
    username: '',
    password: '',
    description: '',
    enabled: true
  }
}

// 监听props变化
watch(() => props.proxy, (newProxy) => {
  if (newProxy) {
    form.value = {
      name: newProxy.name,
      type: newProxy.type,
      host: newProxy.host,
      port: newProxy.port,
      username: newProxy.username || '',
      password: newProxy.password || '',
      description: newProxy.description || '',
      enabled: newProxy.enabled
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// 方法
const closeDialog = () => {
  emit('update:visible', false)
  resetForm()
}

const saveProxy = () => {
  emit('save', { ...form.value })
  closeDialog()
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 8px;
  width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.dialog-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #333;
  font-weight: 500;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1890ff;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  color: #333;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #e6f7ff;
  border-color: #91d5ff;
}

.save-btn {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn:hover {
  background: #40a9ff;
}
</style>
