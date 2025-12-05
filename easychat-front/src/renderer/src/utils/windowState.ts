import { ref } from 'vue'

// 创建全局响应式状态
export const windowState = {
  isAlwaysOnTop: ref(false),
  isMaximized: ref(false)
}

// 切换窗口置顶状态
export const toggleAlwaysOnTop = () => {
  windowState.isAlwaysOnTop.value = !windowState.isAlwaysOnTop.value

  // 通过 IPC 向主进程发送切换窗口置顶状态的消息
  if (window.api && typeof window.api.toggleAlwaysOnTop === 'function') {
    window.api.toggleAlwaysOnTop(windowState.isAlwaysOnTop.value)
  }
}

// 切换窗口最大化状态
export const toggleMaximize = () => {
  windowState.isMaximized.value = !windowState.isMaximized.value

  // 通过 IPC 向主进程发送切换最大化状态的消息
  if (window.api && typeof window.api.toggleMaximizeWindow === 'function') {
    window.api.toggleMaximizeWindow(windowState.isMaximized.value)
  }
}

// 最小化窗口
export const minimizeWindow = () => {
  // 通过 IPC 向主进程发送最小化窗口的消息
  if (window.api && typeof window.api.minimizeWindow === 'function') {
    window.api.minimizeWindow()
  }
}

// 关闭窗口
export const closeWindow = () => {
  // 通过 IPC 向主进程发送关闭窗口的消息
  if (window.api && typeof window.api.closeWindow === 'function') {
    window.api.closeWindow()
  }
}
