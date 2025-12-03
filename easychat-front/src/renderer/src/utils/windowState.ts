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
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('toggle-always-on-top', windowState.isAlwaysOnTop.value)
  }
}

// 切换窗口最大化状态
export const toggleMaximize = () => {
  windowState.isMaximized.value = !windowState.isMaximized.value

  // 通过 IPC 向主进程发送切换最大化状态的消息
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('toggle-maximize-window', windowState.isMaximized.value)
  }
}

// 最小化窗口
export const minimizeWindow = () => {
  // 通过 IPC 向主进程发送最小化窗口的消息
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('minimize-main-window')
  }
}

// 关闭窗口
export const closeWindow = () => {
  // 通过 IPC 向主进程发送关闭窗口的消息
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('close-main-window')
  }
}
