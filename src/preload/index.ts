import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // 服务器管理API
  serverManager: {
    getAllGroups: () => ipcRenderer.invoke('get-all-groups'),
    getRootGroups: () => ipcRenderer.invoke('get-root-groups'),
    getServersByGroup: (groupId: string) => ipcRenderer.invoke('get-servers-by-group', groupId),
    getServer: (serverId: string) => ipcRenderer.invoke('get-server', serverId),
    connectToServer: (serverId: string, connectionId?: string) => ipcRenderer.invoke('connect-to-server', serverId, connectionId),
    disconnectFromServer: (serverId: string, connectionId?: string) => ipcRenderer.invoke('disconnect-from-server', serverId, connectionId),
    executeCommand: (connectionId: string, command: string) => ipcRenderer.invoke('execute-command', connectionId, command),
    getServerMetrics: (connectionId: string) => ipcRenderer.invoke('get-server-metrics', connectionId),
    getCachedMetrics: (serverId: string) => ipcRenderer.invoke('get-cached-metrics', serverId),
    isConnected: (serverId: string) => ipcRenderer.invoke('is-connected', serverId),
    getConnectionStatus: (serverId: string) => ipcRenderer.invoke('get-connection-status', serverId),
    addServer: (server: any) => ipcRenderer.invoke('add-server', server),
    removeServer: (serverId: string) => ipcRenderer.invoke('remove-server', serverId),
    updateServer: (serverId: string, updates: any) => ipcRenderer.invoke('update-server', serverId, updates),
    addGroup: (group: any) => ipcRenderer.invoke('add-group', group),
    updateGroup: (groupId: string, updates: any) => ipcRenderer.invoke('update-group', groupId, updates),
    removeGroup: (groupId: string, forceDelete?: boolean) => ipcRenderer.invoke('remove-group', groupId, forceDelete),
    searchServers: (query: string) => ipcRenderer.invoke('search-servers', query),
    searchGroups: (query: string) => ipcRenderer.invoke('search-groups', query)
  },

  // SSH管理器API
  sshManager: {
    sendData: (connectionId: string, data: string) => ipcRenderer.invoke('ssh-send-data', connectionId, data),
    resizeTerminal: (connectionId: string, cols: number, rows: number) => ipcRenderer.invoke('ssh-resize-terminal', connectionId, cols, rows),
    onData: (connectionId: string, callback: (data: string) => void) => {
      const channel = `ssh-data-${connectionId}`
      ipcRenderer.on(channel, (_, data) => callback(data))
    },
    onConnectionStatusChanged: (connectionId: string, callback: (status: any) => void) => {
      const channel = `ssh-status-${connectionId}`
      ipcRenderer.on(channel, (_, status) => callback(status))
    },
    removeListeners: (connectionId: string) => {
      ipcRenderer.removeAllListeners(`ssh-data-${connectionId}`)
      ipcRenderer.removeAllListeners(`ssh-status-${connectionId}`)
    }
  },

  // 代理管理API
  proxyManager: {
    getAllProxies: () => ipcRenderer.invoke('get-all-proxies'),
    getProxyById: (id: string) => ipcRenderer.invoke('get-proxy-by-id', id),
    createProxy: (proxy: any) => ipcRenderer.invoke('create-proxy', proxy),
    updateProxy: (id: string, proxy: any) => ipcRenderer.invoke('update-proxy', id, proxy),
    deleteProxy: (id: string) => ipcRenderer.invoke('delete-proxy', id),
    toggleProxy: (id: string) => ipcRenderer.invoke('toggle-proxy', id),
    searchProxies: (query: string) => ipcRenderer.invoke('search-proxies', query),
    getEnabledProxies: () => ipcRenderer.invoke('get-enabled-proxies'),
    getProxiesByType: (type: string) => ipcRenderer.invoke('get-proxies-by-type', type),
    testProxy: (proxy: any) => ipcRenderer.invoke('test-proxy', proxy)
  },

  // 更新管理API
  updateManager: {
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    checkForUpdatesWithDialog: () => ipcRenderer.invoke('check-for-updates-with-dialog'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    installUpdate: () => ipcRenderer.invoke('install-update'),
    getCurrentVersion: () => ipcRenderer.invoke('get-current-version'),
    getUpdateInfo: () => ipcRenderer.invoke('get-update-info'),
    isCheckingForUpdate: () => ipcRenderer.invoke('is-checking-for-update'),
    isDownloadingUpdate: () => ipcRenderer.invoke('is-downloading-update'),
    
    // 更新事件监听
    onUpdateChecking: (callback: () => void) => {
      ipcRenderer.on('update-checking', callback)
    },
    onUpdateAvailable: (callback: (updateInfo: any) => void) => {
      ipcRenderer.on('update-available', (_, updateInfo) => callback(updateInfo))
    },
    onUpdateNotAvailable: (callback: (info: any) => void) => {
      ipcRenderer.on('update-not-available', (_, info) => callback(info))
    },
    onUpdateDownloadProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('update-download-progress', (_, progress) => callback(progress))
    },
    onUpdateDownloaded: (callback: (info: any) => void) => {
      ipcRenderer.on('update-downloaded', (_, info) => callback(info))
    },
    onUpdateError: (callback: (error: any) => void) => {
      ipcRenderer.on('update-error', (_, error) => callback(error))
    },
    
    // 移除更新事件监听
    removeUpdateListeners: () => {
      ipcRenderer.removeAllListeners('update-checking')
      ipcRenderer.removeAllListeners('update-available')
      ipcRenderer.removeAllListeners('update-not-available')
      ipcRenderer.removeAllListeners('update-download-progress')
      ipcRenderer.removeAllListeners('update-downloaded')
      ipcRenderer.removeAllListeners('update-error')
    }
  },

  // 事件监听
  onServerStatusChanged: (callback: (server: any) => void) => {
    ipcRenderer.on('server-status-changed', (_, server) => callback(server))
  },
  onMetricsUpdated: (callback: (serverId: string, metrics: any) => void) => {
    ipcRenderer.on('metrics-updated', (_, serverId, metrics) => callback(serverId, metrics))
  },
  onServerAdded: (callback: (server: any) => void) => {
    ipcRenderer.on('server-added', (_, server) => callback(server))
  },
  onServerRemoved: (callback: (serverId: string) => void) => {
    ipcRenderer.on('server-removed', (_, serverId) => callback(serverId))
  },

  // 窗口管理API
  windowManager: {
    toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
    isAlwaysOnTop: () => ipcRenderer.invoke('is-always-on-top')
  },

  // 移除事件监听
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
