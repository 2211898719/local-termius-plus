<script setup lang="ts">
import { ref, watch } from 'vue'
import { ServerConfig } from '../../../main/types/server'

interface Props {
  visible: boolean
  server?: ServerConfig | null
  groups: Array<{ id: string; name: string }>
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'save', server: Partial<ServerConfig>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = ref({
  name: '',
  host: '',
  port: 22,
  username: '',
  password: '',
  privateKey: '',
  groupId: '',
  description: ''
})

const isEdit = ref(false)

const resetForm = () => {
  form.value = {
    name: '',
    host: '',
    port: 22,
    username: '',
    password: '',
    privateKey: '',
    groupId: '',
    description: ''
  }
}

// 监听服务器变化
watch(() => props.server, (server) => {
  if (server) {
    isEdit.value = true
    form.value = {
      name: server.name,
      host: server.host,
      port: server.port,
      username: server.username,
      password: server.password || '',
      privateKey: server.privateKey || '',
      groupId: server.groupId,
      description: ''
    }
  } else {
    isEdit.value = false
    resetForm()
  }
}, { immediate: true })

const handleSave = () => {
  if (!form.value.name || !form.value.host || !form.value.username || !form.value.groupId) {
    alert('请填写必填字段')
    return
  }

  const serverData: Partial<ServerConfig> = {
    name: form.value.name,
    host: form.value.host,
    port: form.value.port,
    username: form.value.username,
    groupId: form.value.groupId,
    status: 'stopped'
  }

  if (form.value.password) {
    serverData.password = form.value.password
  }
  if (form.value.privateKey) {
    serverData.privateKey = form.value.privateKey
  }

  emit('save', serverData)
  handleCancel()
}

const handleCancel = () => {
  emit('update:visible', false)
  resetForm()
}
</script>

<template>
  <div v-if="visible" class="dialog-overlay" @click="handleCancel">
    <div class="dialog-content" @click.stop>
      <div class="dialog-header">
        <h3>{{ isEdit ? '编辑服务器' : '添加服务器' }}</h3>
        <button class="close-btn" @click="handleCancel">×</button>
      </div>
      
      <div class="dialog-body">
        <div class="form-group">
          <label>服务器名称 *</label>
          <input v-model="form.name" type="text" placeholder="请输入服务器名称" />
        </div>
        
        <div class="form-group">
          <label>IP地址 *</label>
          <input v-model="form.host" type="text" placeholder="请输入IP地址" />
        </div>
        
        <div class="form-group">
          <label>端口</label>
          <input v-model.number="form.port" type="number" placeholder="22" />
        </div>
        
        <div class="form-group">
          <label>用户名 *</label>
          <input v-model="form.username" type="text" placeholder="请输入用户名" />
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <input v-model="form.password" type="password" placeholder="请输入密码" />
        </div>
        
        <div class="form-group">
          <label>私钥</label>
          <textarea v-model="form.privateKey" placeholder="请输入SSH私钥内容" rows="3"></textarea>
        </div>
        
        <div class="form-group">
          <label>所属分组 *</label>
          <select v-model="form.groupId">
            <option value="">请选择分组</option>
            <option v-for="group in groups" :key="group.id" :value="group.id">
              {{ group.name }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="handleCancel">取消</button>
        <button class="btn btn-primary" @click="handleSave">保存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  border-radius: 8px;
  width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.dialog-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1890ff;
}

.form-group textarea {
  resize: vertical;
  min-height: 60px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #f0f0f0;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #666;
  border-color: #d9d9d9;
}

.btn-secondary:hover {
  background-color: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.btn-primary {
  background-color: #1890ff;
  color: white;
  border-color: #1890ff;
}

.btn-primary:hover {
  background-color: #40a9ff;
  border-color: #40a9ff;
}
</style>
