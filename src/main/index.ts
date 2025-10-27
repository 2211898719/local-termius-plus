import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { ServerManager } from './services/ServerManager'
import { ProxyService } from './services/ProxyService'
import { DatabaseManager } from './database/DatabaseManager'
import { ServerConfig, ServerGroup, ProxyConfig } from './types/server'

// 全局服务器管理器实例
let serverManager: ServerManager
let proxyService: ProxyService

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 初始化数据库和服务器管理器
  initializeApp()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 初始化应用
async function initializeApp(): Promise<void> {
  try {
    // 初始化数据库
    const databaseManager = DatabaseManager.getInstance()
    await databaseManager.initialize()
    
    // 初始化服务器管理器
    serverManager = new ServerManager()
    
    // 初始化代理服务
    proxyService = new ProxyService()
    
    // 设置IPC处理器
    setupIpcHandlers()
    
    // 创建窗口
    createWindow()
  } catch (error) {
    console.error('Failed to initialize app:', error)
    app.quit()
  }
}

// 设置IPC处理器
function setupIpcHandlers(): void {
  // 基础测试
  ipcMain.on('ping', () => console.log('pong'))

  // 服务器管理相关IPC
  ipcMain.handle('get-all-groups', async () => {
    return await serverManager.getAllGroups()
  })

  ipcMain.handle('get-root-groups', async () => {
    return await serverManager.getRootGroups()
  })

  ipcMain.handle('get-servers-by-group', async (_, groupId: string) => {
    return await serverManager.getServersByGroup(groupId)
  })

  ipcMain.handle('get-server', async (_, serverId: string) => {
    return await serverManager.getServer(serverId)
  })

  ipcMain.handle('connect-to-server', async (_, serverId: string, connectionId?: string) => {
    return await serverManager.connectToServer(serverId, connectionId)
  })

  ipcMain.handle('disconnect-from-server', async (_, serverId: string, connectionId?: string) => {
    await serverManager.disconnectFromServer(serverId, connectionId)
  })

  ipcMain.handle('execute-command', async (_, connectionId: string, command: string) => {
    return await serverManager.executeCommand(connectionId, command)
  })

  ipcMain.handle('get-server-metrics', async (_, connectionId: string) => {
    return await serverManager.getServerMetrics(connectionId)
  })

  ipcMain.handle('get-cached-metrics', (_, serverId: string) => {
    return serverManager.getCachedMetrics(serverId)
  })

  ipcMain.handle('is-connected', async (_, serverId: string) => {
    return await serverManager.isConnected(serverId)
  })

  ipcMain.handle('get-connection-status', (_, serverId: string) => {
    return serverManager.getConnectionStatus(serverId)
  })

  // 服务器配置管理
  ipcMain.handle('add-server', async (_, server: ServerConfig) => {
    return await serverManager.addServer(server)
  })

  ipcMain.handle('remove-server', async (_, serverId: string) => {
    return await serverManager.removeServer(serverId)
  })

  ipcMain.handle('update-server', async (_, serverId: string, updates: Partial<ServerConfig>) => {
    return await serverManager.updateServer(serverId, updates)
  })

  // 分组管理
  ipcMain.handle('add-group', async (_, group: ServerGroup) => {
    return await serverManager.addGroup(group)
  })

  ipcMain.handle('update-group', async (_, groupId: string, updates: Partial<ServerGroup>) => {
    return await serverManager.updateGroup(groupId, updates)
  })

  ipcMain.handle('remove-group', async (_, groupId: string, forceDelete: boolean = false) => {
    return await serverManager.removeGroup(groupId, forceDelete)
  })

  // 搜索功能
  ipcMain.handle('search-servers', async (_, query: string) => {
    return await serverManager.searchServers(query)
  })

  ipcMain.handle('search-groups', async (_, query: string) => {
    return await serverManager.searchGroups(query)
  })

  // SSH管理器相关
  ipcMain.handle('ssh-send-data', async (_, connectionId: string, data: string) => {
    const sshManager = serverManager.getSSHManager()
    return sshManager.sendData(connectionId, data)
  })

  ipcMain.handle('ssh-resize-terminal', async (_, connectionId: string, cols: number, rows: number) => {
    const sshManager = serverManager.getSSHManager()
    return sshManager.resizeTerminal(connectionId, cols, rows)
  })

  // 代理管理相关
  ipcMain.handle('get-all-proxies', async () => {
    return await proxyService.getAllProxies()
  })

  ipcMain.handle('get-proxy-by-id', async (_, id: string) => {
    return await proxyService.getProxyById(id)
  })

  ipcMain.handle('create-proxy', async (_, proxy: Partial<ProxyConfig>) => {
    return await proxyService.createProxy(proxy)
  })

  ipcMain.handle('update-proxy', async (_, id: string, proxy: Partial<ProxyConfig>) => {
    return await proxyService.updateProxy(id, proxy)
  })

  ipcMain.handle('delete-proxy', async (_, id: string) => {
    return await proxyService.deleteProxy(id)
  })

  ipcMain.handle('toggle-proxy', async (_, id: string) => {
    return await proxyService.toggleProxy(id)
  })

  ipcMain.handle('search-proxies', async (_, query: string) => {
    return await proxyService.searchProxies(query)
  })

  ipcMain.handle('get-enabled-proxies', async () => {
    return await proxyService.getEnabledProxies()
  })

  ipcMain.handle('get-proxies-by-type', async (_, type: string) => {
    return await proxyService.getProxiesByType(type as any)
  })

  ipcMain.handle('test-proxy', async (_, proxy: ProxyConfig) => {
    return await proxyService.testProxy(proxy)
  })

  // 监听服务器状态变化事件
  serverManager.on('serverStatusChanged', (server) => {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (mainWindow) {
      mainWindow.webContents.send('server-status-changed', server)
    }
  })

  serverManager.on('metricsUpdated', (serverId, metrics) => {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (mainWindow) {
      mainWindow.webContents.send('metrics-updated', serverId, metrics)
    }
  })

  serverManager.on('serverAdded', (server) => {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (mainWindow) {
      mainWindow.webContents.send('server-added', server)
    }
  })

  serverManager.on('serverRemoved', (serverId) => {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (mainWindow) {
      mainWindow.webContents.send('server-removed', serverId)
    }
  })

  // SSH事件转发
  const sshManager = serverManager.getSSHManager()
  
  sshManager.on('ssh-data', (connectionId: string, data: string) => {
    console.log(`Main process received ssh-data for connection: ${connectionId}`)
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (mainWindow) {
      console.log(`Sending ssh-data-${connectionId} to renderer`)
      mainWindow.webContents.send(`ssh-data-${connectionId}`, data)
    } else {
      console.error('No main window found')
    }
  })

  sshManager.on('ssh-status', (connectionId: string, status: any) => {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (mainWindow) {
      mainWindow.webContents.send(`ssh-status-${connectionId}`, status)
    }
  })
}

// 应用退出时清理资源
app.on('before-quit', async () => {
  if (serverManager) {
    await serverManager.destroy()
  }
})
