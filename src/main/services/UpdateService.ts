import { autoUpdater } from 'electron-updater'
import { BrowserWindow, dialog, app } from 'electron'
import { EventEmitter } from 'events'

export interface UpdateInfo {
  version: string
  releaseNotes?: string
  releaseDate?: string
  downloadUrl?: string
}

export interface UpdateProgress {
  percent: number
  transferred: number
  total: number
  bytesPerSecond: number
}

export class UpdateService extends EventEmitter {
  private mainWindow: BrowserWindow | null = null
  private updateAvailable: UpdateInfo | null = null
  private isChecking = false
  private isDownloading = false

  constructor() {
    super()
    this.setupAutoUpdater()
  }

  private setupAutoUpdater(): void {
    // 配置自动更新器
    autoUpdater.autoDownload = false // 禁用自动下载
    autoUpdater.autoInstallOnAppQuit = true // 退出时自动安装

    // 监听更新事件
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for updates...')
      this.isChecking = true
      this.emit('checking-for-update')
    })

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info)
      this.updateAvailable = {
        version: info.version,
        releaseNotes: Array.isArray(info.releaseNotes) ? info.releaseNotes.join('\n') : info.releaseNotes || undefined,
        releaseDate: info.releaseDate
      }
      this.isChecking = false
      this.emit('update-available', this.updateAvailable)
    })

    autoUpdater.on('update-not-available', (info) => {
      console.log('Update not available:', info)
      this.isChecking = false
      this.emit('update-not-available', info)
    })

    autoUpdater.on('error', (error) => {
      console.error('Update error:', error)
      this.isChecking = false
      this.isDownloading = false
      this.emit('error', error)
    })

    autoUpdater.on('download-progress', (progress) => {
      const progressInfo: UpdateProgress = {
        percent: Math.round(progress.percent),
        transferred: progress.transferred,
        total: progress.total,
        bytesPerSecond: progress.bytesPerSecond
      }
      this.emit('download-progress', progressInfo)
    })

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info)
      this.isDownloading = false
      this.emit('update-downloaded', info)
    })
  }

  /**
   * 设置主窗口引用
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  /**
   * 检查更新
   */
  async checkForUpdates(): Promise<void> {
    if (this.isChecking) {
      console.log('Already checking for updates')
      return
    }

    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      console.error('Failed to check for updates:', error)
      this.emit('error', error)
    }
  }

  /**
   * 下载更新
   */
  async downloadUpdate(): Promise<void> {
    if (!this.updateAvailable) {
      throw new Error('No update available')
    }

    if (this.isDownloading) {
      console.log('Already downloading update')
      return
    }

    try {
      this.isDownloading = true
      await autoUpdater.downloadUpdate()
    } catch (error) {
      console.error('Failed to download update:', error)
      this.isDownloading = false
      this.emit('error', error)
    }
  }

  /**
   * 安装更新
   */
  async installUpdate(): Promise<void> {
    if (!this.mainWindow) {
      throw new Error('Main window not set')
    }

    const response = await dialog.showMessageBox(this.mainWindow, {
      type: 'question',
      buttons: ['立即重启', '稍后重启'],
      defaultId: 0,
      message: '更新已下载完成',
      detail: '应用需要重启以完成更新。是否立即重启？'
    })

    if (response.response === 0) {
      autoUpdater.quitAndInstall()
    }
  }

  /**
   * 显示更新对话框
   */
  async showUpdateDialog(): Promise<boolean> {
    if (!this.updateAvailable || !this.mainWindow) {
      return false
    }

    const response = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      buttons: ['立即下载', '稍后提醒', '忽略此版本'],
      defaultId: 0,
      message: `发现新版本 ${this.updateAvailable.version}`,
      detail: this.updateAvailable.releaseNotes || '新版本包含功能改进和错误修复。'
    })

    switch (response.response) {
      case 0: // 立即下载
        await this.downloadUpdate()
        return true
      case 1: // 稍后提醒
        return false
      case 2: // 忽略此版本
        this.updateAvailable = null
        return false
      default:
        return false
    }
  }

  /**
   * 获取当前版本信息
   */
  getCurrentVersion(): string {
    return app.getVersion()
  }

  /**
   * 获取可用更新信息
   */
  getUpdateInfo(): UpdateInfo | null {
    return this.updateAvailable
  }

  /**
   * 检查是否正在检查更新
   */
  isCheckingForUpdate(): boolean {
    return this.isChecking
  }

  /**
   * 检查是否正在下载更新
   */
  isDownloadingUpdate(): boolean {
    return this.isDownloading
  }

  /**
   * 手动触发更新检查（带用户交互）
   */
  async checkForUpdatesWithDialog(): Promise<void> {
    try {
      await this.checkForUpdates()
      
      // 等待检查完成
      return new Promise((resolve) => {
        const onUpdateAvailable = () => {
          this.removeListener('update-not-available', onUpdateNotAvailable)
          this.removeListener('error', onError)
          this.showUpdateDialog().then(() => resolve())
        }

        const onUpdateNotAvailable = () => {
          this.removeListener('update-available', onUpdateAvailable)
          this.removeListener('error', onError)
          if (this.mainWindow) {
            dialog.showMessageBox(this.mainWindow, {
              type: 'info',
              message: '当前已是最新版本',
              detail: `当前版本: ${this.getCurrentVersion()}`
            })
          }
          resolve()
        }

        const onError = () => {
          this.removeListener('update-available', onUpdateAvailable)
          this.removeListener('update-not-available', onUpdateNotAvailable)
          resolve()
        }

        this.once('update-available', onUpdateAvailable)
        this.once('update-not-available', onUpdateNotAvailable)
        this.once('error', onError)
      })
    } catch (error) {
      console.error('Failed to check for updates with dialog:', error)
    }
  }
}
