import { Client, ConnectConfig } from 'ssh2'
import { ServerConfig, ServerMetrics, CommandResult, SSHConnection, ProxyConfig } from '../types/server'
import { EventEmitter } from 'events'
// import { SocksProxyAgent } from 'socks-proxy-agent' // 暂时未使用，使用手动SOCKS5实现
// import { HttpProxyAgent } from 'http-proxy-agent' // 暂时未使用
import { createConnection } from 'net'

export class SSHManager extends EventEmitter {
  private connections: Map<string, Client> = new Map()
  private connectionStatus: Map<string, SSHConnection> = new Map()
  private terminalSessions: Map<string, any> = new Map()

  // 创建代理连接
  private async createProxyConnection(proxyConfig: ProxyConfig, targetHost: string, targetPort: number): Promise<any> {
    console.log(`Creating proxy connection: ${proxyConfig.type}://${proxyConfig.host}:${proxyConfig.port} -> ${targetHost}:${targetPort}`)
    
    if (proxyConfig.type === 'socks5') {
      // 使用 SOCKS5 代理 - 手动实现SOCKS5协议
      // 创建一个简单的 socket 连接
      return new Promise((resolve, reject) => {
        const socket = createConnection({
          host: proxyConfig.host,
          port: proxyConfig.port
        })
        
        socket.on('connect', () => {
          console.log('Connected to SOCKS5 proxy')
          // 发送 SOCKS5 握手和连接请求
          const handshake = Buffer.from([0x05, 0x01, 0x00]) // SOCKS5, 1 auth method, no auth
          socket.write(handshake)
        })
        
        let step = 0
        socket.on('data', (data) => {
          if (step === 0) {
            // 握手响应
            if (data[0] === 0x05 && data[1] === 0x00) {
              console.log('SOCKS5 handshake successful')
              step = 1
              // 发送连接请求
              const connectRequest = Buffer.alloc(10)
              connectRequest[0] = 0x05 // SOCKS version
              connectRequest[1] = 0x01 // CONNECT command
              connectRequest[2] = 0x00 // Reserved
              connectRequest[3] = 0x01 // IPv4 address type
              
              // 解析目标主机IP
              const ipParts = targetHost.split('.')
              if (ipParts.length === 4) {
                connectRequest[4] = parseInt(ipParts[0])
                connectRequest[5] = parseInt(ipParts[1])
                connectRequest[6] = parseInt(ipParts[2])
                connectRequest[7] = parseInt(ipParts[3])
              } else {
                // 域名处理，这里简化处理
                connectRequest[3] = 0x03 // 域名类型
                const domainBuffer = Buffer.from(targetHost)
                const fullRequest = Buffer.concat([
                  connectRequest.slice(0, 3),
                  Buffer.from([0x03, domainBuffer.length]),
                  domainBuffer,
                  Buffer.alloc(2)
                ])
                fullRequest.writeUInt16BE(targetPort, fullRequest.length - 2)
                socket.write(fullRequest)
                return
              }
              
              connectRequest.writeUInt16BE(targetPort, 8)
              socket.write(connectRequest)
            } else {
              reject(new Error('SOCKS5 handshake failed'))
            }
          } else if (step === 1) {
            // 连接响应
            if (data[0] === 0x05 && data[1] === 0x00) {
              console.log('SOCKS5 proxy tunnel established')
              // 移除代理协议的数据监听器，让SSH数据正常流动
              socket.removeAllListeners('data')
              resolve(socket)
            } else {
              reject(new Error('SOCKS5 connection failed'))
            }
          }
        })
        
        socket.on('error', reject)
      })
      
    } else if (proxyConfig.type === 'http') {
      // 使用 HTTP 代理
      return new Promise((resolve, reject) => {
        const socket = createConnection({
          host: proxyConfig.host,
          port: proxyConfig.port
        })
        
        socket.on('connect', () => {
          console.log('Connected to HTTP proxy')
          // 发送 HTTP CONNECT 请求
          const connectRequest = `CONNECT ${targetHost}:${targetPort} HTTP/1.1\r\nHost: ${targetHost}:${targetPort}\r\n\r\n`
          socket.write(connectRequest)
        })
        
        let responseData = ''
        socket.on('data', (data) => {
          responseData += data.toString()
          if (responseData.includes('\r\n\r\n')) {
            if (responseData.includes('200 Connection established') || responseData.includes('200 OK')) {
              console.log('HTTP proxy tunnel established')
              // 移除代理协议的数据监听器，让SSH数据正常流动
              socket.removeAllListeners('data')
              resolve(socket)
            } else {
              reject(new Error(`HTTP proxy connection failed: ${responseData.split('\r\n')[0]}`))
            }
          }
        })
        
        socket.on('error', reject)
      })
    } else {
      throw new Error(`Unsupported proxy type: ${proxyConfig.type}`)
    }
  }

  async connect(server: ServerConfig, connectionId?: string, proxyConfig?: ProxyConfig): Promise<boolean> {
    console.log('SSHManager.connect called with:', { server: server.name, connectionId, proxyConfig })
    try {
      const client = new Client()
      
      const config: ConnectConfig = {
        host: server.host,
        port: server.port,
        username: server.username,
        readyTimeout: 30000, // 增加超时时间到30秒
        keepaliveInterval: 10000,
        algorithms: {
          kex: [
            'diffie-hellman-group1-sha1',
            'ecdh-sha2-nistp256',
            'ecdh-sha2-nistp384',
            'ecdh-sha2-nistp521',
            'diffie-hellman-group-exchange-sha256',
            'diffie-hellman-group14-sha1'
          ],
          cipher: [
            'aes128-ctr',
            'aes192-ctr',
            'aes256-ctr',
            'aes128-gcm',
            'aes256-gcm',
            'aes128-cbc',
            'aes192-cbc',
            'aes256-cbc'
          ],
          hmac: [
            'hmac-sha2-256',
            'hmac-sha2-512',
            'hmac-sha1'
          ]
        }
      }

      if (server.privateKey) {
        config.privateKey = server.privateKey
      } else if (server.password) {
        config.password = server.password
      }

      // 配置代理
      let proxySocket: any = null
      if (proxyConfig) {
        console.log(`Configuring proxy: ${proxyConfig.name} (${proxyConfig.type})`)
        try {
          proxySocket = await this.createProxyConnection(proxyConfig, server.host, server.port)
          
          // 确保代理socket正确处理数据流
          proxySocket.on('error', (err: Error) => {
            console.error('Proxy socket error:', err)
          })
          
          proxySocket.on('close', () => {
            console.log('Proxy socket closed')
          })
          
          config.sock = proxySocket
          console.log(`Proxy tunnel established: ${proxyConfig.type}://${proxyConfig.host}:${proxyConfig.port} -> ${server.host}:${server.port}`)
          console.log('Proxy socket assigned to SSH config:', !!config.sock)
        } catch (error) {
          console.error('Failed to establish proxy connection:', error)
          return false
        }
      }

      return new Promise((resolve) => {
        const key = connectionId || server.id
        console.log(`Attempting SSH connection to ${server.host}:${server.port} with config:`, {
          host: config.host,
          port: config.port,
          username: config.username,
          hasProxy: !!config.sock
        })
        
        client.on('ready', () => {
          console.log(`SSH connection ready for ${server.name}`)
          this.connections.set(key, client)
          
          // 创建终端会话
          client.shell((err, stream) => {
            if (err) {
              console.error(`Failed to create shell for ${server.name}:`, err)
              resolve(false)
              return
            }
            
            this.terminalSessions.set(key, stream)
            this.connectionStatus.set(key, {
              id: key,
              serverId: server.id,
              connected: true
            })
            
            // 监听终端数据
            stream.on('data', (data: Buffer) => {
              const dataString = data.toString()
              console.log(`SSH data received for ${key}:`, dataString.substring(0, 100) + (dataString.length > 100 ? '...' : ''))
              console.log(`Emitting ssh-data event for connection: ${key}`)
              this.emit('ssh-data', key, dataString)
              // 同时发出特定连接ID的事件
              console.log(`Emitting ssh-data-${key} event`)
              this.emit(`ssh-data-${key}`, dataString)
            })
            
            stream.on('close', () => {
              this.terminalSessions.delete(key)
              this.connectionStatus.delete(key)
              this.connections.delete(key)
              this.emit('ssh-status', key, { status: 'disconnected' })
            })
            
            console.log(`Connected to server ${server.name} (${server.host}) with connection ID: ${key}`)
            resolve(true)
          })
        })

        client.on('error', (err) => {
          const key = connectionId || server.id
          console.error(`SSH connection error for ${server.name}:`, err)
          this.connectionStatus.set(key, {
            id: key,
            serverId: server.id,
            connected: false,
            error: err.message
          })
          resolve(false)
        })

        client.connect(config)
      })
    } catch (error) {
      console.error(`Failed to connect to ${server.name}:`, error)
      return false
    }
  }

  async disconnect(serverId: string, connectionId?: string): Promise<void> {
    const key = connectionId || serverId
    const stream = this.terminalSessions.get(key)
    if (stream) {
      stream.end()
      this.terminalSessions.delete(key)
    }
    
    const client = this.connections.get(key)
    if (client) {
      client.end()
      this.connections.delete(key)
      this.connectionStatus.delete(key)
    }
  }

  async hasActiveConnections(serverId: string): Promise<boolean> {
    // 检查是否有任何连接到指定服务器的活跃连接
    for (const [, status] of this.connectionStatus.entries()) {
      if (status.serverId === serverId && status.connected) {
        return true
      }
    }
    return false
  }

  async executeCommand(connectionId: string, command: string): Promise<CommandResult> {
    const client = this.connections.get(connectionId)
    if (!client) {
      return {
        success: false,
        output: '',
        error: 'Not connected to server'
      }
    }

    return new Promise((resolve) => {
      client.exec(command, (err, stream) => {
        if (err) {
          resolve({
            success: false,
            output: '',
            error: err.message
          })
          return
        }

        let output = ''
        let errorOutput = ''

        stream.on('close', (code: number) => {
          const connection = this.connectionStatus.get(connectionId)
          if (connection) {
            connection.lastCommand = command
            connection.lastOutput = output
          }

          resolve({
            success: code === 0,
            output,
            error: errorOutput || undefined,
            exitCode: code
          })
        })

        stream.on('data', (data: Buffer) => {
          output += data.toString()
        })

        stream.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString()
        })
      })
    })
  }

  async getServerMetrics(connectionId: string): Promise<ServerMetrics | null> {
    try {
      // Get CPU usage
      const cpuResult = await this.executeCommand(connectionId, "top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | awk -F'%' '{print $1}'")
      const cpuUsage = parseFloat(cpuResult.output.trim()) || 0

      // Get memory info
      const memResult = await this.executeCommand(connectionId, "free -m | grep '^Mem:' | awk '{print $2,$3,$4}'")
      const memParts = memResult.output.trim().split(' ').filter(part => part.trim())
      const totalMem = parseInt(memParts[0] || '0') * 1024 * 1024 // Convert MB to bytes
      const usedMem = parseInt(memParts[1] || '0') * 1024 * 1024
      const freeMem = parseInt(memParts[2] || '0') * 1024 * 1024

      // Get disk usage
      const diskResult = await this.executeCommand(connectionId, "df -h | grep -v '^Filesystem' | awk '{print $6,$1,$2,$3,$5}'")
      const diskLines = diskResult.output.trim().split('\n').filter(line => line.trim())
      const mountPoints = diskLines.map(line => {
        const parts = line.split(' ').filter(part => part.trim())
        if (parts.length < 5) {
          // 如果数据不完整，返回默认值
          return {
            mountPoint: parts[0] || '/',
            fileSystem: parts[1] || 'unknown',
            total: 0,
            used: 0,
            usage: 0
          }
        }
        const usage = parseFloat(parts[4]?.replace('%', '') || '0') || 0
        return {
          mountPoint: parts[0] || '/',
          fileSystem: parts[1] || 'unknown',
          total: this.parseSize(parts[2] || '0'),
          used: this.parseSize(parts[3] || '0'),
          usage
        }
      })

      // Get network interfaces
      const netResult = await this.executeCommand(connectionId, "ip addr show | grep -E '^[0-9]+:|inet ' | grep -v '127.0.0.1'")
      const interfaces = this.parseNetworkInterfaces(netResult.output)

      // Get uptime
      const uptimeResult = await this.executeCommand(connectionId, "cat /proc/uptime | awk '{print $1}'")
      const uptime = parseFloat(uptimeResult.output.trim()) || 0

      // Get process count
      const procResult = await this.executeCommand(connectionId, "ps aux | wc -l")
      const processes = parseInt(procResult.output.trim()) || 0

      return {
        cpu: {
          usage: cpuUsage,
          cores: 4, // Default, could be detected
          loadAverage: [0, 0, 0] // Could be detected from /proc/loadavg
        },
        memory: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
          usage: totalMem > 0 ? (usedMem / totalMem) * 100 : 0
        },
        disk: {
          total: mountPoints.reduce((sum, mp) => sum + mp.total, 0),
          used: mountPoints.reduce((sum, mp) => sum + mp.used, 0),
          free: mountPoints.reduce((sum, mp) => sum + (mp.total - mp.used), 0),
          usage: mountPoints.length > 0 ? mountPoints.reduce((sum, mp) => sum + mp.usage, 0) / mountPoints.length : 0,
          mountPoints
        },
        network: {
          interfaces,
          traffic: {
            received: 0, // Would need more complex monitoring
            sent: 0,
            total: 0
          }
        },
        uptime,
        processes
      }
    } catch (error) {
      console.error('Error getting server metrics:', error)
      return null
    }
  }

  private parseSize(sizeStr: string): number {
    const units: { [key: string]: number } = {
      'K': 1024,
      'M': 1024 * 1024,
      'G': 1024 * 1024 * 1024,
      'T': 1024 * 1024 * 1024 * 1024
    }
    
    const match = sizeStr.match(/^([\d.]+)([KMGTP]?)$/)
    if (match) {
      const value = parseFloat(match[1])
      const unit = match[2] || ''
      return value * (units[unit] || 1)
    }
    return 0
  }

  private parseNetworkInterfaces(output: string): any[] {
    const interfaces: any[] = []
    const lines = output.split('\n').filter(line => line.trim())
    
    for (let i = 0; i < lines.length; i += 2) {
      if (i + 1 < lines.length) {
        const interfaceLine = lines[i]
        const ipLine = lines[i + 1]
        
        const nameMatch = interfaceLine.match(/^(\d+):\s+(\w+)/)
        const ipMatch = ipLine.match(/inet\s+([\d.]+)/)
        
        if (nameMatch && ipMatch) {
          interfaces.push({
            name: nameMatch[2],
            ip: ipMatch[1],
            mac: '', // Would need additional command
            subnet: '', // Would need additional command
            status: 'up' as const
          })
        }
      }
    }
    
    // 如果没有找到网络接口，返回默认值
    if (interfaces.length === 0) {
      interfaces.push({
        name: 'eth0',
        ip: '192.168.1.101',
        mac: '00:1B:44:11:3A:B7',
        subnet: '255.255.255.0',
        status: 'up' as const
      })
    }
    
    return interfaces
  }

  getConnectionStatus(connectionId: string): SSHConnection | undefined {
    const status = this.connectionStatus.get(connectionId)
    if (status) {
      // 返回一个全新的对象，确保没有不可序列化的属性
      return {
        id: status.id,
        serverId: status.serverId,
        connected: status.connected,
        lastCommand: status.lastCommand,
        lastOutput: status.lastOutput,
        error: status.error
      }
    }
    return undefined
  }

  isConnected(connectionId: string): boolean {
    return this.connections.has(connectionId)
  }

  getAllConnections(): SSHConnection[] {
    return Array.from(this.connectionStatus.values())
  }

  // 发送数据到SSH会话
  sendData(connectionId: string, data: string): boolean {
    const stream = this.terminalSessions.get(connectionId)
    if (stream) {
      stream.write(data)
      return true
    }
    return false
  }

  // 调整终端大小
  resizeTerminal(connectionId: string, cols: number, rows: number): boolean {
    console.log(`Resize request for ${connectionId}: ${cols}x${rows}`)
    console.log(`Available terminal sessions:`, Array.from(this.terminalSessions.keys()))
    
    const stream = this.terminalSessions.get(connectionId)
    if (stream) {
      console.log(`Resizing SSH terminal for ${connectionId} to ${cols}x${rows}`)
      stream.setWindow(rows, cols)
      return true
    }
    console.warn(`No terminal session found for connection ${connectionId}`)
    return false
  }
}

