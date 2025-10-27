export interface ServerConfig {
  id: string
  name: string
  host: string
  port: number
  username: string
  password?: string
  privateKey?: string
  groupId: string
  proxyId?: string // 代理配置ID
  description?: string
  status: 'running' | 'stopped' | 'maintenance' | 'error'
  lastConnected?: Date
}

export interface ServerGroup {
  id: string
  name: string
  parentId?: string
  proxyId?: string // 代理配置ID
  description?: string
  servers: ServerConfig[]
  children: ServerGroup[]
}

export interface ServerMetrics {
  cpu: {
    usage: number
    cores: number
    loadAverage: number[]
  }
  memory: {
    total: number
    used: number
    free: number
    usage: number
  }
  disk: {
    total: number
    used: number
    free: number
    usage: number
    mountPoints: DiskMountPoint[]
  }
  network: {
    interfaces: NetworkInterface[]
    traffic: {
      received: number
      sent: number
      total: number
    }
  }
  uptime: number
  processes: number
}

export interface DiskMountPoint {
  mountPoint: string
  fileSystem: string
  total: number
  used: number
  usage: number
}

export interface NetworkInterface {
  name: string
  ip: string
  mac: string
  subnet: string
  status: 'up' | 'down'
}

export interface SSHConnection {
  id: string
  serverId: string
  connected: boolean
  lastCommand?: string
  lastOutput?: string
  error?: string
}

export interface CommandResult {
  success: boolean
  output: string
  error?: string
  exitCode?: number
}

// 代理类型
export type ProxyType = 'socks5' | 'socks4' | 'http'

// 代理配置接口
export interface ProxyConfig {
  id: string
  name: string
  type: ProxyType
  host: string
  port: number
  username?: string
  password?: string
  description?: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}
