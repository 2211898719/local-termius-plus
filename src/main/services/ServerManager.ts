import { SSHManager } from './SSHManager'
import { ServerConfig, ServerGroup, ServerMetrics, SSHConnection, ProxyConfig } from '../types/server'
import { DatabaseService } from './DatabaseService'
import { DatabaseManager } from '../database/DatabaseManager'
import { EventEmitter } from 'events'

export class ServerManager extends EventEmitter {
  private sshManager: SSHManager
  private databaseService: DatabaseService
  private metricsCache: Map<string, ServerMetrics> = new Map()
  private metricsInterval: NodeJS.Timeout | null = null

  constructor() {
    super()
    this.sshManager = new SSHManager()
    this.databaseService = new DatabaseService()
    this.startMetricsCollection()
  }

  // 构建分组层次结构
  private buildGroupHierarchy(groups: ServerGroup[], servers: ServerConfig[]): ServerGroup[] {
    const groupMap = new Map<string, ServerGroup>()

    // 创建分组映射
    groups.forEach(group => {
      groupMap.set(group.id, { ...group, servers: [], children: [] })
    })

    // 分配服务器到分组
    servers.forEach(server => {
      const group = groupMap.get(server.groupId)
      if (group) {
        group.servers.push(server)
      }
    })

    // 构建父子关系
    const rootGroups: ServerGroup[] = []
    groups.forEach(group => {
      const groupWithData = groupMap.get(group.id)!
      if (group.parentId) {
        const parent = groupMap.get(group.parentId)
        if (parent) {
          parent.children.push(groupWithData)
        }
      } else {
        rootGroups.push(groupWithData)
      }
    })

    return rootGroups
  }

  // 获取服务器的代理配置
  private async getProxyForServer(server: ServerConfig): Promise<ProxyConfig | null> {
    try {
      // 获取所有代理配置
      const proxies = await this.databaseService.getProxies()
      
      // 1. 首先检查服务器自身是否有代理配置
      if (server.proxyId) {
        const proxy = proxies.find(p => p.id === server.proxyId)
        if (proxy) return proxy
      }
      
      // 2. 递归查找父组的代理配置
      const serverGroups = await this.databaseService.getAllGroups()
      const findProxyInGroups = (groups: ServerGroup[], targetGroupId: string): ProxyConfig | null => {
        for (const group of groups) {
          if (group.id === targetGroupId) {
            // 检查当前组是否有代理配置
            if (group.proxyId) {
              const proxy = proxies.find(p => p.id === group.proxyId)
              if (proxy) return proxy
            }
            
            // 如果有父组，递归查找父组
            if (group.parentId) {
              return findProxyInGroups(serverGroups, group.parentId)
            }
            
            return null
          }
          
          // 递归查找子组
          const result = findProxyInGroups(group.children, targetGroupId)
          if (result) return result
        }
        return null
      }
      
      return findProxyInGroups(serverGroups, server.groupId)
    } catch (error) {
      console.error('Failed to get proxy for server:', error)
      return null
    }
  }

  async connectToServer(serverId: string, connectionId?: string): Promise<boolean> {
    console.log('ServerManager.connectToServer called with:', { serverId, connectionId })
    const server = await this.databaseService.getServerById(serverId)
    if (!server) {
      console.log('Server not found:', serverId)
      return false
    }

    console.log('Found server:', server)
    
    // 在后台查询代理配置
    const proxyConfig = await this.getProxyForServer(server)
    if (proxyConfig) {
      console.log('Using proxy:', proxyConfig.name, `(${proxyConfig.type})`)
    }
    
    try {
      const connected = await this.sshManager.connect(server, connectionId, proxyConfig || undefined)
      console.log('SSH connection result:', connected)
      if (connected) {
        await this.databaseService.updateServerStatus(serverId, 'running', new Date())
        const updatedServer = await this.databaseService.getServerById(serverId)
        if (updatedServer) {
          this.emit('serverStatusChanged', updatedServer)
        }
      } else {
        await this.databaseService.updateServerStatus(serverId, 'error')
        const updatedServer = await this.databaseService.getServerById(serverId)
        if (updatedServer) {
          this.emit('serverStatusChanged', updatedServer)
        }
      }
      return connected
    } catch (error) {
      console.error(`Failed to connect to server ${server.name}:`, error)
      await this.databaseService.updateServerStatus(serverId, 'error')
      const updatedServer = await this.databaseService.getServerById(serverId)
      if (updatedServer) {
        this.emit('serverStatusChanged', updatedServer)
      }
      return false
    }
  }

  async disconnectFromServer(serverId: string, connectionId?: string): Promise<void> {
    await this.sshManager.disconnect(serverId, connectionId)
    // 只有当没有其他连接时才更新服务器状态为停止
    const hasActiveConnections = await this.sshManager.hasActiveConnections(serverId)
    if (!hasActiveConnections) {
      await this.databaseService.updateServerStatus(serverId, 'stopped')
      const updatedServer = await this.databaseService.getServerById(serverId)
      if (updatedServer) {
        this.emit('serverStatusChanged', updatedServer)
      }
    }
  }

  async executeCommand(connectionId: string, command: string): Promise<any> {
    return await this.sshManager.executeCommand(connectionId, command)
  }

  async getServerMetrics(connectionId: string): Promise<ServerMetrics | null> {
    try {
      const metrics = await this.sshManager.getServerMetrics(connectionId)
      if (metrics) {
        // 从连接状态中获取服务器 ID
        const connectionStatus = this.sshManager.getConnectionStatus(connectionId)
        if (connectionStatus) {
          this.metricsCache.set(connectionStatus.serverId, metrics)
        }
        return metrics
      }
    } catch (error) {
      console.error('Error getting server metrics:', error)
    }

    // 如果无法获取真实指标，返回null
    return null
  }

  getCachedMetrics(serverId: string): ServerMetrics | null {
    return this.metricsCache.get(serverId) || null
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        const allServers = await this.getAllServers()
        for (const server of allServers) {
          if (this.sshManager.isConnected(server.id)) {
            const metrics = await this.getServerMetrics(server.id)
            if (metrics) {
              this.emit('metricsUpdated', server.id, metrics)
            }
          }
        }
      } catch (error) {
        console.error('Error in metrics collection:', error)
      }
    }, 5000) // 每5秒收集一次指标
  }

  stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = null
    }
  }

  // 服务器管理方法
  async addServer(serverData: Partial<ServerConfig>): Promise<ServerConfig | null> {
    try {
      const server = await this.databaseService.createServer(serverData)
      this.emit('serverAdded', server)
      return server
    } catch (error) {
      console.error('Failed to add server:', error)
      return null
    }
  }

  async removeServer(serverId: string): Promise<boolean> {
    try {
      // 先断开连接
      await this.sshManager.disconnect(serverId)

      // 从数据库删除
      const success = await this.databaseService.deleteServer(serverId)
      if (success) {
        this.emit('serverRemoved', serverId)
      }
      return success
    } catch (error) {
      console.error('Failed to remove server:', error)
      return false
    }
  }

  async updateServer(serverId: string, updates: Partial<ServerConfig>): Promise<ServerConfig | null> {
    try {
      const server = await this.databaseService.updateServer(serverId, updates)
      if (server) {
        this.emit('serverUpdated', server)
        return server
      }
      return null
    } catch (error) {
      console.error('Failed to update server:', error)
      return null
    }
  }

  // 分组管理方法
  async addGroup(groupData: Partial<ServerGroup>): Promise<ServerGroup | null> {
    try {
      const group = await this.databaseService.createGroup(groupData)
      this.emit('groupAdded', group)
      return group
    } catch (error) {
      console.error('Failed to add group:', error)
      return null
    }
  }

  async updateGroup(groupId: string, updates: Partial<ServerGroup>): Promise<ServerGroup | null> {
    try {
      const group = await this.databaseService.updateGroup(groupId, updates)
      if (group) {
        this.emit('groupUpdated', group)
      }
      return group
    } catch (error) {
      console.error('Failed to update group:', error)
      return null
    }
  }

  async removeGroup(groupId: string, forceDelete: boolean = false): Promise<boolean> {
    try {
      console.log(`Attempting to remove group: ${groupId}, force: ${forceDelete}`)
      
      // 获取分组下的所有服务器并断开连接
      const servers = await this.databaseService.getServersByGroup(groupId)
      console.log(`Found ${servers.length} servers in group ${groupId}`)
      
      for (const server of servers) {
        console.log(`Disconnecting server: ${server.name} (${server.id})`)
        await this.sshManager.disconnect(server.id)
      }

      // 从数据库删除分组（传递强制删除标志）
      const success = await this.databaseService.deleteGroup(groupId, forceDelete)
      console.log(`Group ${groupId} deletion result: ${success}`)
      
      if (success) {
        this.emit('groupRemoved', groupId)
        console.log(`Group ${groupId} removed successfully`)
      } else {
        console.log(`Group ${groupId} removal failed - may have children`)
      }
      
      return success
    } catch (error) {
      console.error('Failed to remove group:', error)
      return false
    }
  }

  // 获取方法
  async getServer(serverId: string): Promise<ServerConfig | null> {
    try {
      return await this.databaseService.getServerById(serverId)
    } catch (error) {
      console.error('Failed to get server:', error)
      return null
    }
  }

  async getAllServers(): Promise<ServerConfig[]> {
    try {
      return await this.databaseService.getAllServers()
    } catch (error) {
      console.error('Failed to get all servers:', error)
      return []
    }
  }

  async getGroup(groupId: string): Promise<ServerGroup | null> {
    try {
      return await this.databaseService.getGroupById(groupId)
    } catch (error) {
      console.error('Failed to get group:', error)
      return null
    }
  }

  async getAllGroups(): Promise<ServerGroup[]> {
    try {
      const groups = await this.databaseService.getAllGroups()
      const servers = await this.databaseService.getAllServers()
      return this.buildGroupHierarchy(groups, servers)
    } catch (error) {
      console.error('Failed to get all groups:', error)
      return []
    }
  }

  async getRootGroups(): Promise<ServerGroup[]> {
    try {
      const groups = await this.databaseService.getRootGroups()
      const servers = await this.databaseService.getAllServers()
      return this.buildGroupHierarchy(groups, servers)
    } catch (error) {
      console.error('Failed to get root groups:', error)
      return []
    }
  }

  async getServersByGroup(groupId: string): Promise<ServerConfig[]> {
    try {
      return await this.databaseService.getServersByGroup(groupId)
    } catch (error) {
      console.error('Failed to get servers by group:', error)
      return []
    }
  }

  getConnectionStatus(serverId: string): any {
    // 查找连接到指定服务器的第一个连接状态
    const connections = this.sshManager.getAllConnections()
    const connection = connections.find(conn => conn.serverId === serverId && conn.connected)
    return connection || null
  }

  async isConnected(serverId: string): Promise<boolean> {
    return await this.sshManager.hasActiveConnections(serverId)
  }

  getAllConnections(): SSHConnection[] {
    return this.sshManager.getAllConnections()
  }

  // 搜索功能
  async searchServers(query: string): Promise<ServerConfig[]> {
    try {
      return await this.databaseService.searchServers(query)
    } catch (error) {
      console.error('Failed to search servers:', error)
      return []
    }
  }

  async searchGroups(query: string): Promise<ServerGroup[]> {
    try {
      return await this.databaseService.searchGroups(query)
    } catch (error) {
      console.error('Failed to search groups:', error)
      return []
    }
  }

  // 获取SSH管理器实例
  getSSHManager() {
    return this.sshManager
  }

  async destroy(): Promise<void> {
    this.stopMetricsCollection()

    // 断开所有连接
    const allServers = await this.getAllServers()
    for (const server of allServers) {
      await this.sshManager.disconnect(server.id)
    }

    // 关闭数据库连接
    const databaseManager = DatabaseManager.getInstance()
    await databaseManager.close()
  }
}
