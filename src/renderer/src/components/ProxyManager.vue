<template>
  <div class="proxy-manager">
    <div class="proxy-header">
      <h2>代理管理</h2>
      <div class="proxy-actions">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索代理..."
          class="search-input"
        />
        <button @click="showAddDialog = true" class="add-btn">
          ➕ 添加代理
        </button>
      </div>
    </div>

    <div class="proxy-list">
      <div
        v-for="proxy in filteredProxies"
        :key="proxy.id"
        class="proxy-item"
        :class="{ disabled: !proxy.enabled }"
      >
        <div class="proxy-info">
          <div class="proxy-name">
            {{ proxy.name }}
            <span class="proxy-type" :class="proxy.type">{{ proxy.type.toUpperCase() }}</span>
          </div>
          <div class="proxy-details">
            {{ proxy.host }}:{{ proxy.port }}
            <span v-if="proxy.username" class="auth-info">🔐 需要认证</span>
          </div>
          <div v-if="proxy.description" class="proxy-description">
            {{ proxy.description }}
          </div>
        </div>
        
        <div class="proxy-status">
          <span class="status-indicator" :class="{ enabled: proxy.enabled }">
            {{ proxy.enabled ? '启用' : '禁用' }}
          </span>
        </div>

        <div class="proxy-actions">
          <button @click="testProxy(proxy)" class="test-btn" title="测试连接">
            🧪
          </button>
          <button @click="editProxy(proxy)" class="edit-btn" title="编辑">
            ✏️
          </button>
          <button @click="toggleProxy(proxy)" class="toggle-btn" :title="proxy.enabled ? '禁用' : '启用'">
            {{ proxy.enabled ? '⏸️' : '▶️' }}
          </button>
          <button @click="deleteProxy(proxy)" class="delete-btn" title="删除">
            🗑️
          </button>
        </div>
      </div>

      <div v-if="filteredProxies.length === 0" class="empty-state">
        <p>暂无代理配置</p>
        <button @click="showAddDialog = true" class="add-first-btn">
          添加第一个代理
        </button>
      </div>
    </div>

    <!-- 添加/编辑代理对话框 -->
    <div v-if="showAddDialog || editingProxy" class="dialog-overlay" @click="closeDialog">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ editingProxy ? '编辑代理' : '添加代理' }}</h3>
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
              {{ editingProxy ? '更新' : '添加' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ProxyConfig, ProxyType } from '../../../main/types/server'

// 响应式数据
const proxies = ref<ProxyConfig[]>([])
const searchQuery = ref('')
const showAddDialog = ref(false)
const editingProxy = ref<ProxyConfig | null>(null)

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

// 计算属性
const filteredProxies = computed(() => {
  if (!searchQuery.value) {
    return proxies.value
  }
  
  const query = searchQuery.value.toLowerCase()
  return proxies.value.filter(proxy =>
    proxy.name.toLowerCase().includes(query) ||
    proxy.host.toLowerCase().includes(query) ||
    proxy.type.toLowerCase().includes(query) ||
    (proxy.description && proxy.description.toLowerCase().includes(query))
  )
})

// 方法
const loadProxies = async () => {
  try {
    proxies.value = await window.api.proxyManager.getAllProxies()
  } catch (error) {
    console.error('Failed to load proxies:', error)
  }
}

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

const closeDialog = () => {
  showAddDialog.value = false
  editingProxy.value = null
  resetForm()
}

const editProxy = (proxy: ProxyConfig) => {
  editingProxy.value = proxy
  form.value = {
    name: proxy.name,
    type: proxy.type,
    host: proxy.host,
    port: proxy.port,
    username: proxy.username || '',
    password: proxy.password || '',
    description: proxy.description || '',
    enabled: proxy.enabled
  }
}

const saveProxy = async () => {
  try {
    if (editingProxy.value) {
      await window.api.proxyManager.updateProxy(editingProxy.value.id, form.value)
    } else {
      await window.api.proxyManager.createProxy(form.value)
    }
    
    await loadProxies()
    closeDialog()
  } catch (error) {
    console.error('Failed to save proxy:', error)
  }
}

const deleteProxy = async (proxy: ProxyConfig) => {
  if (confirm(`确定要删除代理 "${proxy.name}" 吗？`)) {
    try {
      await window.api.proxyManager.deleteProxy(proxy.id)
      await loadProxies()
    } catch (error) {
      console.error('Failed to delete proxy:', error)
    }
  }
}

const toggleProxy = async (proxy: ProxyConfig) => {
  try {
    await window.api.proxyManager.toggleProxy(proxy.id)
    await loadProxies()
  } catch (error) {
    console.error('Failed to toggle proxy:', error)
  }
}

const testProxy = async (proxy: ProxyConfig) => {
  try {
    const result = await window.api.proxyManager.testProxy(proxy)
    if (result) {
      alert(`代理 "${proxy.name}" 连接测试成功！`)
    } else {
      alert(`代理 "${proxy.name}" 连接测试失败！`)
    }
  } catch (error) {
    console.error('Failed to test proxy:', error)
    alert(`代理测试失败: ${error}`)
  }
}

// 生命周期
onMounted(() => {
  loadProxies()
})
</script>

<style scoped>
.proxy-manager {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.proxy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.proxy-header h2 {
  margin: 0;
  color: #333;
}

.proxy-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  width: 200px;
}

.add-btn {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.add-btn:hover {
  background: #40a9ff;
}

.proxy-list {
  flex: 1;
  overflow-y: auto;
}

.proxy-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 10px;
  background: white;
  transition: all 0.2s;
}

.proxy-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.proxy-item.disabled {
  opacity: 0.6;
  background: #f5f5f5;
}

.proxy-info {
  flex: 1;
}

.proxy-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.proxy-type {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
}

.proxy-type.http {
  background: #52c41a;
  color: white;
}

.proxy-type.socks4 {
  background: #fa8c16;
  color: white;
}

.proxy-type.socks5 {
  background: #1890ff;
  color: white;
}

.proxy-details {
  color: #666;
  font-size: 14px;
  margin-bottom: 5px;
}

.auth-info {
  color: #fa8c16;
  font-size: 12px;
}

.proxy-description {
  color: #999;
  font-size: 12px;
}

.proxy-status {
  margin: 0 15px;
}

.status-indicator {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-indicator.enabled {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.status-indicator:not(.enabled) {
  background: #fff2e8;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.proxy-actions {
  display: flex;
  gap: 5px;
}

.proxy-actions button {
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.test-btn {
  background: #52c41a;
  color: white;
}

.test-btn:hover {
  background: #73d13d;
}

.edit-btn {
  background: #1890ff;
  color: white;
}

.edit-btn:hover {
  background: #40a9ff;
}

.toggle-btn {
  background: #fa8c16;
  color: white;
}

.toggle-btn:hover {
  background: #ffa940;
}

.delete-btn {
  background: #ff4d4f;
  color: white;
}

.delete-btn:hover {
  background: #ff7875;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.add-first-btn {
  padding: 10px 20px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 15px;
}

.add-first-btn:hover {
  background: #40a9ff;
}

/* 对话框样式 */
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
