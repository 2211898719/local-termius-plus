import { ElectronAPI } from '@electron-toolkit/preload'
import { ServerConfig, ServerGroup, ServerMetrics, ProxyConfig } from '../main/types/server'

interface ServerManagerAPI {
  getAllGroups: () => Promise<ServerGroup[]>
  getRootGroups: () => Promise<ServerGroup[]>
  getServersByGroup: (groupId: string) => Promise<ServerConfig[]>
  getServer: (serverId: string) => Promise<ServerConfig | null>
  connectToServer: (serverId: string, connectionId?: string) => Promise<boolean>
  disconnectFromServer: (serverId: string) => Promise<void>
  executeCommand: (serverId: string, command: string) => Promise<any>
  getServerMetrics: (serverId: string) => Promise<ServerMetrics | null>
  getCachedMetrics: (serverId: string) => Promise<ServerMetrics | null>
  isConnected: (serverId: string) => Promise<boolean>
  getConnectionStatus: (serverId: string) => Promise<any>
  addServer: (server: Partial<ServerConfig>) => Promise<ServerConfig | null>
  removeServer: (serverId: string) => Promise<boolean>
  updateServer: (serverId: string, updates: Partial<ServerConfig>) => Promise<ServerConfig | null>
  addGroup: (group: Partial<ServerGroup>) => Promise<ServerGroup | null>
  updateGroup: (groupId: string, updates: Partial<ServerGroup>) => Promise<ServerGroup | null>
  removeGroup: (groupId: string, forceDelete?: boolean) => Promise<boolean>
  searchServers: (query: string) => Promise<ServerConfig[]>
  searchGroups: (query: string) => Promise<ServerGroup[]>
}

interface SSHManagerAPI {
  sendData: (serverId: string, data: string) => Promise<void>
  resizeTerminal: (serverId: string, cols: number, rows: number) => Promise<void>
  onData: (serverId: string, callback: (data: string) => void) => void
  onConnectionStatusChanged: (serverId: string, callback: (status: any) => void) => void
  removeListeners: (serverId: string) => void
}

interface ProxyManagerAPI {
  getAllProxies: () => Promise<ProxyConfig[]>
  getProxyById: (id: string) => Promise<ProxyConfig | null>
  createProxy: (proxy: Partial<ProxyConfig>) => Promise<ProxyConfig>
  updateProxy: (id: string, proxy: Partial<ProxyConfig>) => Promise<ProxyConfig | null>
  deleteProxy: (id: string) => Promise<boolean>
  toggleProxy: (id: string) => Promise<ProxyConfig | null>
  searchProxies: (query: string) => Promise<ProxyConfig[]>
  getEnabledProxies: () => Promise<ProxyConfig[]>
  getProxiesByType: (type: string) => Promise<ProxyConfig[]>
  testProxy: (proxy: ProxyConfig) => Promise<boolean>
}

interface UpdateInfo {
  version: string
  releaseNotes?: string
  releaseDate?: string
  downloadUrl?: string
}

interface UpdateProgress {
  percent: number
  transferred: number
  total: number
  bytesPerSecond: number
}

interface UpdateManagerAPI {
  checkForUpdates: () => Promise<void>
  checkForUpdatesWithDialog: () => Promise<void>
  downloadUpdate: () => Promise<void>
  installUpdate: () => Promise<void>
  getCurrentVersion: () => Promise<string>
  getUpdateInfo: () => Promise<UpdateInfo | null>
  isCheckingForUpdate: () => Promise<boolean>
  isDownloadingUpdate: () => Promise<boolean>
  onUpdateChecking: (callback: () => void) => void
  onUpdateAvailable: (callback: (updateInfo: UpdateInfo) => void) => void
  onUpdateNotAvailable: (callback: (info: any) => void) => void
  onUpdateDownloadProgress: (callback: (progress: UpdateProgress) => void) => void
  onUpdateDownloaded: (callback: (info: any) => void) => void
  onUpdateError: (callback: (error: any) => void) => void
  removeUpdateListeners: () => void
}

interface CustomAPI {
  serverManager: ServerManagerAPI
  sshManager: SSHManagerAPI
  proxyManager: ProxyManagerAPI
  updateManager: UpdateManagerAPI
  onServerStatusChanged: (callback: (server: ServerConfig) => void) => void
  onMetricsUpdated: (callback: (serverId: string, metrics: ServerMetrics) => void) => void
  onServerAdded: (callback: (server: ServerConfig) => void) => void
  onServerRemoved: (callback: (serverId: string) => void) => void
  removeAllListeners: (channel: string) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}
