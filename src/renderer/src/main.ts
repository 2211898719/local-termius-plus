import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import naive from 'naive-ui'
import ServerDashboard from './components/ServerDashboard.vue'
import Terminal from './components/Terminal.vue'

// 设置页面现在作为模态框在App.vue中使用，不再需要路由判断
const appComponent = App
const app = createApp(appComponent)

// 注册全局组件供 dockview 使用
app.component('dashboard', ServerDashboard)
app.component('terminal', Terminal)
app.use(naive)

// 初始化主题
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  const root = document.documentElement
  
  if (savedTheme) {
    root.classList.add(savedTheme === 'dark' ? 'dark-theme' : 'light-theme')
  } else {
    // 默认使用深色主题
    root.classList.add('dark-theme')
  }
}

// 初始化主题
initTheme()

app.mount('#app')
