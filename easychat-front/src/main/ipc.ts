/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcMain, BrowserWindow } from 'electron'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'
import { initWs, sendMessage } from './wsClient'

let mainWindow: BrowserWindow | null = null
let loginWindow: BrowserWindow | null = null
let contactWindow: BrowserWindow | null = null
let addFriendWindow: BrowserWindow | null = null
let setWindow: BrowserWindow | null = null
let createGroupWindow: BrowserWindow | null = null
let chatMessageWindow: BrowserWindow | null = null
let scaleFactor = 1.0

// 存储用户信息
let userInfo: any = null

// 窗口创建函数
export function setWindows(
  mainWin: BrowserWindow | null,
  loginWin: BrowserWindow | null,
  contactWin: BrowserWindow | null,
  addFriendWin: BrowserWindow | null,
  setWin: BrowserWindow | null,
  createGroupWin: BrowserWindow | null,
  chatMessageWin: BrowserWindow | null
): void {
  mainWindow = mainWin
  loginWindow = loginWin
  contactWindow = contactWin
  addFriendWindow = addFriendWin
  setWindow = setWin
  createGroupWindow = createGroupWin
  chatMessageWindow = chatMessageWin
}

export function setScaleFactor(factor: number): void {
  scaleFactor = factor
}

// 窗口操作辅助函数
export function createContactWindow(icon: string): void {
  // 如果通讯录窗口已存在，直接显示并获得焦点
  if (contactWindow) {
    contactWindow.show()
    contactWindow.focus()
    return
  }

  // Create the contact management window.
  contactWindow = new BrowserWindow({
    width: Math.round(875 / scaleFactor),
    height: Math.round(575 / scaleFactor),
    frame: false,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  contactWindow.on('ready-to-show', () => {
    contactWindow!.show()
  })

  contactWindow.on('closed', () => {
    contactWindow = null
  })

  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    contactWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/#/contacts')
  } else {
    contactWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/contacts' })
  }
}

export function createAddFriendWindow(icon: string): void {
  // 如果添加好友窗口已存在，直接显示并获得焦点
  if (addFriendWindow) {
    addFriendWindow.show()
    addFriendWindow.focus()
    return
  }

  addFriendWindow = new BrowserWindow({
    width: Math.round(410 / scaleFactor),
    height: Math.round(568 / scaleFactor),
    frame: false,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  addFriendWindow.on('ready-to-show', () => {
    addFriendWindow!.show()
  })

  addFriendWindow.on('closed', () => {
    addFriendWindow = null
  })

  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    addFriendWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/#/chat/addfriend')
  } else {
    addFriendWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/chat/addfriend' })
  }
}

export function createSetWindow(icon: string): void {
  // 如果设置窗口已存在，直接显示并获得焦点
  if (setWindow) {
    setWindow.show()
    setWindow.focus()
    return
  }

  setWindow = new BrowserWindow({
    width: Math.round(688 / scaleFactor),
    height: Math.round(850 / scaleFactor),
    frame: false,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  setWindow.on('ready-to-show', () => {
    setWindow!.show()
  })

  setWindow.on('closed', () => {
    setWindow = null
  })

  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    setWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/#/settings')
  } else {
    setWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/settings' })
  }
}

export function createGroupWindowFunc(icon: string): void {
  // 如果创建群组窗口已存在，直接显示并获得焦点
  if (createGroupWindow) {
    createGroupWindow.show()
    createGroupWindow.focus()
    return
  }

  createGroupWindow = new BrowserWindow({
    width: Math.round(880 / scaleFactor),
    height: Math.round(680 / scaleFactor),
    frame: false,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  createGroupWindow.on('ready-to-show', () => {
    createGroupWindow!.show()
  })

  createGroupWindow.on('closed', () => {
    createGroupWindow = null
  })

  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    createGroupWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/#/create-group')
  } else {
    createGroupWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/create-group' })
  }
}

export function createChatMessageWindow(icon: string): void {
  // 如果聊天消息窗口已存在，直接显示并获得焦点
  if (chatMessageWindow) {
    chatMessageWindow.show()
    chatMessageWindow.focus()
    return
  }

  chatMessageWindow = new BrowserWindow({
    width: Math.round(688 / scaleFactor),
    height: Math.round(875 / scaleFactor),
    frame: false,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  chatMessageWindow.on('ready-to-show', () => {
    chatMessageWindow!.show()
  })

  chatMessageWindow.on('closed', () => {
    chatMessageWindow = null
  })

  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    chatMessageWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/#/chat/messages')
  } else {
    chatMessageWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/chat/messages' })
  }
}

export function createLoginWindow(icon: string): void {
  // 如果登录窗口已存在，直接显示
  if (loginWindow) {
    loginWindow.show()
    return
  }

  // Create the login window.
  loginWindow = new BrowserWindow({
    width: Math.round(400 / scaleFactor),
    height: Math.round(360 / scaleFactor),
    frame: false,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  loginWindow.on('ready-to-show', () => {
    loginWindow!.show()
  })

  loginWindow.on('closed', () => {
    loginWindow = null
  })

  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    loginWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/#/login')
  } else {
    loginWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/login' })
  }
}

export function createMainWindow(icon: string): BrowserWindow {
  // Create the browser window.
  const newMainWindow = new BrowserWindow({
    width: Math.round(1250 / scaleFactor),
    height: Math.round(750 / scaleFactor),
    frame: false,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  newMainWindow.on('ready-to-show', () => {
    newMainWindow.show()
  })

  newMainWindow.on('closed', () => {
    console.log('mainWindow Close')
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    newMainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    newMainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return newMainWindow
}

export function setupIpcHandlers(icon: string): void {
  // 监听登录/注册表单切换事件并调整窗口大小
  ipcMain.on('login-form-toggle', (event, isLogin) => {
    console.log(isLogin)
    if (loginWindow) {
      const [currentWidth, currentHeight] = loginWindow.getSize()
      const newHeight = isLogin ? Math.round(360 / scaleFactor) : Math.round(600 / scaleFactor)
      console.log('newHeight: ', newHeight)
      console.log('currentHeight: ', currentHeight)

      // 强制设置窗口边界来确保窗口大小正确
      const currentPosition = loginWindow.getPosition()
      loginWindow.setBounds(
        {
          x: currentPosition[0],
          y: currentPosition[1],
          width: currentWidth,
          height: newHeight
        },
        false
      )

      // 强制刷新窗口
      loginWindow.setSize(currentWidth, newHeight, false)
    }
  })

  ipcMain.on('close-login-window', () => {
    if (loginWindow) {
      loginWindow.close()
      loginWindow = null
    }
  })

  // IPC handlers
  ipcMain.on('check-token-and-switch-window', () => {
    // 注意：这里应该使用正确的localStorage访问方式
    // 在主进程中不能直接访问浏览器的localStorage
    // 应该通过其他方式获取token，比如从文件或内存中
    // 这里暂时保留原逻辑结构
  })

  ipcMain.on('user-logged-in', () => {
    // Close login window and show main window
    if (loginWindow) {
      loginWindow.close()
      loginWindow = null
    }

    if (mainWindow) {
      mainWindow.show()
    } else {
      mainWindow = createMainWindow(icon)
    }
  })

  ipcMain.on('navigate-to-login', () => {
    if (mainWindow) {
      // 关闭主窗口而不是隐藏它
      mainWindow.close()
      mainWindow = null
    }

    // 检查是否已存在登录窗口，如果不存在则创建
    if (!loginWindow) {
      createLoginWindow(icon)
    } else {
      // 如果已存在，则直接显示
      loginWindow.show()
    }
  })

  ipcMain.on('navigate-to-main', () => {
    if (loginWindow) {
      loginWindow.close()
      loginWindow = null
    }

    if (mainWindow) {
      mainWindow.show()
    } else {
      mainWindow = createMainWindow(icon)
    }
  })

  // 监听刷新主窗口的请求
  ipcMain.on('refresh-main-window', () => {
    if (mainWindow) {
      // 刷新主窗口
      mainWindow.reload()
    }
  })

  // 监听设置更新事件
  ipcMain.on('settings-updated', () => {
    // 通知主窗口设置已更新，但不强制刷新整个页面
    if (mainWindow) {
      mainWindow.webContents.send('settings-updated')
    }
  })

  // 主窗口控制相关事件
  ipcMain.on('close-main-window', () => {
    if (mainWindow) {
      mainWindow.close()
      mainWindow = null
    }
  })

  ipcMain.on('toggle-always-on-top', (event, isAlwaysOnTop) => {
    if (mainWindow) {
      mainWindow.setAlwaysOnTop(isAlwaysOnTop)
    }
  })

  ipcMain.on('minimize-main-window', () => {
    if (mainWindow) {
      mainWindow.minimize()
    }
  })

  ipcMain.on('toggle-maximize-window', (event, maximize) => {
    if (mainWindow) {
      if (maximize) {
        mainWindow.maximize()
      } else {
        mainWindow.unmaximize()
      }
    }
  })

  // 通讯录窗口相关事件
  ipcMain.on('open-contact-window', () => {
    createContactWindow(icon)
  })

  ipcMain.on('minimize-contact-window', () => {
    if (contactWindow) {
      contactWindow.minimize()
    }
  })

  ipcMain.on('close-contact-window', () => {
    if (contactWindow) {
      contactWindow.close()
      contactWindow = null
    }
  })

  // 添加好友窗口相关事件
  ipcMain.on('open-add-friend-window', () => {
    createAddFriendWindow(icon)
  })

  ipcMain.on('close-add-friend-window', () => {
    if (addFriendWindow) {
      addFriendWindow.close()
      addFriendWindow = null
    }
  })

  // 设置窗口相关事件
  ipcMain.on('open-set-window', () => {
    createSetWindow(icon)
  })

  ipcMain.on('close-set-window', () => {
    if (setWindow) {
      setWindow.close()
      setWindow = null
    }
  })

  // 创建群组窗口相关事件
  ipcMain.on('open-create-group-window', () => {
    createGroupWindowFunc(icon)
  })

  ipcMain.on('close-create-group-window', () => {
    if (createGroupWindow) {
      createGroupWindow.close()
      createGroupWindow = null
    }
  })

  // 聊天消息窗口相关事件
  ipcMain.on('open-chat-message-window', () => {
    createChatMessageWindow(icon)
  })

  ipcMain.on('close-chat-message-window', () => {
    if (chatMessageWindow) {
      chatMessageWindow.close()
      chatMessageWindow = null
    }
  })

  // WebSocket 相关事件
  ipcMain.on('init-websocket', (event, userId) => {
    initWs(
      {
        userId: userId
      },
      {
        // 处理从服务器接收的新消息
        handleNewMessage: (data) => {
          console.log('收到新消息:', data)
          // 将消息转发给所有打开的窗口
          if (mainWindow) {
            mainWindow.webContents.send('new-message', data)
          }
          if (contactWindow) {
            contactWindow.webContents.send('new-message', data)
          }
          // 可以为其他窗口也添加消息转发
        }
      }
    )
  })

  ipcMain.on('send-websocket-message', (event, message) => {
    sendMessage(message)
  })

  // 用户信息相关事件
  ipcMain.on('set-user-info', (event, userInfoData) => {
    userInfo = userInfoData
  })

  ipcMain.handle('get-user-info', () => {
    return userInfo
  })
}
