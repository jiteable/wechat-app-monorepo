/* eslint-disable @typescript-eslint/no-explicit-any */
import { userContactStore } from '@/store/userContactStore'

export const beforeEach = (to: any, from: any, next) => {
  // localStorage.clear();
  // 检查是否是从主窗口跳转到登录窗口
  if (to.path === '/login') {
    // 通知主进程需要切换到登录窗口
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send('navigate-to-login')
    }
    next()
    return
  }

  const token = localStorage.getItem('TOKEN') || ''
  if (!token) {
    next({
      path: '/login'
    })
    return
  }

  // 当进入/chat路由时，向ChatSession表中添加一条数据
  if (to.path === '/chat' || to.path.startsWith('/chat/')) {
    // 调用主进程方法添加数据
    if (window.api)  {
      console.log('waaaaa: ', window.api.getAllUnifiedMessages())
    }
  }

  // 当进入/contact路由时，打印ChatSession表中的所有数据
  if (to.path.startsWith('/contact')) {
    if (window.api) {
      window.api.getAllChatSessions().then((result) => {
        if (result.success) {
          console.log('ChatSessionaaaa表中的所有数据:', result.data)
        } else {
          console.error('error :', result.error)
        }
      })
    }
  }

  // 当从 /contact 路由离开时，清除选中的联系人
  if (from.path.startsWith('/contact') && !to.path.startsWith('/contact')) {
    const contactStore = userContactStore()
    contactStore.clearSelectedContact()
  }

  next()

  return
}

export function afterEach() { }
