import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { join } from 'path'
import { app } from 'electron'
import { ServerConfig, ProxyConfig } from '../types/server'

// Unified storage schema: a single nodes array
// Node items can represent either a group (isGroup=true) or a server (isGroup=false)
interface DatabaseNode {
  id: string
  isGroup: boolean
  parentId?: string
  proxyId?: string
  // group fields
  name: string
  description?: string
  // server fields
  host?: string
  port?: number
  username?: string
  password?: string
  privateKey?: string
  status?: ServerConfig['status']
  lastConnected?: Date
}

interface DatabaseSchema {
  nodes: DatabaseNode[]
  proxies: ProxyConfig[]
}

export class DatabaseManager {
  private static instance: DatabaseManager
  private db: Low<DatabaseSchema> | null = null

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  async initialize(): Promise<void> {
    if (this.db) {
      return
    }

    const userDataPath = app.getPath('userData')
    const dbPath = join(userDataPath, 'servers.json')

    const adapter = new JSONFile<DatabaseSchema>(dbPath)
    this.db = new Low(adapter, { nodes: [], proxies: [] })

    try {
      await this.db.read()
      console.log('Database initialized successfully')
      // Migration guard: if old schema exists, convert to nodes
      // Old schema keys: groups[], servers[]
      // New schema key: nodes[]
      // @ts-ignore - runtime shape check
      const anyData: any = this.db.data
      if (!anyData.nodes) {
        anyData.nodes = []
        const oldGroups: any[] = Array.isArray(anyData.groups) ? anyData.groups : []
        const oldServers: any[] = Array.isArray(anyData.servers) ? anyData.servers : []
        // convert groups
        for (const g of oldGroups) {
          anyData.nodes.push({ id: g.id, isGroup: true, name: g.name, description: g.description, parentId: g.parentId })
        }
        // convert servers
        for (const s of oldServers) {
          anyData.nodes.push({ id: s.id, isGroup: false, parentId: s.groupId, name: s.name, host: s.host, port: s.port, username: s.username, password: s.password, privateKey: s.privateKey, status: s.status, lastConnected: s.lastConnected })
        }
        // cleanup old keys
        delete anyData.groups
        delete anyData.servers
        await this.db.write()
      }
      
      // Initialize proxies array if it doesn't exist
      if (!anyData.proxies) {
        anyData.proxies = []
        await this.db.write()
        console.log('Proxies array initialized.')
      }
      
      // 初始化默认数据
      await this.initializeDefaultData()
    } catch (error) {
      console.error('Database initialization failed:', error)
      throw error
    }
  }

  private async initializeDefaultData(): Promise<void> {
    if (!this.db) return

    // 检查是否已有数据
    if (this.db.data.nodes.length > 0) {
      return // 已有数据，不初始化
    }

    // 默认分组与服务器作为统一节点
    const nodes: DatabaseNode[] = [
      { id: 'production', isGroup: true, name: '生产环境', description: '生产环境服务器分组' },
      { id: 'test', isGroup: true, name: '测试环境', description: '测试环境服务器分组' },
      { id: 'dev', isGroup: true, name: '开发环境', description: '开发环境服务器分组' },
      { id: 'web-servers', isGroup: true, parentId: 'production', name: 'Web服务器', description: 'Web应用服务器' },
      { id: 'db-servers', isGroup: true, parentId: 'production', name: '数据库服务器', description: '数据库服务器' },
      { id: 'web-01', isGroup: false, parentId: 'web-servers', name: 'Web-01', host: '192.168.1.101', port: 22, username: 'root', password: 'demo-password', status: 'stopped' },
      { id: 'web-02', isGroup: false, parentId: 'web-servers', name: 'Web-02', host: '192.168.1.102', port: 22, username: 'root', password: 'demo-password', status: 'stopped' },
      { id: 'db-01', isGroup: false, parentId: 'db-servers', name: 'DB-01', host: '192.168.1.201', port: 22, username: 'root', password: 'demo-password', status: 'stopped' },
      { id: 'db-02', isGroup: false, parentId: 'db-servers', name: 'DB-02', host: '192.168.1.202', port: 22, username: 'root', password: 'demo-password', status: 'maintenance' }
    ]

    this.db.data.nodes = nodes
    
    await this.db.write()
    console.log('Default data initialized successfully')
  }

  getDatabase(): Low<DatabaseSchema> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    return this.db
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.write()
      this.db = null
      console.log('Database connection closed')
    }
  }
}
