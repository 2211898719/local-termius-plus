<template>
  <div class="asset-manager">
    <div class="asset-header">
      <div class="header-top">
        <h2>资产管理v1.0.3</h2>
        <n-popover  trigger="hover" placement="bottom-end">
          <template #trigger>
            <button class="theme-toggle-btn" @click="$emit('toggleTheme')">
              <n-icon>
                <Icon>
                  <component :is="getThemeIcon()" />
                </Icon>
              </n-icon>
            </button>
          </template>
          <div class="theme-tooltip">
            {{ getThemeTooltip() }}
          </div>
        </n-popover>
      </div>
      <div class="asset-actions">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索资源..."
          class="search-input"
        />
      </div>
    </div>


    <div class="asset-tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'servers' }"
          @click="activeTab = 'servers'"
        >
          <n-icon>
            <Icon>
              <BareMetalServer />
            </Icon>
          </n-icon>
          服务器
        </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'proxies' }"
        @click="activeTab = 'proxies'"
      >
        <n-icon>
          <Icon>
            <ServerProxy />
          </Icon>
        </n-icon>
        代理
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'settings' }"
        @click="activeTab = 'settings'"
      >
        <n-icon>
          <Icon>
            <SettingsRound />
          </Icon>
        </n-icon>
        设置
      </button>
    </div>

    <div class="asset-content custom-scrollbar">
      <!-- 服务器管理 -->
      <div v-if="activeTab === 'servers'" class="server-section">
        <div class="section-header">
          <h3>服务器列表</h3>
          <div class="header-actions">
            <button @click="showAddServerDialog = true" class="add-btn">
              <n-icon>
                <Icon>
                  <AddFilled />
                </Icon>
              </n-icon>
              添加服务器
            </button>
            <button @click="handleAddRootGroup" class="add-btn">
              <n-icon>
                <Icon>
                  <FolderFilled />
                </Icon>
              </n-icon>
              添加分组
            </button>
          </div>
        </div>

        <div class="server-tree custom-scrollbar">
          <n-tree
            :data="treeData"
            :default-expand-all="false"
            :selectable="true"
            :cascade="false"
            :node-props="nodeProps"
            @update:selected-keys="handleTreeSelect"
            @contextmenu="handleTreeContextMenu"
            class="server-tree-component"
          />
        </div>

        <!-- 保留原有的服务器组结构作为备用 -->
        <div class="server-groups" style="display: none;">
          <div
            v-for="group in filteredServerGroups"
            :key="group.id"
            class="group-item"
          >
            <div class="group-header" @click="toggleGroup(group.id)">
              <span class="group-icon" :class="{ expanded: expandedGroups.has(group.id) }">
                <n-icon>
                  <Icon>
                    <component :is="expandedGroups.has(group.id) ? ExpandLessFilled : ExpandMoreFilled" />
                  </Icon>
                </n-icon>
              </span>
              <span class="group-name">{{ group.name }}</span>
              <div class="group-actions" @click.stop>
                <button class="action-btn" @click="handleEditGroup(group)" title="编辑分组">
                  <n-icon>
                    <Icon>
                      <EditFilled />
                    </Icon>
                  </n-icon>
                </button>
                <button class="action-btn" @click="handleAddServer(group.id)" title="添加服务器">
                  <n-icon>
                    <Icon>
                      <AddFilled />
                    </Icon>
                  </n-icon>
                </button>
                <button class="action-btn" @click="handleDeleteGroup(group)" title="删除分组">
                  <n-icon>
                    <Icon>
                      <DeleteFilled />
                    </Icon>
                  </n-icon>
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
                @click="selectServer(server)"
                @dblclick="handleServerDoubleClick(server)"
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
                    <n-icon>
                      <Icon>
                        <EditFilled />
                      </Icon>
                    </n-icon>
                  </button>
                  <button class="action-btn" @click="handleDeleteServer(server)" title="删除服务器">
                    <n-icon>
                      <Icon>
                        <DeleteFilled />
                      </Icon>
                    </n-icon>
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
                <div class="subgroup-header" @click="toggleGroup(subgroup.id)">
                  <span class="subgroup-icon" :class="{ expanded: expandedGroups.has(subgroup.id) }">
                    <n-icon>
                      <Icon>
                        <component :is="expandedGroups.has(subgroup.id) ? ExpandLessFilled : ExpandMoreFilled" />
                      </Icon>
                    </n-icon>
                  </span>
                  <span class="subgroup-name">{{ subgroup.name }}</span>
                  <div class="subgroup-actions" @click.stop>
                    <button class="action-btn" @click="handleEditGroup(subgroup)" title="编辑分组">
                      <n-icon>
                        <Icon>
                          <EditFilled />
                        </Icon>
                      </n-icon>
                    </button>
                    <button class="action-btn" @click="handleAddServer(subgroup.id)" title="添加服务器">
                      <n-icon>
                        <Icon>
                          <AddFilled />
                        </Icon>
                      </n-icon>
                    </button>
                    <button class="action-btn" @click="handleDeleteGroup(subgroup)" title="删除分组">
                      <n-icon>
                        <Icon>
                          <DeleteFilled />
                        </Icon>
                      </n-icon>
                    </button>
                  </div>
                </div>

                <div
                  v-if="expandedGroups.has(subgroup.id) && subgroup.servers.length > 0"
                  class="servers-list"
                >
                  <div
                    v-for="server in subgroup.servers"
                    :key="server.id"
                    class="server-item"
                    @click="selectServer(server)"
                    @dblclick="handleServerDoubleClick(server)"
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
                        <n-icon>
                          <Icon>
                            <EditFilled />
                          </Icon>
                        </n-icon>
                      </button>
                      <button class="action-btn" @click="handleDeleteServer(server)" title="删除服务器">
                        <n-icon>
                          <Icon>
                            <DeleteFilled />
                          </Icon>
                        </n-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 代理管理 -->
      <div v-if="activeTab === 'proxies'" class="proxy-section">
        <div class="section-header">
          <h3>代理列表</h3>
          <button @click="showAddProxyDialog = true" class="add-btn">
            <n-icon>
              <Icon>
                <AddFilled />
              </Icon>
            </n-icon>
            添加代理
          </button>
        </div>

        <div class="proxy-list custom-scrollbar">
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
                <span v-if="proxy.username" class="auth-info">
                  <n-icon>
                    <Icon>
                      <SecurityFilled />
                    </Icon>
                  </n-icon>
                  需要认证
                </span>
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
                <n-icon>
                  <Icon>
                    <ScienceFilled />
                  </Icon>
                </n-icon>
              </button>
              <button @click="editProxy(proxy)" class="edit-btn" title="编辑">
                <n-icon>
                  <Icon>
                    <EditFilled />
                  </Icon>
                </n-icon>
              </button>
              <button @click="toggleProxy(proxy)" class="toggle-btn" :title="proxy.enabled ? '禁用' : '启用'">
                <n-icon>
                  <Icon>
                    <component :is="proxy.enabled ? PauseFilled : PlayArrowFilled" />
                  </Icon>
                </n-icon>
              </button>
              <button @click="deleteProxy(proxy)" class="delete-btn" title="删除">
                <n-icon>
                  <Icon>
                    <DeleteFilled />
                  </Icon>
                </n-icon>
              </button>
            </div>
          </div>

          <div v-if="filteredProxies.length === 0" class="empty-state">
            <p>暂无代理配置</p>
            <button @click="showAddProxyDialog = true" class="add-first-btn">
              添加第一个代理
            </button>
          </div>
        </div>
      </div>

      <!-- 设置管理 -->
      <div v-if="activeTab === 'settings'" class="settings-section">
        <div class="section-header">
          <h3>应用设置</h3>
        </div>
        
        <div class="settings-content">
          <UpdateManager />
        </div>
      </div>
    </div>

    <!-- 服务器编辑对话框 -->
    <n-modal
      v-model:show="showAddServerDialog"
      preset="dialog"
      :title="editingServer ? '编辑服务器' : '添加服务器'"
      positive-text="保存"
      negative-text="取消"
      :positive-button-props="{ loading: serverSaving }"
      @positive-click="handleSaveServer"
      @negative-click="handleCancelServer"
      style="width: 600px"
    >
      <n-form
        ref="serverFormRef"
        :model="serverForm"
        :rules="serverFormRules"
        label-placement="left"
        label-width="100px"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="服务器名称" path="name">
          <n-input v-model:value="serverForm.name" placeholder="请输入服务器名称" />
        </n-form-item>

        <n-form-item label="主机地址" path="host">
          <n-input
            v-model:value="serverForm.host"
            placeholder="请输入IP地址或域名，如：192.168.1.1 或 example.com"
            clearable
          />
        </n-form-item>

        <n-form-item label="端口" path="port">
          <n-input-number v-model:value="serverForm.port" :min="1" :max="65535" style="width: 100%" />
        </n-form-item>

        <n-form-item label="用户名" path="username">
          <n-input v-model:value="serverForm.username" placeholder="请输入用户名" />
        </n-form-item>

        <n-form-item label="密码" path="password">
          <n-input
            v-model:value="serverForm.password"
            type="password"
            placeholder="请输入密码"
            show-password-on="click"
          />
        </n-form-item>

        <n-form-item label="私钥" path="privateKey">
          <n-input
            v-model:value="serverForm.privateKey"
            type="textarea"
            placeholder="请输入私钥内容（可选）"
            :rows="3"
          />
        </n-form-item>

        <n-form-item label="代理配置" path="proxyId">
          <n-select
            v-model:value="serverForm.proxyId"
            :options="proxyOptions"
            placeholder="请选择代理配置（可选）"
            filterable
            clearable
          />
        </n-form-item>

        <n-form-item label="所属分组" path="groupId">
          <n-select
            v-model:value="serverForm.groupId"
            :options="groupOptions"
            placeholder="请选择分组"
            filterable
          />
        </n-form-item>

        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="serverForm.description"
            type="textarea"
            placeholder="请输入服务器描述（可选）"
            :rows="2"
          />
        </n-form-item>
      </n-form>
    </n-modal>

    <!-- 分组编辑对话框 -->
    <n-modal
      v-model:show="showAddGroupDialog"
      preset="dialog"
      :title="editingGroup ? '编辑分组' : '添加分组'"
      positive-text="保存"
      negative-text="取消"
      :positive-button-props="{ loading: groupSaving }"
      @positive-click="handleSaveGroup"
      @negative-click="handleCancelGroup"
      style="width: 500px"
    >
      <n-form
        ref="groupFormRef"
        :model="groupForm"
        :rules="groupFormRules"
        label-placement="left"
        label-width="100px"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="分组名称" path="name">
          <n-input v-model:value="groupForm.name" placeholder="请输入分组名称" />
        </n-form-item>

        <n-form-item label="父分组" path="parentId">
          <n-select
            v-model:value="groupForm.parentId"
            :options="parentGroupOptions"
            placeholder="请选择父分组（可选）"
            filterable
            clearable
          />
        </n-form-item>

        <n-form-item label="代理配置" path="proxyId">
          <n-select
            v-model:value="groupForm.proxyId"
            :options="proxyOptions"
            placeholder="请选择代理配置（可选）"
            filterable
            clearable
          />
        </n-form-item>

        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="groupForm.description"
            type="textarea"
            placeholder="请输入分组描述（可选）"
            :rows="2"
          />
        </n-form-item>
      </n-form>
    </n-modal>

    <!-- 代理编辑对话框 -->
    <n-modal
      v-model:show="showAddProxyDialog"
      preset="dialog"
      :title="editingProxy ? '编辑代理' : '添加代理'"
      positive-text="保存"
      negative-text="取消"
      :positive-button-props="{ loading: proxySaving }"
      @positive-click="handleSaveProxy"
      @negative-click="handleCancelProxy"
      style="width: 600px"
    >
      <n-form
        ref="proxyFormRef"
        :model="proxyForm"
        :rules="proxyFormRules"
        label-placement="left"
        label-width="100px"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="代理名称" path="name">
          <n-input v-model:value="proxyForm.name" placeholder="请输入代理名称" />
        </n-form-item>

        <n-form-item label="代理类型" path="type">
          <n-select
            v-model:value="proxyForm.type"
            :options="proxyTypeOptions"
            placeholder="请选择代理类型"
          />
        </n-form-item>

        <n-form-item label="主机地址" path="host">
          <n-input
            v-model:value="proxyForm.host"
            placeholder="请输入代理IP地址或域名，如：127.0.0.1 或 proxy.example.com"
            clearable
          />
        </n-form-item>

        <n-form-item label="端口" path="port">
          <n-input-number v-model:value="proxyForm.port" :min="1" :max="65535" style="width: 100%" />
        </n-form-item>

        <n-form-item v-if="proxyForm.type === 'http'" label="用户名" path="username">
          <n-input v-model:value="proxyForm.username" placeholder="请输入用户名（可选）" />
        </n-form-item>

        <n-form-item v-if="proxyForm.type === 'http'" label="密码" path="password">
          <n-input
            v-model:value="proxyForm.password"
            type="password"
            placeholder="请输入密码（可选）"
            show-password-on="click"
          />
        </n-form-item>

        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="proxyForm.description"
            type="textarea"
            placeholder="请输入代理描述（可选）"
            :rows="2"
          />
        </n-form-item>
      </n-form>
    </n-modal>

    <!-- 删除确认对话框 -->
    <n-modal
      v-model:show="showDeleteConfirmDialog"
      preset="dialog"
      :title="deleteConfirmData?.title || '确认删除'"
      positive-text="确认删除"
      negative-text="取消"
      :positive-button-props="{ type: 'error' }"
      @positive-click="handleConfirmDelete"
      @negative-click="showDeleteConfirmDialog = false"
      style="width: 500px"
    >
      <div v-if="deleteConfirmData" style="padding: 20px 0;">
        <n-alert
          :type="deleteConfirmData.isSecondConfirm ? 'error' : 'warning'"
          :title="deleteConfirmData.isSecondConfirm ? '⚠️ 最终确认' : '⚠️ 删除确认'"
          style="margin-bottom: 16px;"
        >
          <div v-html="deleteConfirmData.message"></div>
        </n-alert>

        <div v-if="deleteConfirmData.type === 'group' && !deleteConfirmData.isSecondConfirm" style="color: #666; font-size: 14px;">
          <p>此分组包含以下内容：</p>
          <ul style="margin: 8px 0; padding-left: 20px;">
            <li v-if="deleteConfirmData.item.servers?.length > 0">
              {{ deleteConfirmData.item.servers.length }} 个服务器
            </li>
            <li v-if="deleteConfirmData.item.children?.length > 0">
              {{ deleteConfirmData.item.children.length }} 个子分组
            </li>
          </ul>
          <p style="color: #ff4d4f; font-weight: bold;">
            删除后将无法恢复，请谨慎操作！
          </p>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import {
  NTree,
  NInput,
  NIcon,
  NModal,
  NForm,
  NFormItem,
  NSelect,
  NInputNumber,
  NAlert,
  NPopover,
  FormInst,
  useMessage
} from 'naive-ui'
import { ServerConfig, ServerGroup, ProxyConfig } from '../../../main/types/server'
import { Icon } from '@vicons/utils'
import LinkFilled from '@vicons/material/LinkFilled'
import EditFilled from '@vicons/material/EditFilled'
import DeleteFilled from '@vicons/material/DeleteFilled'
import AddFilled from '@vicons/material/AddFilled'
import ComputerFilled from '@vicons/material/ComputerFilled'
import FolderFilled from '@vicons/material/FolderFilled'
import Sunny from '@vicons/material/WbSunnyOutlined'
import Moon from '@vicons/material/ModeNightOutlined'
import SettingsRound from '@vicons/material/SettingsRound'
import BareMetalServer from '@vicons/carbon/BareMetalServer'
import ServerProxy from '@vicons/carbon/ServerProxy'
import UpdateManager from './UpdateManager.vue'

// Props定义
const props = defineProps<{
  themeMode: 'light' | 'dark' | 'system'
  isDarkTheme: boolean
}>()

// 事件定义
const emit = defineEmits<{
  selectServer: [server: ServerConfig]
  connectServer: [server: ServerConfig]
  disconnectServer: [server: ServerConfig]
  serverDoubleClick: [server: ServerConfig]
  toggleTheme: []
}>()

// 获取主题图标
const getThemeIcon = () => {
  switch (props.themeMode) {
    case 'light':
      return Sunny
    case 'dark':
      return Moon
    case 'system':
      return SettingsRound
    default:
      return SettingsRound
  }
}

// 获取主题工具提示
const getThemeTooltip = () => {
  switch (props.themeMode) {
    case 'light':
      return '当前：浅色模式，点击切换到深色模式'
    case 'dark':
      return '当前：深色模式，点击切换到跟随系统'
    case 'system':
      return '当前：跟随系统，点击切换到浅色模式'
    default:
      return '点击切换主题'
  }
}
import ScienceFilled from '@vicons/material/ScienceFilled'
import PlayArrowFilled from '@vicons/material/PlayArrowFilled'
import PauseFilled from '@vicons/material/PauseFilled'
import SecurityFilled from '@vicons/material/SecurityFilled'
import ExpandMoreFilled from '@vicons/material/ExpandMoreFilled'
import ExpandLessFilled from '@vicons/material/ExpandLessFilled'

// 消息API
const message = useMessage()

// 响应式数据
const activeTab = ref<'servers' | 'proxies'>('servers')
const searchQuery = ref('')
const serverGroups = ref<ServerGroup[]>([])
const proxies = ref<ProxyConfig[]>([])
const proxyConfigs = computed(() => proxies.value)
const expandedGroups = ref<Set<string>>(new Set())

// 对话框状态
const showAddServerDialog = ref(false)
const showAddGroupDialog = ref(false)
const showAddProxyDialog = ref(false)
const editingServer = ref<ServerConfig | null>(null)
const editingGroup = ref<ServerGroup | null>(null)
const editingProxy = ref<ProxyConfig | null>(null)
const addingServerToGroup = ref<string | null>(null)

// 保存状态
const serverSaving = ref(false)
const groupSaving = ref(false)
const proxySaving = ref(false)

// 删除确认对话框状态
const showDeleteConfirmDialog = ref(false)
const deleteConfirmData = ref<{
  type: 'server' | 'group' | 'proxy'
  item: any
  title: string
  message: string
  isSecondConfirm?: boolean
} | null>(null)

// 表单引用
const serverFormRef = ref<FormInst | null>(null)
const groupFormRef = ref<FormInst | null>(null)
const proxyFormRef = ref<FormInst | null>(null)

// 服务器表单数据
const serverForm = ref({
  name: '',
  host: '',
  port: 22,
  username: '',
  password: '',
  privateKey: '',
  groupId: '',
  proxyId: '',
  description: ''
})

// 分组表单数据
const groupForm = ref({
  name: '',
  parentId: '',
  proxyId: '',
  description: ''
})

// 代理表单数据
const proxyForm = ref({
  name: '',
  type: 'socks5',
  host: '',
  port: 1080,
  username: '',
  password: '',
  description: ''
})

// 自定义验证器
const validators = {
  // IP地址验证
  ipAddress: (_rule: any, value: string) => {
    if (!value) return true // 空值由required规则处理

    // IPv4 正则表达式
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

    // IPv6 正则表达式（简化版）
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/

    // 如果是IP地址格式，进行验证
    if (ipv4Regex.test(value) || ipv6Regex.test(value)) {
      return true
    }

    // 如果不是IP地址格式，返回true让hostname验证器处理
    return true
  },

  // 主机地址验证（统一处理IP和域名）
  hostAddress: (_rule: any, value: string) => {
    if (!value) return true // 空值由required规则处理

    // 使用用户提供的正则表达式：支持IPv4和域名
    const hostRegex = /^(?:(?:[0-9]{1,3}\.){3}[0-9]{1,3}|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})$/

    if (!hostRegex.test(value)) {
      return new Error('请输入有效的IP地址或域名')
    }

    return true
  },

  // 端口号验证
  port: (_rule: any, value: number) => {
    if (value < 1 || value > 65535) {
      return new Error('端口号必须在1-65535之间')
    }
    return true
  },

  // 用户名验证
  username: (_rule: any, value: string) => {
    if (!value) return true // 空值由required规则处理

    // 用户名不能包含特殊字符
    const usernameRegex = /^[a-zA-Z0-9._-]+$/

    if (!usernameRegex.test(value)) {
      return new Error('用户名只能包含字母、数字、点、下划线和连字符')
    }

    if (value.length > 32) {
      return new Error('用户名长度不能超过32个字符')
    }

    return true
  },

  // 服务器名称验证
  serverName: (_rule: any, value: string) => {
    if (!value) return true // 空值由required规则处理

    if (value.length > 50) {
      return new Error('服务器名称不能超过50个字符')
    }

    return true
  },

  // 分组名称验证
  groupName: (_rule: any, value: string) => {
    if (!value) return true // 空值由required规则处理

    if (value.length < 2) {
      return new Error('分组名称至少需要2个字符')
    }

    if (value.length > 30) {
      return new Error('分组名称不能超过30个字符')
    }

    // 不能包含特殊字符
    const nameRegex = /^[a-zA-Z0-9\u4e00-\u9fa5._-]+$/
    if (!nameRegex.test(value)) {
      return new Error('分组名称只能包含字母、数字、中文、点、下划线和连字符')
    }

    return true
  }
}

// 服务器表单验证规则
const serverFormRules = {
  name: [
    { required: true, message: '请输入服务器名称', trigger: 'blur' },
    { validator: validators.serverName, trigger: 'blur' }
  ],
  host: [
    { required: true, message: '请输入主机地址', trigger: 'blur' },
    { validator: validators.hostAddress, trigger: 'blur' }
  ],
  port: [
    { required: true, type: 'number' as const, message: '请输入端口号', trigger: 'blur' },
    { validator: validators.port, trigger: 'blur' }
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  groupId: [
    { required: true, message: '请选择分组', trigger: 'change' }
  ]
}

// 分组表单验证规则
const groupFormRules = {
  name: [
    { required: true, message: '请输入分组名称', trigger: 'blur' },
    { validator: validators.groupName, trigger: 'blur' }
  ]
}

// 代理表单验证规则
const proxyFormRules = {
  name: [
    { required: true, message: '请输入代理名称', trigger: 'blur' },
    { validator: validators.serverName, trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择代理类型', trigger: 'change' }
  ],
  host: [
    { required: true, message: '请输入代理主机地址', trigger: 'blur' },
    { validator: validators.hostAddress, trigger: 'blur' }
  ],
  port: [
    { required: true, type: 'number' as const, message: '请输入端口号', trigger: 'blur' },
    { validator: validators.port, trigger: 'blur' }
  ]
}

// 显示操作反馈
const showOperationStatus = (type: 'success' | 'error' | 'info', messageText: string) => {
  switch (type) {
    case 'success':
      message.success(messageText)
      break
    case 'error':
      message.error(messageText)
      break
    case 'info':
      message.info(messageText)
      break
  }
}

// 显示删除确认对话框
const showDeleteConfirm = (type: 'server' | 'group' | 'proxy', item: any, isSecondConfirm = false) => {
  let title = ''
  let message = ''

  if (type === 'server') {
    title = '删除服务器'
    message = `确定要删除服务器 "<strong>${item.name}</strong>" 吗？<br><br>此操作不可撤销！`
  } else if (type === 'group') {
    if (isSecondConfirm) {
      title = '最终确认删除'
      message = `⚠️ 最终确认：您即将删除分组 "<strong>${item.name}</strong>" 及其所有内容！<br><br>此操作不可撤销，请再次确认是否继续？`
    } else {
      title = '删除分组'
      message = `确定要删除分组 "<strong>${item.name}</strong>" 吗？`
    }
  } else if (type === 'proxy') {
    title = '删除代理'
    message = `确定要删除代理 "<strong>${item.name}</strong>" 吗？<br><br>此操作不可撤销！`
  }

  deleteConfirmData.value = {
    type,
    item,
    title,
    message,
    isSecondConfirm
  }
  showDeleteConfirmDialog.value = true
}

// 处理删除确认
const handleConfirmDelete = async () => {
  if (!deleteConfirmData.value) return

  const { type, item, isSecondConfirm } = deleteConfirmData.value

  try {
    if (type === 'server') {
      await performDeleteServer(item)
    } else if (type === 'group') {
      if (isSecondConfirm) {
        await performDeleteGroup(item, true)
      } else {
        // 第一次确认后，显示第二次确认
        showDeleteConfirmDialog.value = false
        setTimeout(() => {
          showDeleteConfirm('group', item, true)
        }, 100)
        return
      }
    } else if (type === 'proxy') {
      await performDeleteProxy(item)
    }

    showDeleteConfirmDialog.value = false
    deleteConfirmData.value = null
  } catch (error) {
    console.error('Delete failed:', error)
    showOperationStatus('error', `删除失败: ${error}`)
  }
}

// 树形结构事件处理
const handleTreeSelect = (_keys: Array<string | number>, option: any) => {
  if (option.length > 0) {
    const node = option[0]
    if (node.type === 'server') {
      selectServer(node.data)
    }
  }
}

// 节点属性配置，用于处理双击事件
const nodeProps = ({ option }: { option: any }) => {
  return {
    onDblclick: () => {
      console.log('Node double click triggered:', option)
      if (option.type === 'server') {
        console.log('Server double clicked:', option.data)
        handleServerDoubleClick(option.data)
      }
    }
  }
}

const handleTreeContextMenu = (option: any) => {
  if (option.type === 'server') {
    // 服务器右键菜单
    console.log('Server context menu:', option.data)
  } else if (option.type === 'group') {
    // 分组右键菜单
    console.log('Group context menu:', option.data)
  }
}

// 树形结构数据
const treeData = computed(() => {
  const convertGroupToTreeNode = (group: ServerGroup): any => {
    const children: any[] = []

    // 添加服务器节点
    group.servers.forEach(server => {
      children.push({
        key: `server-${server.id}`,
        label: server.name,
        type: 'server',
        data: server,
        prefix: () => h(Icon, {}, { default: () => h(ComputerFilled) }),
        suffix: () => h('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }
        }, [
          // 代理信息显示
          (() => {
            const proxy = findProxyForServer(server)
            if (proxy) {
              return h('span', {
                style: {
                  color: '#f59e0b',
                  fontSize: '10px',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                },
                title: `使用代理: ${proxy.name} (${proxy.type.toUpperCase()})`
              }, h(Icon, {}, { default: () => h(LinkFilled) }))
            }
            return null
          })(),
          h('span', {
            style: {
              color: getStatusColor(server.status),
              fontSize: '12px'
            }
          }, getStatusText(server.status)),
          h('div', {
            style: {
              display: 'flex',
              gap: '4px'
            }
          }, [
            h('button', {
              class: 'tree-action-btn connect-btn',
              onClick: (e: Event) => {
                e.stopPropagation()
                handleServerDoubleClick(server)
              },
              title: '连接服务器'
            }, h(Icon, {}, { default: () => h(LinkFilled) })),
            h('button', {
              class: 'tree-action-btn edit-btn',
              onClick: (e: Event) => {
                e.stopPropagation()
                handleEditServer(server)
              },
              title: '编辑服务器'
            }, h(Icon, {}, { default: () => h(EditFilled) })),
            h('button', {
              class: 'tree-action-btn delete-btn',
              onClick: (e: Event) => {
                e.stopPropagation()
                handleDeleteServer(server)
              },
              title: '删除服务器'
            }, h(Icon, {}, { default: () => h(DeleteFilled) }))
          ])
        ])
      })
    })

    // 添加子分组节点
    group.children.forEach(subgroup => {
      children.push(convertGroupToTreeNode(subgroup))
    })

    return {
      key: `group-${group.id}`,
      label: group.name,
      type: 'group',
      data: group,
      prefix: () => h(Icon, {}, { default: () => h(FolderFilled) }),
      suffix: () => h('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }
      }, [
        // 代理信息显示
        (() => {
          if (group.proxyId) {
            const proxy = proxyConfigs.value.find(p => p.id === group.proxyId)
            if (proxy) {
              return h('span', {
                style: {
                  color: '#f59e0b',
                  fontSize: '10px',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                },
                title: `组代理: ${proxy.name} (${proxy.type.toUpperCase()})`
              }, h(Icon, {}, { default: () => h(LinkFilled) }))
            }
          }
          return null
        })(),
        h('div', {
          style: {
            display: 'flex',
            gap: '4px'
          }
        }, [
        h('button', {
          class: 'tree-action-btn edit-btn',
          onClick: (e: Event) => {
            e.stopPropagation()
            handleEditGroup(group)
          },
          title: '编辑分组'
        }, h(Icon, {}, { default: () => h(EditFilled) })),
        h('button', {
          class: 'tree-action-btn add-btn',
          onClick: (e: Event) => {
            e.stopPropagation()
            handleAddServer(group.id)
          },
          title: '添加服务器'
        }, h(Icon, {}, { default: () => h(AddFilled) })),
        h('button', {
          class: 'tree-action-btn add-subgroup-btn',
          onClick: (e: Event) => {
            e.stopPropagation()
            handleAddSubGroup(group.id)
          },
          title: '添加子组'
        }, h(Icon, {}, { default: () => h(FolderFilled) })),
        h('button', {
          class: 'tree-action-btn delete-btn',
          onClick: (e: Event) => {
            e.stopPropagation()
            handleDeleteGroup(group)
          },
          title: '删除分组'
        }, h(Icon, {}, { default: () => h(DeleteFilled) }))
        ])
      ]),
      children: children.length > 0 ? children : undefined
    }
  }

  return serverGroups.value.map(convertGroupToTreeNode)
})

// 计算属性
// 分组选项
const groupOptions = computed(() => {
  const convertGroupsToOptions = (groups: ServerGroup[], level = 0): any[] => {
    return groups.flatMap(group => [
      {
        label: '  '.repeat(level) + group.name,
        value: group.id
      },
      ...convertGroupsToOptions(group.children, level + 1)
    ])
  }
  return convertGroupsToOptions(serverGroups.value)
})

// 父分组选项（排除当前编辑的分组）
const parentGroupOptions = computed(() => {
  const convertGroupsToOptions = (groups: ServerGroup[], level = 0, excludeId?: string): any[] => {
    return groups.flatMap(group => {
      if (group.id === excludeId) return []
      return [
        {
          label: '  '.repeat(level) + group.name,
          value: group.id
        },
        ...convertGroupsToOptions(group.children, level + 1, excludeId)
      ]
    })
  }
  return convertGroupsToOptions(serverGroups.value, 0, editingGroup.value?.id)
})

// 代理类型选项
const proxyTypeOptions = [
  { label: 'SOCKS5', value: 'socks5' },
  { label: 'HTTP', value: 'http' }
]

// 代理选项
const proxyOptions = computed(() => {
  return proxyConfigs.value.map(proxy => ({
    label: `${proxy.name} (${proxy.type.toUpperCase()})`,
    value: proxy.id
  }))
})

// 递归查找代理配置
const findProxyForServer = (server: ServerConfig): ProxyConfig | null => {
  // 1. 首先检查服务器自身是否有代理配置
  if (server.proxyId) {
    const proxy = proxyConfigs.value.find(p => p.id === server.proxyId)
    if (proxy) return proxy
  }

  // 2. 递归查找父组是否有代理配置
  const findProxyInGroups = (groups: ServerGroup[], targetGroupId: string): ProxyConfig | null => {
    for (const group of groups) {
      if (group.id === targetGroupId) {
        // 检查当前组是否有代理配置
        if (group.proxyId) {
          const proxy = proxyConfigs.value.find(p => p.id === group.proxyId)
          if (proxy) return proxy
        }

        // 如果有父组，递归查找父组
        if (group.parentId) {
          return findProxyInGroups(serverGroups.value, group.parentId)
        }

        return null
      }

      // 递归查找子组
      const result = findProxyInGroups(group.children, targetGroupId)
      if (result) return result
    }
    return null
  }

  return findProxyInGroups(serverGroups.value, server.groupId)
}

const filteredServerGroups = computed(() => {
  if (!searchQuery.value) {
    return serverGroups.value
  }

  const query = searchQuery.value.toLowerCase()
  return serverGroups.value.map(group => ({
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
const loadServerGroups = async () => {
  try {
    serverGroups.value = await window.api.serverManager.getAllGroups()
  } catch (error) {
    console.error('Failed to load server groups:', error)
  }
}

const loadProxies = async () => {
  try {
    proxies.value = await window.api.proxyManager.getAllProxies()
  } catch (error) {
    console.error('Failed to load proxies:', error)
  }
}

const toggleGroup = (groupId: string) => {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId)
  } else {
    expandedGroups.value.add(groupId)
  }
}

const selectServer = (server: ServerConfig) => {
  emit('selectServer', server)
}

// 双击服务器处理
const handleServerDoubleClick = (server: ServerConfig) => {
  emit('serverDoubleClick', server)
}

// 服务器相关方法
const handleAddServer = (groupId: string) => {
  addingServerToGroup.value = groupId
  editingServer.value = null
  resetServerForm()
  serverForm.value.groupId = groupId
  showAddServerDialog.value = true
}

const handleEditServer = (server: ServerConfig) => {
  editingServer.value = server
  addingServerToGroup.value = null
  serverForm.value = {
    name: server.name,
    host: server.host,
    port: server.port,
    username: server.username,
    password: server.password || '',
    privateKey: server.privateKey || '',
    groupId: server.groupId,
    proxyId: server.proxyId || '',
    description: server.description || ''
  }
  showAddServerDialog.value = true
}

// 重置服务器表单
const resetServerForm = () => {
  serverForm.value = {
    name: '',
    host: '',
    port: 22,
    username: '',
    password: '',
    privateKey: '',
    groupId: '',
    proxyId: '',
    description: ''
  }
}

const handleDeleteServer = (server: ServerConfig) => {
  showDeleteConfirm('server', server)
}

// 执行删除服务器
const performDeleteServer = async (server: ServerConfig) => {
  try {
    console.log('开始删除服务器:', server.name)
    const success = await window.api.serverManager.removeServer(server.id)
    if (success) {
      console.log('服务器删除成功:', server.name)
      showOperationStatus('success', `服务器 "${server.name}" 删除成功`)
      await loadServerGroups()
    } else {
      console.error('服务器删除失败:', server.name)
      showOperationStatus('error', `服务器 "${server.name}" 删除失败`)
    }
  } catch (error) {
    console.error('Failed to delete server:', error)
    showOperationStatus('error', `删除服务器 "${server.name}" 时发生错误: ${error}`)
  }
}

const handleSaveServer = async () => {
  try {
    serverSaving.value = true

    // 验证表单
    await serverFormRef.value?.validate()

    const serverData = { ...serverForm.value }

    if (editingServer.value) {
      await window.api.serverManager.updateServer(editingServer.value.id, serverData)
      showOperationStatus('success', `服务器 "${serverData.name}" 更新成功`)
    } else {
      await window.api.serverManager.addServer(serverData)
      showOperationStatus('success', `服务器 "${serverData.name}" 添加成功`)
    }

    await loadServerGroups()
    showAddServerDialog.value = false
    editingServer.value = null
    addingServerToGroup.value = null
    resetServerForm()
  } catch (error) {
    console.error('Failed to save server:', error)
    if ((error as any).name !== 'ValidationError') {
      showOperationStatus('error', '保存服务器失败')
    }
    // 验证失败时不关闭弹窗
  } finally {
    serverSaving.value = false
  }
}

// 取消服务器编辑
const handleCancelServer = () => {
  showAddServerDialog.value = false
  editingServer.value = null
  addingServerToGroup.value = null
  resetServerForm()
  // 清除验证错误
  serverFormRef.value?.restoreValidation()
}

// 分组相关方法
// const handleAddGroup = () => {
//   editingGroup.value = null
//   resetGroupForm()
//   showAddGroupDialog.value = true
// }

// 添加根分组
const handleAddRootGroup = () => {
  editingGroup.value = null
  resetGroupForm()
  groupForm.value.parentId = '' // 根分组没有父级
  showAddGroupDialog.value = true
}

// 添加子组
const handleAddSubGroup = (parentGroupId: string) => {
  editingGroup.value = null
  resetGroupForm()
  groupForm.value.parentId = parentGroupId
  showAddGroupDialog.value = true
}

const handleEditGroup = (group: ServerGroup) => {
  editingGroup.value = group
  groupForm.value = {
    name: group.name,
    parentId: group.parentId || '',
    proxyId: group.proxyId || '',
    description: group.description || ''
  }
  showAddGroupDialog.value = true
}

// 重置分组表单
const resetGroupForm = () => {
  groupForm.value = {
    name: '',
    parentId: '',
    proxyId: '',
    description: ''
  }
}

const handleDeleteGroup = (group: ServerGroup) => {
  showDeleteConfirm('group', group)
}

// 执行删除分组
const performDeleteGroup = async (group: ServerGroup, forceDelete = false) => {
  try {
    console.log('开始删除分组:', group.name)
    const success = await window.api.serverManager.removeGroup(group.id, forceDelete)
    if (success) {
      console.log('分组删除成功:', group.name)
      showOperationStatus('success', `分组 "${group.name}" 及其所有内容删除成功`)
      await loadServerGroups()
    } else {
      console.error('分组删除失败:', group.name)
      showOperationStatus('error', `分组 "${group.name}" 删除失败`)
    }
  } catch (error) {
    console.error('Failed to delete group:', error)
    showOperationStatus('error', `删除分组 "${group.name}" 时发生错误: ${error}`)
  }
}

const handleSaveGroup = async () => {
  try {
    groupSaving.value = true

    // 验证表单
    await groupFormRef.value?.validate()

    const groupData = { ...groupForm.value }

    if (editingGroup.value) {
      await window.api.serverManager.updateGroup(editingGroup.value.id, groupData)
      showOperationStatus('success', `分组 "${groupData.name}" 更新成功`)
    } else {
      await window.api.serverManager.addGroup(groupData)
      showOperationStatus('success', `分组 "${groupData.name}" 添加成功`)
    }

    await loadServerGroups()
    showAddGroupDialog.value = false
    editingGroup.value = null
    resetGroupForm()
  } catch (error) {
    console.error('Failed to save group:', error)
    if ((error as any).name !== 'ValidationError') {
      showOperationStatus('error', '保存分组失败')
    }
    // 验证失败时不关闭弹窗
  } finally {
    groupSaving.value = false
  }
}

// 取消分组编辑
const handleCancelGroup = () => {
  showAddGroupDialog.value = false
  editingGroup.value = null
  resetGroupForm()
  // 清除验证错误
  groupFormRef.value?.restoreValidation()
}

// 代理相关方法
const editProxy = (proxy: ProxyConfig) => {
  editingProxy.value = proxy
  proxyForm.value = {
    name: proxy.name,
    type: proxy.type,
    host: proxy.host,
    port: proxy.port,
    username: proxy.username || '',
    password: proxy.password || '',
    description: proxy.description || ''
  }
  showAddProxyDialog.value = true
}

// const addProxy = () => {
//   editingProxy.value = null
//   resetProxyForm()
//   showAddProxyDialog.value = true
// }

// 重置代理表单
const resetProxyForm = () => {
  proxyForm.value = {
    name: '',
    type: 'socks5',
    host: '',
    port: 1080,
    username: '',
    password: '',
    description: ''
  }
}

const deleteProxy = (proxy: ProxyConfig) => {
  showDeleteConfirm('proxy', proxy)
}

// 执行删除代理
const performDeleteProxy = async (proxy: ProxyConfig) => {
  try {
    await window.api.proxyManager.deleteProxy(proxy.id)
    showOperationStatus('success', `代理 "${proxy.name}" 删除成功`)
    await loadProxies()
  } catch (error) {
    console.error('Failed to delete proxy:', error)
    showOperationStatus('error', `删除代理 "${proxy.name}" 时发生错误: ${error}`)
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
    // 只传递必要的字段，避免克隆错误
    const proxyData = {
      id: proxy.id,
      name: proxy.name,
      type: proxy.type,
      host: proxy.host,
      port: proxy.port,
      username: proxy.username,
      password: proxy.password,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    const result = await window.api.proxyManager.testProxy(proxyData)
    if (result) {
      showOperationStatus('success', `代理 "${proxy.name}" 连接测试成功！`)
    } else {
      showOperationStatus('error', `代理 "${proxy.name}" 连接测试失败！`)
    }
  } catch (error) {
    console.error('Failed to test proxy:', error)
    showOperationStatus('error', `代理测试失败: ${error}`)
  }
}

const handleSaveProxy = async () => {
  try {
    proxySaving.value = true

    // 验证表单
    await proxyFormRef.value?.validate()

    const proxyData = { 
      ...proxyForm.value,
      type: proxyForm.value.type as 'socks5' | 'socks4' | 'http'
    }

    if (editingProxy.value) {
      await window.api.proxyManager.updateProxy(editingProxy.value.id, proxyData)
      showOperationStatus('success', `代理 "${proxyData.name}" 更新成功`)
    } else {
      await window.api.proxyManager.createProxy(proxyData)
      showOperationStatus('success', `代理 "${proxyData.name}" 添加成功`)
    }

    await loadProxies()
    showAddProxyDialog.value = false
    editingProxy.value = null
    resetProxyForm()
  } catch (error) {
    console.error('Failed to save proxy:', error)
    if ((error as any).name !== 'ValidationError') {
      showOperationStatus('error', '保存代理失败')
    }
    // 验证失败时不关闭弹窗
  } finally {
    proxySaving.value = false
  }
}

// 取消代理编辑
const handleCancelProxy = () => {
  showAddProxyDialog.value = false
  editingProxy.value = null
  resetProxyForm()
  // 清除验证错误
  proxyFormRef.value?.restoreValidation()
}

// 状态相关方法
const getStatusColor = (status: string) => {
  switch (status) {
    case 'running': return '#52c41a'
    case 'stopped': return '#d9d9d9'
    case 'maintenance': return '#fa8c16'
    case 'error': return '#ff4d4f'
    default: return '#d9d9d9'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'running': return '运行中'
    case 'stopped': return '已停止'
    case 'maintenance': return '维护中'
    case 'error': return '错误'
    default: return '未知'
  }
}

// 生命周期
onMounted(() => {
  loadServerGroups()
  loadProxies()
})
</script>

<style scoped>
.asset-manager {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: transparent;
}


.asset-header {
  padding: 15px;
  border-bottom: 1px solid var(--n-border-color);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.asset-header h2 {
  margin: 0;
  color: var(--n-text-color);
  font-size: 18px;
}

.theme-toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  color: var(--n-text-color);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle-btn:hover {
  background: var(--n-color-hover);
  transform: scale(1.05);
}

.theme-toggle-btn .n-icon {
  font-size: 18px;
}

.theme-tooltip {
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.4;
  max-width: 200px;
  word-wrap: break-word;
}

/* 操作反馈样式 */

.asset-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--n-border-color);
  border-radius: 4px;
  font-size: 14px;
  background-color: var(--n-color);
  color: var(--n-text-color);
}

.asset-tabs {
  display: flex;
  border-bottom: 1px solid var(--n-border-color);
}

.tab-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--n-text-color-2);
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.tab-btn:hover {
  color: var(--n-text-color);
  background-color: var(--n-color-hover);
}

.tab-btn.active {
  color: var(--n-color-primary);
  border-bottom-color: var(--n-color-primary);
  background-color: var(--n-color-primary-hover);
}

.asset-content {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background: transparent;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h3 {
  margin: 0;
  color: var(--n-text-color);
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.add-btn {
  padding: 6px 12px;
  background: var(--n-color-primary);
  color: var(--n-color-primary-text) !important;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.add-btn:hover {
  background: var(--n-color-primary-hover);
}

.add-btn .n-icon {
  font-size: 14px;
  display: flex;
  align-items: center;
}

.tab-btn .n-icon {
  font-size: 16px;
  display: flex;
  align-items: center;
}

/* 通用滚动条样式 */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
  border-color: rgba(0, 0, 0, 0.2);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
}

.custom-scrollbar::-webkit-scrollbar-thumb:active {
  background: rgba(0, 0, 0, 0.7);
  border-color: rgba(0, 0, 0, 0.3);
}

.custom-scrollbar::-webkit-scrollbar-corner {
  background: rgba(0, 0, 0, 0.1);
}

.custom-scrollbar::-webkit-scrollbar-button {
  display: none;
}

/* 深色主题下的滚动条样式 */
.dark-theme .custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dark-theme .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dark-theme .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
}

.dark-theme .custom-scrollbar::-webkit-scrollbar-thumb:active {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(255, 255, 255, 0.3);
}

.dark-theme .custom-scrollbar::-webkit-scrollbar-corner {
  background: rgba(255, 255, 255, 0.1);
}

/* 服务器相关样式 */
.server-tree {
  overflow-y: auto;
}

.server-tree-component {
  --n-node-text-color: #d4d4d4;
  --n-node-color-hover: #404040;
  --n-node-color-pressed: #555;
  --n-node-color-active: #404040;
  --n-node-text-color-active: #ffffff;
}

.server-tree-component :deep(.n-tree-node-content) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.server-tree-component :deep(.n-tree-node-content .n-tree-node-content__text) {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.server-tree-component :deep(.n-tree-node-content .n-tree-node-content__prefix .n-icon) {
  font-size: 18px;
  color: var(--n-text-color) !important;
}

.server-tree-component :deep(.n-tree-node-content .n-tree-node-content__suffix) {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.server-tree-component :deep(.n-tree-node-content:hover .n-tree-node-content__suffix) {
  opacity: 1;
}

.server-tree-component :deep(.n-tree-node-content button) {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 12px;
  transition: all 0.2s ease;
  opacity: 0.8;
  transform: scale(0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--n-text-color) !important;
}

.server-tree-component :deep(.n-tree-node-content button .n-icon) {
  font-size: 16px;
}

.server-tree-component :deep(.n-tree-node-content:hover button) {
  opacity: 1;
  transform: scale(1);
}

.server-tree-component :deep(.n-tree-node-content button:hover) {
  background-color: var(--n-color-hover);
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.server-tree-component :deep(.n-tree-node-content button:active) {
  transform: scale(0.95);
}

/* 连接按钮特殊样式 */
.server-tree-component :deep(.n-tree-node-content .connect-btn:hover) {
  background-color: rgba(34, 197, 94, 0.3);
  color: #22c55e !important;
}

/* 编辑按钮特殊样式 */
.server-tree-component :deep(.n-tree-node-content .edit-btn:hover) {
  background-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6 !important;
}

/* 删除按钮特殊样式 */
.server-tree-component :deep(.n-tree-node-content .delete-btn:hover) {
  background-color: rgba(239, 68, 68, 0.3);
  color: #ef4444 !important;
}

/* 添加按钮特殊样式 */
.server-tree-component :deep(.n-tree-node-content .add-btn:hover) {
  background-color: rgba(168, 85, 247, 0.3);
  color: #a855f7 !important;
}

/* 添加子组按钮特殊样式 */
.server-tree-component :deep(.n-tree-node-content .add-subgroup-btn:hover) {
  background-color: rgba(245, 158, 11, 0.3);
  color: #f59e0b !important;
}

.server-groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-item {
  background: var(--n-color-modal);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--n-border-color);
}

.group-header {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background: var(--n-color-hover);
  cursor: pointer;
  transition: background-color 0.2s;
}

.group-header:hover {
  background: var(--n-color-pressed);
}

.group-icon {
  margin-right: 8px;
  transition: transform 0.2s;
  color: var(--n-text-color) !important;
}

.group-icon .n-icon {
  font-size: 16px;
}

.group-icon.expanded {
  transform: rotate(90deg);
}

.group-name {
  flex: 1;
  font-weight: 600;
  color: var(--n-text-color);
}

.group-actions {
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s;
}

.group-header:hover .group-actions {
  opacity: 1;
}

.subgroups {
  padding-left: 20px;
}

.subgroup-item {
  border-left: 2px solid #e0e0e0;
  margin-left: 10px;
}

.subgroup-header {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background: var(--n-color-hover);
  cursor: pointer;
  transition: background-color 0.2s;
}

.subgroup-header:hover {
  background: var(--n-color-pressed);
}

.subgroup-icon {
  margin-right: 8px;
  transition: transform 0.2s;
  color: var(--n-text-color) !important;
  font-size: 12px;
}

.subgroup-icon .n-icon {
  font-size: 14px;
}

.subgroup-icon.expanded {
  transform: rotate(90deg);
}

.subgroup-name {
  flex: 1;
  font-weight: 500;
  color: var(--n-text-color);
  font-size: 14px;
}

.subgroup-actions {
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s;
}

.subgroup-header:hover .subgroup-actions {
  opacity: 1;
}

.servers-list {
  padding: 10px 0;
}

.server-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.server-item:hover {
  background: var(--n-color-hover);
}

.server-info {
  flex: 1;
}

.server-name {
  font-weight: 500;
  color: var(--n-text-color);
  margin-bottom: 2px;
}

.server-ip {
  font-size: 12px;
  color: var(--n-text-color-2);
}

.server-status {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0 10px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-text {
  font-size: 12px;
  color: var(--n-text-color-2);
}

.server-actions {
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s;
}

.server-item:hover .server-actions {
  opacity: 1;
}

/* 代理相关样式 */
.proxy-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.proxy-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: var(--n-color-modal);
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--n-border-color);
  transition: all 0.2s;
}

.proxy-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.proxy-item.disabled {
  opacity: 0.6;
  background: var(--n-color-disabled);
  border-color: var(--n-border-color-disabled);
}

.proxy-info {
  flex: 1;
}

.proxy-name {
  font-weight: 600;
  color: var(--n-text-color);
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
  color: var(--n-text-color-2);
  font-size: 14px;
  margin-bottom: 5px;
}

.auth-info {
  color: var(--n-color-warning);
  font-size: 12px;
}

.proxy-description {
  color: var(--n-text-color-3);
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
  color: var(--n-text-color-3);
}

.add-first-btn {
  padding: 10px 20px;
  background: var(--n-color-primary);
  color: var(--n-color-primary-text);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.add-first-btn:hover {
  background: var(--n-color-primary-hover);
}

.action-btn {
  padding: 4px 6px;
  border: none;
  background: var(--n-color-hover);
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  color: var(--n-text-color) !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: var(--n-color-pressed);
  transform: scale(1.05);
}

.action-btn .n-icon {
  font-size: 14px;
}
</style>
