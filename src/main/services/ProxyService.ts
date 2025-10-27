import { DatabaseManager } from '../database/DatabaseManager'
import { ProxyConfig, ProxyType } from '../types/server'
import { v4 as uuidv4 } from 'uuid'

export class ProxyService {
  private databaseManager: DatabaseManager

  constructor() {
    this.databaseManager = DatabaseManager.getInstance()
  }

  private getDb() {
    return this.databaseManager.getDatabase()
  }

  // 获取所有代理
  async getAllProxies(): Promise<ProxyConfig[]> {
    const db = this.getDb()
    await db.read()
    return db.data.proxies || []
  }

  // 根据ID获取代理
  async getProxyById(id: string): Promise<ProxyConfig | null> {
    const db = this.getDb()
    await db.read()
    return db.data.proxies?.find(proxy => proxy.id === id) || null
  }

  // 创建代理
  async createProxy(proxyData: Partial<ProxyConfig>): Promise<ProxyConfig> {
    const db = this.getDb()
    await db.read()

    const now = new Date()
    const proxy: ProxyConfig = {
      id: uuidv4(),
      name: proxyData.name || '',
      type: proxyData.type || 'http',
      host: proxyData.host || '',
      port: proxyData.port || 8080,
      username: proxyData.username,
      password: proxyData.password,
      description: proxyData.description,
      enabled: proxyData.enabled !== undefined ? proxyData.enabled : true,
      createdAt: now,
      updatedAt: now
    }

    if (!db.data.proxies) {
      db.data.proxies = []
    }
    
    db.data.proxies.push(proxy)
    await db.write()
    return proxy
  }

  // 更新代理
  async updateProxy(id: string, proxyData: Partial<ProxyConfig>): Promise<ProxyConfig | null> {
    const db = this.getDb()
    await db.read()

    const proxyIndex = db.data.proxies?.findIndex(proxy => proxy.id === id)
    if (proxyIndex === undefined || proxyIndex === -1) {
      return null
    }

    const existingProxy = db.data.proxies![proxyIndex]
    const updatedProxy: ProxyConfig = {
      ...existingProxy,
      ...proxyData,
      id: existingProxy.id, // 保持ID不变
      createdAt: existingProxy.createdAt, // 保持创建时间不变
      updatedAt: new Date()
    }

    db.data.proxies![proxyIndex] = updatedProxy
    await db.write()
    return updatedProxy
  }

  // 删除代理
  async deleteProxy(id: string): Promise<boolean> {
    const db = this.getDb()
    await db.read()

    if (!db.data.proxies) {
      return false
    }

    const initialLength = db.data.proxies.length
    db.data.proxies = db.data.proxies.filter(proxy => proxy.id !== id)
    await db.write()
    return db.data.proxies.length < initialLength
  }

  // 启用/禁用代理
  async toggleProxy(id: string): Promise<ProxyConfig | null> {
    const proxy = await this.getProxyById(id)
    if (!proxy) {
      return null
    }

    return await this.updateProxy(id, { enabled: !proxy.enabled })
  }

  // 搜索代理
  async searchProxies(query: string): Promise<ProxyConfig[]> {
    const db = this.getDb()
    await db.read()

    if (!db.data.proxies) {
      return []
    }

    const lowerQuery = query.toLowerCase()
    return db.data.proxies.filter(proxy =>
      proxy.name.toLowerCase().includes(lowerQuery) ||
      proxy.host.toLowerCase().includes(lowerQuery) ||
      proxy.type.toLowerCase().includes(lowerQuery) ||
      (proxy.description && proxy.description.toLowerCase().includes(lowerQuery))
    )
  }

  // 获取启用的代理
  async getEnabledProxies(): Promise<ProxyConfig[]> {
    const db = this.getDb()
    await db.read()
    return db.data.proxies?.filter(proxy => proxy.enabled) || []
  }

  // 根据类型获取代理
  async getProxiesByType(type: ProxyType): Promise<ProxyConfig[]> {
    const db = this.getDb()
    await db.read()
    return db.data.proxies?.filter(proxy => proxy.type === type) || []
  }

  // 测试代理连接
  async testProxy(proxy: ProxyConfig): Promise<boolean> {
    // 这里可以实现代理连接测试逻辑
    // 暂时返回true，实际实现需要根据代理类型进行连接测试
    console.log(`Testing proxy: ${proxy.name} (${proxy.type}://${proxy.host}:${proxy.port})`)
    return true
  }
}
