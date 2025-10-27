<script setup lang="ts">
import { ref, computed } from 'vue'
import { ServerConfig, ServerGroup } from '../../../main/types/server'
import ServerEditDialog from './ServerEditDialog.vue'
import GroupEditDialog from './GroupEditDialog.vue'

interface Props {
  groups: ServerGroup[]
  searchQuery: string
}

interface Emits {
  (e: 'update:searchQuery', value: string): void
  (e: 'selectServer', server: ServerConfig): void
  (e: 'connectServer', server: ServerConfig): void
  (e: 'disconnectServer', server: ServerConfig): void
  (e: 'addServer', server: Partial<ServerConfig>): void
  (e: 'updateServer', serverId: string, server: Partial<ServerConfig>): void
  (e: 'deleteServer', serverId: string): void
  (e: 'addGroup', group: Partial<ServerGroup>): void
  (e: 'updateGroup', groupId: string, group: Partial<ServerGroup>): void
  (e: 'deleteGroup', groupId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const expandedGroups = ref<Set<string>>(new Set(['production']))

// 对话框状态
const serverDialogVisible = ref(false)
const groupDialogVisible = ref(false)
const editingServer = ref<ServerConfig | null>(null)
const editingGroup = ref<ServerGroup | null>(null)
const addingServerToGroup = ref<string | null>(null)

// 过滤后的分组
const filteredGroups = computed(() => {
  if (!props.searchQuery) {
    return props.groups
  }
  
  const query = props.searchQuery.toLowerCase()
  return props.groups.map(group => ({
    ...group,
    servers: group.servers.filter(server => 
      server.name.toLowerCase().includes(query) ||
      server.host.includes(query)
    ),
    children: group.children.map(childGroup => ({
      ...childGroup,
      servers: childGroup.servers.filter(server => 
        server.name.toLowerCase().includes(query) ||
        server.host.includes(query)
      )
    })).filter(childGroup => childGroup.servers.length > 0)
  })).filter(group => group.servers.length > 0 || group.children.length > 0)
})

// 获取所有分组（用于下拉选择）
const allGroups = computed(() => {
  const groups: Array<{ id: string; name: string }> = []
  
  const collectGroups = (groupList: ServerGroup[]) => {
    groupList.forEach(group => {
      groups.push({ id: group.id, name: group.name })
      if (group.children.length > 0) {
        collectGroups(group.children)
      }
    })
  }
  
  collectGroups(props.groups)
  return groups
})

// 获取根分组（用于父分组选择）
const rootGroups = computed(() => {
  return props.groups.filter(group => !group.parentId)
})

// 切换分组展开状态
const toggleGroup = (groupId: string) => {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId)
  } else {
    expandedGroups.value.add(groupId)
  }
}

// 获取状态颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case 'running':
      return '#52c41a'
    case 'stopped':
      return '#d9d9d9'
    case 'maintenance':
      return '#faad14'
    case 'error':
      return '#ff4d4f'
    default:
      return '#d9d9d9'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'running':
      return '运行中'
    case 'stopped':
      return '已停止'
    case 'maintenance':
      return '维护中'
    case 'error':
      return '错误'
    default:
      return '未知'
  }
}

// 服务器操作
const handleAddServer = (groupId?: string) => {
  editingServer.value = null
  addingServerToGroup.value = groupId || null
  serverDialogVisible.value = true
}

const handleEditServer = (server: ServerConfig) => {
  editingServer.value = server
  addingServerToGroup.value = null
  serverDialogVisible.value = true
}

const handleDeleteServer = (server: ServerConfig) => {
  if (confirm(`确定要删除服务器 "${server.name}" 吗？`)) {
    emit('deleteServer', server.id)
  }
}

const handleSaveServer = (serverData: Partial<ServerConfig>) => {
  if (editingServer.value) {
    emit('updateServer', editingServer.value.id, serverData)
  } else {
    if (addingServerToGroup.value) {
      serverData.groupId = addingServerToGroup.value
    }
    emit('addServer', serverData)
  }
}

// 分组操作
const handleAddGroup = () => {
  editingGroup.value = null
  groupDialogVisible.value = true
}

const handleEditGroup = (group: ServerGroup) => {
  editingGroup.value = group
  groupDialogVisible.value = true
}

const handleDeleteGroup = (group: ServerGroup) => {
  if (group.servers.length > 0) {
    alert('该分组下还有服务器，请先删除所有服务器')
    return
  }
  if (group.children.length > 0) {
    alert('该分组下还有子分组，请先删除所有子分组')
    return
  }
  if (confirm(`确定要删除分组 "${group.name}" 吗？`)) {
    emit('deleteGroup', group.id)
  }
}

const handleSaveGroup = (groupData: Partial<ServerGroup>) => {
  if (editingGroup.value) {
    emit('updateGroup', editingGroup.value.id, groupData)
  } else {
    emit('addGroup', groupData)
  }
}
</script>

<template>
  <div class="server-sidebar">
    <!-- 搜索框 -->
    <div class="search-container">
      <input
        type="text"
        placeholder="搜索服务器或分组..."
        :value="searchQuery"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        class="search-input"
      />
    </div>

    <!-- 服务器分组列表 -->
    <div class="groups-container">
      <div
        v-for="group in filteredGroups"
        :key="group.id"
        class="group-item"
      >
        <!-- 分组标题 -->
        <div
          class="group-header"
          @click="toggleGroup(group.id)"
        >
          <span class="group-icon" :class="{ expanded: expandedGroups.has(group.id) }">
            ▶
          </span>
          <span class="group-name">{{ group.name }}</span>
          <div class="group-actions" @click.stop>
            <button class="action-btn" @click="handleEditGroup(group)" title="编辑分组">
              ✏️
            </button>
            <button class="action-btn" @click="handleDeleteGroup(group)" title="删除分组">
              🗑️
            </button>
            <button class="action-btn" @click="handleAddServer(group.id)" title="添加服务器">
              ➕
            </button>
          </div>
        </div>

        <!-- 根分组的服务器列表 -->
        <div
          v-if="expandedGroups.has(group.id) && group.servers.length > 0"
          class="servers-list"
        >
          <div
            v-for="server in group.servers"
            :key="server.id"
            class="server-item"
            @click="emit('selectServer', server)"
          >
            <div class="server-info">
              <div class="server-name">{{ server.name }}</div>
              <div class="server-ip">{{ server.host }}</div>
            </div>
            <div class="server-status">
              <span
                class="status-dot"
                :style="{ backgroundColor: getStatusColor(server.status) }"
              ></span>
              <span class="status-text">{{ getStatusText(server.status) }}</span>
            </div>
            <div class="server-actions" @click.stop>
              <button class="action-btn" @click="handleEditServer(server)" title="编辑服务器">
                ✏️
              </button>
              <button class="action-btn" @click="handleDeleteServer(server)" title="删除服务器">
                🗑️
              </button>
            </div>
          </div>
        </div>

        <!-- 子分组 -->
        <div
          v-if="expandedGroups.has(group.id)"
          class="subgroups"
        >
          <div
            v-for="subgroup in group.children"
            :key="subgroup.id"
            class="subgroup-item"
          >
            <!-- 子分组标题 -->
            <div
              class="subgroup-header"
              @click="toggleGroup(subgroup.id)"
            >
              <span class="subgroup-icon" :class="{ expanded: expandedGroups.has(subgroup.id) }">
                ▶
              </span>
              <span class="subgroup-name">{{ subgroup.name }}</span>
              <div class="subgroup-actions" @click.stop>
                <button class="action-btn" @click="handleEditGroup(subgroup)" title="编辑分组">
                  ✏️
                </button>
                <button class="action-btn" @click="handleDeleteGroup(subgroup)" title="删除分组">
                  🗑️
                </button>
                <button class="action-btn" @click="handleAddServer(subgroup.id)" title="添加服务器">
                  ➕
                </button>
              </div>
            </div>

            <!-- 服务器列表 -->
            <div
              v-if="expandedGroups.has(subgroup.id)"
              class="servers-list"
            >
              <div
                v-for="server in subgroup.servers"
                :key="server.id"
                class="server-item"
                @click="emit('selectServer', server)"
              >
                <div class="server-info">
                  <div class="server-name">{{ server.name }}</div>
                  <div class="server-ip">{{ server.host }}</div>
                </div>
                <div class="server-status">
                  <span
                    class="status-dot"
                    :style="{ backgroundColor: getStatusColor(server.status) }"
                  ></span>
                  <span class="status-text">{{ getStatusText(server.status) }}</span>
                </div>
                <div class="server-actions" @click.stop>
                  <button class="action-btn" @click="handleEditServer(server)" title="编辑服务器">
                    ✏️
                  </button>
                  <button class="action-btn" @click="handleDeleteServer(server)" title="删除服务器">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加根分组按钮 -->
    <div class="add-group-container">
      <button class="add-group-btn" @click="handleAddGroup">
        <span class="add-icon">+</span>
        添加根分组
      </button>
    </div>

    <!-- 对话框 -->
    <ServerEditDialog
      v-model:visible="serverDialogVisible"
      :server="editingServer"
      :groups="allGroups"
      @save="handleSaveServer"
    />
    
    <GroupEditDialog
      v-model:visible="groupDialogVisible"
      :group="editingGroup"
      :parent-groups="rootGroups"
      @save="handleSaveGroup"
    />
  </div>
</template>

<style scoped>
.server-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

.search-container {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: #1890ff;
}

.groups-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.group-item {
  margin-bottom: 4px;
}

.group-header {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.group-header:hover {
  background-color: #f5f5f5;
}

.group-header:hover .group-actions {
  opacity: 1;
}

.group-icon {
  margin-right: 8px;
  font-size: 12px;
  transition: transform 0.2s;
  color: #666;
}

.group-icon.expanded {
  transform: rotate(90deg);
}

.group-name {
  font-weight: 500;
  color: #333;
  flex: 1;
}

.group-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  margin-left: 8px;
}

.subgroups {
  margin-left: 16px;
}

.subgroup-item {
  margin-bottom: 2px;
}

.subgroup-header {
  display: flex;
  align-items: center;
  padding: 6px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.subgroup-header:hover {
  background-color: #f5f5f5;
}

.subgroup-header:hover .subgroup-actions {
  opacity: 1;
}

.subgroup-icon {
  margin-right: 8px;
  font-size: 10px;
  transition: transform 0.2s;
  color: #666;
}

.subgroup-icon.expanded {
  transform: rotate(90deg);
}

.subgroup-name {
  font-size: 14px;
  color: #666;
  flex: 1;
}

.subgroup-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  margin-left: 8px;
}

.servers-list {
  margin-left: 16px;
}

.server-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-radius: 4px;
  margin: 2px 8px;
  position: relative;
}

.server-item:hover {
  background-color: #f0f8ff;
}

.server-item:hover .server-actions {
  opacity: 1;
}

.server-item.selected {
  background-color: #e6f7ff;
  border-left: 3px solid #1890ff;
}

.server-info {
  flex: 1;
}

.server-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.server-ip {
  font-size: 12px;
  color: #666;
}

.server-status {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-text {
  font-size: 12px;
  color: #666;
}

.server-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  margin-left: 8px;
}

.add-group-container {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

.add-group-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #666;
}

.add-group-btn:hover {
  background-color: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 12px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.action-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.add-icon {
  font-size: 16px;
  font-weight: bold;
}
</style>
