import { DatabaseManager } from '../database/DatabaseManager'
import { ServerConfig, ServerGroup } from '../types/server'
import { v4 as uuidv4 } from 'uuid'

export class DatabaseService {
  private databaseManager: DatabaseManager

  constructor() {
    this.databaseManager = DatabaseManager.getInstance()
  }

  private getDb() {
    return this.databaseManager.getDatabase()
  }

  // 服务器分组操作
  async getAllGroups(): Promise<ServerGroup[]> {
    const db = this.getDb()
    await db.read()
    const groups = (db.data.nodes || []).filter((n: any) => n.isGroup)
    return groups.map((g: any) => ({
      id: g.id,
      name: g.name || '',
      description: g.description,
      parentId: g.parentId,
      proxyId: g.proxyId,
      servers: [],
      children: []
    }))
  }

  async getRootGroups(): Promise<ServerGroup[]> {
    const db = this.getDb()
    await db.read()
    const groups = (db.data.nodes || []).filter((n: any) => n.isGroup && !n.parentId)
    return groups.map((g: any) => ({
      id: g.id,
      name: g.name || '',
      description: g.description,
      parentId: undefined,
      proxyId: g.proxyId,
      servers: [],
      children: []
    }))
  }

  async getGroupById(id: string): Promise<ServerGroup | null> {
    const db = this.getDb()
    await db.read()
    const g = (db.data.nodes || []).find((n: any) => n.isGroup && n.id === id)
    return g ? { id: g.id, name: g.name || '', description: g.description, parentId: g.parentId, proxyId: g.proxyId, servers: [], children: [] } : null
  }

  async createGroup(groupData: Partial<ServerGroup>): Promise<ServerGroup> {
    const db = this.getDb()
    await db.read()
    
    const id = uuidv4()
    const node = {
      id,
      isGroup: true,
      name: groupData.name || '',
      description: groupData.description || '',
      parentId: groupData.parentId,
      proxyId: groupData.proxyId
    }
    ;(db.data.nodes as any[]).push(node)
    await db.write()
    return { id, name: node.name, description: node.description, parentId: node.parentId, proxyId: node.proxyId, servers: [], children: [] }
  }

  async updateGroup(id: string, groupData: Partial<ServerGroup>): Promise<ServerGroup | null> {
    const db = this.getDb()
    await db.read()
    
    const idx = (db.data.nodes as any[]).findIndex((n: any) => n.isGroup && n.id === id)
    if (idx === -1) return null
    const current = (db.data.nodes as any[])[idx]
    ;(db.data.nodes as any[])[idx] = { 
      ...current, 
      name: groupData.name ?? current.name, 
      description: groupData.description ?? current.description, 
      parentId: groupData.parentId ?? current.parentId,
      proxyId: groupData.proxyId !== undefined ? groupData.proxyId : current.proxyId
    }
    await db.write()
    const g = (db.data.nodes as any[])[idx]
    return { id: g.id, name: g.name, description: g.description, parentId: g.parentId, proxyId: g.proxyId, servers: [], children: [] }
  }

  async deleteGroup(id: string, forceDelete: boolean = false): Promise<boolean> {
    const db = this.getDb()
    await db.read()
    
    // 检查是否有子节点（子分组或服务器）
    const children = (db.data.nodes as any[]).filter((n: any) => n.parentId === id)
    if (children.length > 0 && !forceDelete) {
      console.log(`Cannot delete group ${id}: has ${children.length} children`, children.map(c => ({ id: c.id, name: c.name, isGroup: c.isGroup })))
      return false
    }
    
    if (forceDelete && children.length > 0) {
      console.log(`Force deleting group ${id} with ${children.length} children`)
      
      // 递归删除所有子分组和服务器
      for (const child of children) {
        if (child.isGroup) {
          // 递归删除子分组
          console.log(`Recursively deleting child group: ${child.name} (${child.id})`)
          await this.deleteGroup(child.id, true)
        } else {
          // 删除服务器
          console.log(`Deleting child server: ${child.name} (${child.id})`)
          await this.deleteServer(child.id)
        }
      }
    }
    
    const before = (db.data.nodes as any[]).length
    db.data.nodes = (db.data.nodes as any[]).filter((n: any) => !(n.isGroup && n.id === id))
    await db.write()
    const after = (db.data.nodes as any[]).length
    
    console.log(`Group ${id} deletion: before=${before}, after=${after}, success=${after < before}`)
    return after < before
  }

  // 服务器操作
  async getAllServers(): Promise<ServerConfig[]> {
    const db = this.getDb()
    await db.read()
    const servers = (db.data.nodes || []).filter((n: any) => !n.isGroup)
    return servers.map((s: any) => ({
      id: s.id,
      name: s.name || '',
      host: s.host || '',
      port: s.port || 22,
      username: s.username || '',
      password: s.password,
      privateKey: s.privateKey,
      groupId: s.parentId || '',
      proxyId: s.proxyId,
      description: s.description,
      status: s.status || 'stopped',
      lastConnected: s.lastConnected
    }))
  }

  async getServerById(id: string): Promise<ServerConfig | null> {
    const db = this.getDb()
    await db.read()
    const s = (db.data.nodes as any[]).find((n: any) => !n.isGroup && n.id === id)
    return s ? {
      id: s.id, 
      name: s.name || '', 
      host: s.host || '', 
      port: s.port || 22, 
      username: s.username || '', 
      password: s.password, 
      privateKey: s.privateKey, 
      groupId: s.parentId || '', 
      proxyId: s.proxyId,
      description: s.description,
      status: s.status || 'stopped', 
      lastConnected: s.lastConnected
    } : null
  }

  async getServersByGroup(groupId: string): Promise<ServerConfig[]> {
    const db = this.getDb()
    await db.read()
    const servers = (db.data.nodes || []).filter((n: any) => !n.isGroup && n.parentId === groupId)
    return servers.map((s: any) => ({
      id: s.id, 
      name: s.name || '', 
      host: s.host || '', 
      port: s.port || 22, 
      username: s.username || '', 
      password: s.password, 
      privateKey: s.privateKey, 
      groupId: s.parentId || '', 
      proxyId: s.proxyId,
      description: s.description,
      status: s.status || 'stopped', 
      lastConnected: s.lastConnected
    }))
  }

  async createServer(serverData: Partial<ServerConfig>): Promise<ServerConfig> {
    const db = this.getDb()
    await db.read()
    
    const id = uuidv4()
    const node = {
      id,
      isGroup: false,
      name: serverData.name || '',
      host: serverData.host || '',
      port: serverData.port || 22,
      username: serverData.username || '',
      password: serverData.password,
      privateKey: serverData.privateKey,
      parentId: serverData.groupId || '',
      proxyId: serverData.proxyId,
      description: serverData.description,
      status: serverData.status || 'stopped',
      lastConnected: serverData.lastConnected
    }
    ;(db.data.nodes as any[]).push(node)
    await db.write()
    return { 
      id, 
      name: node.name, 
      host: node.host!, 
      port: node.port!, 
      username: node.username!, 
      password: node.password, 
      privateKey: node.privateKey, 
      groupId: node.parentId!, 
      proxyId: node.proxyId,
      description: node.description,
      status: node.status!, 
      lastConnected: node.lastConnected 
    }
  }

  async updateServer(id: string, serverData: Partial<ServerConfig>): Promise<ServerConfig | null> {
    const db = this.getDb()
    await db.read()
    
    const idx = (db.data.nodes as any[]).findIndex((n: any) => !n.isGroup && n.id === id)
    if (idx === -1) return null
    const current = (db.data.nodes as any[])[idx]
    ;(db.data.nodes as any[])[idx] = {
      ...current,
      name: serverData.name ?? current.name,
      host: serverData.host ?? current.host,
      port: serverData.port ?? current.port,
      username: serverData.username ?? current.username,
      password: serverData.password ?? current.password,
      privateKey: serverData.privateKey ?? current.privateKey,
      parentId: serverData.groupId ?? current.parentId,
      proxyId: serverData.proxyId !== undefined ? serverData.proxyId : current.proxyId,
      description: serverData.description ?? current.description,
      status: serverData.status ?? current.status,
      lastConnected: serverData.lastConnected ?? current.lastConnected
    }
    await db.write()
    const s = (db.data.nodes as any[])[idx]
    return { id: s.id, name: s.name, host: s.host, port: s.port, username: s.username, password: s.password, privateKey: s.privateKey, groupId: s.parentId, proxyId: s.proxyId, description: s.description, status: s.status, lastConnected: s.lastConnected }
  }

  async deleteServer(id: string): Promise<boolean> {
    const db = this.getDb()
    await db.read()
    
    const before = (db.data.nodes as any[]).length
    db.data.nodes = (db.data.nodes as any[]).filter((n: any) => !(n.id === id && !n.isGroup))
    await db.write()
    return (db.data.nodes as any[]).length < before
  }

  async updateServerStatus(id: string, status: ServerConfig['status'], lastConnected?: Date): Promise<ServerConfig | null> {
    const db = this.getDb()
    await db.read()
    const idx = (db.data.nodes as any[]).findIndex((n: any) => !n.isGroup && n.id === id)
    if (idx === -1) return null
    const current = (db.data.nodes as any[])[idx]
    ;(db.data.nodes as any[])[idx] = { ...current, status, lastConnected: lastConnected ?? current.lastConnected }
    await db.write()
    const s = (db.data.nodes as any[])[idx]
    return { 
      id: s.id, 
      name: s.name, 
      host: s.host, 
      port: s.port, 
      username: s.username, 
      password: s.password, 
      privateKey: s.privateKey, 
      groupId: s.parentId, 
      proxyId: s.proxyId,
      description: s.description,
      status: s.status, 
      lastConnected: s.lastConnected 
    }
  }

  // 搜索功能
  async searchServers(query: string): Promise<ServerConfig[]> {
    const db = this.getDb()
    await db.read()
    
    const lowerQuery = query.toLowerCase()
    const servers = (db.data.nodes as any[]).filter((n: any) => !n.isGroup)
    return servers.filter((s: any) =>
      (s.name || '').toLowerCase().includes(lowerQuery) ||
      (s.host || '').toLowerCase().includes(lowerQuery)
    ).map((s: any) => ({ 
      id: s.id, 
      name: s.name || '', 
      host: s.host || '', 
      port: s.port || 22, 
      username: s.username || '', 
      password: s.password, 
      privateKey: s.privateKey, 
      groupId: s.parentId || '', 
      proxyId: s.proxyId,
      description: s.description,
      status: s.status || 'stopped', 
      lastConnected: s.lastConnected 
    }))
  }

  async searchGroups(query: string): Promise<ServerGroup[]> {
    const db = this.getDb()
    await db.read()
    
    const lowerQuery = query.toLowerCase()
    const groups = (db.data.nodes as any[]).filter((n: any) => n.isGroup)
    return groups.filter((g: any) =>
      (g.name || '').toLowerCase().includes(lowerQuery) ||
      (g.description || '').toLowerCase().includes(lowerQuery)
    ).map((g: any) => ({ id: g.id, name: g.name || '', description: g.description, parentId: g.parentId, servers: [], children: [] }))
  }

  // 获取所有代理配置
  async getProxies(): Promise<any[]> {
    const db = this.getDb()
    await db.read()
    
    // 从数据库获取代理配置
    const proxies = (db.data.proxies as any[]) || []
    return proxies.map((p: any) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      host: p.host,
      port: p.port,
      username: p.username,
      password: p.password,
      description: p.description,
      enabled: p.enabled,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }))
  }
}
