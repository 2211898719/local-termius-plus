<script setup lang="ts">
import { ref, watch } from 'vue'
import { ServerGroup } from '../../../main/types/server'

interface Props {
  visible: boolean
  group?: ServerGroup | null
  parentGroups: Array<{ id: string; name: string }>
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'save', group: Partial<ServerGroup>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = ref({
  name: '',
  description: '',
  parentId: ''
})

const isEdit = ref(false)

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    parentId: ''
  }
}

// 监听分组变化
watch(() => props.group, (group) => {
  if (group) {
    isEdit.value = true
    form.value = {
      name: group.name,
      description: group.description || '',
      parentId: group.parentId || ''
    }
  } else {
    isEdit.value = false
    resetForm()
  }
}, { immediate: true })

const handleSave = () => {
  if (!form.value.name) {
    alert('请输入分组名称')
    return
  }

  const groupData: Partial<ServerGroup> = {
    name: form.value.name,
    description: form.value.description,
    parentId: form.value.parentId || undefined
  }

  emit('save', groupData)
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
        <h3>{{ isEdit ? '编辑分组' : '添加分组' }}</h3>
        <button class="close-btn" @click="handleCancel">×</button>
      </div>
      
      <div class="dialog-body">
        <div class="form-group">
          <label>分组名称 *</label>
          <input v-model="form.name" type="text" placeholder="请输入分组名称" />
        </div>
        
        <div class="form-group">
          <label>分组描述</label>
          <textarea v-model="form.description" placeholder="请输入分组描述" rows="3"></textarea>
        </div>
        
        <div class="form-group">
          <label>父分组</label>
          <select v-model="form.parentId">
            <option value="">无（根分组）</option>
            <option v-for="group in parentGroups" :key="group.id" :value="group.id">
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
  width: 400px;
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
