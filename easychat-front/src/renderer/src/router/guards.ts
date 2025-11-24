// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const beforeEach = (to: any, _from, next) => {
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

  return
}

export function afterEach() { }
