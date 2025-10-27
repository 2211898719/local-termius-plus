import { useMessage } from 'naive-ui'

// 全局消息管理
let globalMessage: any = null

export const useGlobalMessage = () => {
  if (!globalMessage) {
    try {
      globalMessage = useMessage()
    } catch (error) {
      console.warn('Failed to get global message instance:', error)
      // 提供一个 fallback 函数
      globalMessage = {
        success: (msg: string) => {
          console.log('SUCCESS:', msg)
          // 可以在这里添加自定义的 UI 提示
          showCustomMessage('success', msg)
        },
        error: (msg: string) => {
          console.error('ERROR:', msg)
          showCustomMessage('error', msg)
        },
        info: (msg: string) => {
          console.info('INFO:', msg)
          showCustomMessage('info', msg)
        }
      }
    }
  }
  return globalMessage
}

// 自定义消息显示函数
const showCustomMessage = (type: 'success' | 'error' | 'info', message: string) => {
  // 创建一个简单的自定义消息提示
  const messageEl = document.createElement('div')
  messageEl.className = `custom-message custom-message-${type}`
  messageEl.textContent = message
  messageEl.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-size: 14px;
    z-index: 9999;
    max-width: 400px;
    word-wrap: break-word;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;
  `
  
  // 根据类型设置背景色
  switch (type) {
    case 'success':
      messageEl.style.backgroundColor = '#18a058'
      break
    case 'error':
      messageEl.style.backgroundColor = '#d03050'
      break
    case 'info':
      messageEl.style.backgroundColor = '#2080f0'
      break
  }
  
  // 添加到页面
  document.body.appendChild(messageEl)
  
  // 3秒后自动移除
  setTimeout(() => {
    if (messageEl.parentNode) {
      messageEl.style.animation = 'slideOut 0.3s ease-in'
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.parentNode.removeChild(messageEl)
        }
      }, 300)
    }
  }, 3000)
}

// 添加 CSS 动画
const style = document.createElement('style')
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`
document.head.appendChild(style)
