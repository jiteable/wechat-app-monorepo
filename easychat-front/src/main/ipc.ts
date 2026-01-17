/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcMain, BrowserWindow } from 'electron'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'
import { initWs, sendMessage } from './wsClient'
import { downloadFile, checkAndOpenFile } from './fileDownloader'
import { databaseManager } from './db/db'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

let mainWindow: BrowserWindow | null = null
let loginWindow: BrowserWindow | null = null
let contactWindow: BrowserWindow | null = null
let addFriendWindow: BrowserWindow | null = null
let setWindow: BrowserWindow | null = null
let createGroupWindow: BrowserWindow | null = null
let chatMessageWindow: BrowserWindow | null = null
let setRemarkAndTagWindow: BrowserWindow | null = null
let scaleFactor = 1.0
let addFriendToGroupWindow: BrowserWindow | null = null
let imageViewWindow: BrowserWindow | null = null

let user_id: string | null = null

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
    resizable: false,
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

  // 当设置窗口打开时，清空ChatSession表中的数据
  databaseManager.clearChatSessions().catch((error) => {
    console.error('清空ChatSession表失败:', error)
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

export function createChatMessageWindow(icon: string, contactData?: any): void {
  // 如果聊天消息窗口已存在，直接显示并获得焦点
  if (chatMessageWindow) {
    chatMessageWindow.show()
    chatMessageWindow.focus()

    // 如果窗口已存在且提供了联系人数据，通过IPC发送联系人数据
    if (contactData) {
      chatMessageWindow.webContents.send('set-contact-data', contactData)
    }
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
    // 窗口准备好后发送联系人数据
    if (contactData) {
      chatMessageWindow!.webContents.send('set-contact-data', contactData)
    }
  })

  chatMessageWindow.on('closed', () => {
    chatMessageWindow = null
  })

  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    chatMessageWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/#/chat/messages')
  } else {
    chatMessageWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: '/chat/messages'
    })
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

export function createMainWindow(icon: string, userId: string): BrowserWindow {
  console.log('userId: ', userId)
  user_id = userId
  databaseManager.setCurrentUser(userId)
  // 检查数据库是否存在，如果不存在则创建
  if (!databaseManager.checkDatabaseExists(userId)) {
    databaseManager.createDatabase(userId)
  } else {
    // 即使数据库存在，也要确保所有表都已创建
    databaseManager.initializeTables()
  }

  // Create the browser window.
  const newMainWindow = new BrowserWindow({
    width: Math.round(1250 / scaleFactor),
    height: Math.round(750 / scaleFactor),
    minWidth: Math.round(800 / scaleFactor),
    minHeight: Math.round(750 / scaleFactor),
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

  // 监听窗口最大化和取消最大化事件
  newMainWindow.on('maximize', () => {
    newMainWindow.webContents.send('window-maximized')
  })

  newMainWindow.on('unmaximize', () => {
    newMainWindow.webContents.send('window-unmaximized')
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

export function createSetRemarkAndTagWindow(icon: string, contactData?: any): void {
  // 如果设置备注和标签窗口已存在，直接显示并获得焦点
  if (setRemarkAndTagWindow) {
    setRemarkAndTagWindow.show()
    setRemarkAndTagWindow.focus()

    // 如果窗口已存在且提供了联系人数据，通过IPC发送联系人数据
    if (contactData) {
      // 使用 setTimeout 确保数据在前端准备好后发送
      setRemarkAndTagWindow.webContents.send('set-contact-data', contactData)
    }
    return
  }

  setRemarkAndTagWindow = new BrowserWindow({
    width: Math.round(450 / scaleFactor),
    height: Math.round(750 / scaleFactor),
    frame: false,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 缓存联系人数据，直到前端确认准备好接收
  let pendingContactData = contactData

  setRemarkAndTagWindow.on('ready-to-show', () => {
    setRemarkAndTagWindow!.show()
  })

  // 监听前端准备就绪的信号
  const handleWebContentsReady = () => {
    if (pendingContactData) {
      // 延迟发送，确保前端监听器已设置
      setTimeout(() => {
        setRemarkAndTagWindow!.webContents.send('set-contact-data', pendingContactData)
        pendingContactData = null // 清除缓存的数据
      }, 50)
    }
  }

  // 添加 IPC 通信来接收前端准备就绪的信号
  const webContentsId = setRemarkAndTagWindow.webContents.id
  ipcMain.on('set-remark-and-tag-window-ready', (event) => {
    if (event.sender.id === webContentsId) {
      handleWebContentsReady()
    }
  })

  setRemarkAndTagWindow.on('closed', () => {
    // 移除事件监听器
    ipcMain.removeListener('set-remark-and-tag-window-ready', () => {})
    setRemarkAndTagWindow = null
  })

  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    setRemarkAndTagWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/#/set-remark-and-tag')
  } else {
    setRemarkAndTagWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: '/set-remark-and-tag'
    })
  }
}

export function createImageViewWindow(
  icon: string,
  imageUrl?: string,
  sessionId?: string,
  clickedImageIndex?: number
): void {
  // 如果图片查看窗口已存在，直接显示并获得焦点
  if (imageViewWindow) {
    imageViewWindow.show()
    imageViewWindow.focus()

    // 如果窗口已存在且提供了imageUrl，通过IPC发送图像URL数据
    if (imageUrl || sessionId || clickedImageIndex !== undefined) {
      imageViewWindow.webContents.send('set-image-data', { imageUrl, sessionId, clickedImageIndex })
    }
    return
  }

  imageViewWindow = new BrowserWindow({
    width: Math.round(800 / scaleFactor),
    height: Math.round(600 / scaleFactor),
    frame: false,
    show: false,
    autoHideMenuBar: true,
    resizable: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  imageViewWindow.on('ready-to-show', () => {
    imageViewWindow!.show()
    // 窗口准备好后发送图像URL数据
    if (imageUrl || sessionId || clickedImageIndex !== undefined) {
      imageViewWindow!.webContents.send('set-image-data', {
        imageUrl,
        sessionId,
        clickedImageIndex
      })
    }
  })

  imageViewWindow.on('closed', () => {
    imageViewWindow = null
  })

  // 构建URL，包括参数
  let url = process.env['ELECTRON_RENDERER_URL']
    ? `${process.env['ELECTRON_RENDERER_URL']}/#/image-view`
    : join(__dirname, '../renderer/index.html') + '#/image-view'

  if (sessionId && clickedImageIndex !== undefined) {
    url += `/${sessionId}/${clickedImageIndex}`
  }

  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    imageViewWindow.loadURL(url)
  } else {
    imageViewWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: `/image-view/${sessionId}/${clickedImageIndex}`
    })
  }
}

export function createAddFriendToGroupWindow(icon: string, GroupId?: string): void {
  // 如果添加好友到群组窗口已存在，直接显示并获得焦点
  if (addFriendToGroupWindow) {
    addFriendToGroupWindow.show()
    addFriendToGroupWindow.focus()

    // 如果窗口已存在且提供了GroupId，通过IPC发送GroupId数据
    if (GroupId) {
      addFriendToGroupWindow.webContents.send('set-group-id-data', GroupId)
    }
    return
  }

  addFriendToGroupWindow = new BrowserWindow({
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

  addFriendToGroupWindow.on('ready-to-show', () => {
    addFriendToGroupWindow!.show()
    // 窗口准备好后发送GroupId数据
    if (GroupId) {
      addFriendToGroupWindow!.webContents.send('set-group-id-data', GroupId)
    }
  })

  addFriendToGroupWindow.on('closed', () => {
    addFriendToGroupWindow = null
  })

  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // 修改URL以包含groupId参数
    const url = GroupId
      ? `${process.env['ELECTRON_RENDERER_URL']}/#/add-friend-to-group/${GroupId}`
      : `${process.env['ELECTRON_RENDERER_URL']}/#/add-friend-to-group`
    addFriendToGroupWindow.loadURL(url)
  } else {
    // 修改URL以包含groupId参数
    const options: { hash?: string; query?: { [key: string]: string } } = {
      hash: '/add-friend-to-group'
    }
    if (GroupId) {
      options.hash = `/add-friend-to-group/${GroupId}`
    }
    addFriendToGroupWindow.loadFile(join(__dirname, '../renderer/index.html'), options)
  }
}
export function setupIpcHandlers(icon: string): void {
  // 监听登录/注册表单切换事件并调整窗口大小
  ipcMain.on('login-form-toggle', (_event, isLogin) => {
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

  // // IPC handlers
  // ipcMain.on('check-token-and-switch-window', () => {
  //   // 注意：这里应该使用正确的localStorage访问方式
  //   // 在主进程中不能直接访问浏览器的localStorage
  //   // 应该通过其他方式获取token，比如从文件或内存中
  //   // 这里暂时保留原逻辑结构
  // })

  ipcMain.on('user-logged-in', (_event, userId) => {
    // Close login window and show main window
    if (loginWindow) {
      loginWindow.close()
      loginWindow = null
    }

    if (mainWindow) {
      mainWindow.show()
    } else {
      mainWindow = createMainWindow(icon, userId)
    }
  })

  // 设置备注和标签窗口相关事件
  ipcMain.on('open-set-remark-and-tag-window', (_event, contactData) => {
    console.log('Received open-set-remark-and-tag-window event with data:', contactData) // 添加日志
    createSetRemarkAndTagWindow(icon, contactData)
  })

  ipcMain.on('close-set-remark-and-tag-window', () => {
    if (setRemarkAndTagWindow) {
      setRemarkAndTagWindow.close()
      setRemarkAndTagWindow = null
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
    } else if (user_id) {
      mainWindow = createMainWindow(icon, user_id)
    } else {
      // 如果 user_id 为 null，可以考虑重新导航到登录界面或其他处理
      console.error('User ID is null, cannot create main window')
      // 可以选择重新打开登录窗口
      if (!loginWindow) {
        createLoginWindow(icon)
      }
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

  ipcMain.on('toggle-always-on-top', (_event, isAlwaysOnTop) => {
    if (mainWindow) {
      mainWindow.setAlwaysOnTop(isAlwaysOnTop)
    }
  })

  ipcMain.on('minimize-main-window', () => {
    if (mainWindow) {
      mainWindow.minimize()
    }
  })

  ipcMain.on('toggle-maximize-window', (_event, maximize) => {
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

  // 添加图片查看窗口相关事件
  ipcMain.on('open-image-view-window', (_event, imageUrl, sessionId, clickedImageIndex) => {
    createImageViewWindow(icon, imageUrl, sessionId, clickedImageIndex)
  })

  ipcMain.on('close-image-view-window', () => {
    if (imageViewWindow) {
      imageViewWindow.close()
      imageViewWindow = null
    }
  })

  ipcMain.on('minimize-image-view-window', () => {
    if (imageViewWindow) {
      imageViewWindow.minimize()
    }
  })

  ipcMain.on('toggle-maximize-image-view-window', (_event, maximize) => {
    if (imageViewWindow) {
      if (maximize) {
        imageViewWindow.maximize()
      } else {
        imageViewWindow.unmaximize()
      }
    }
  })

  ipcMain.on('toggle-always-on-top-image-view-window', (_event, isAlwaysOnTop) => {
    if (imageViewWindow) {
      imageViewWindow.setAlwaysOnTop(isAlwaysOnTop)
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
  ipcMain.on('open-chat-message-window', (_event, contactData) => {
    createChatMessageWindow(icon, contactData)
  })

  ipcMain.on('close-chat-message-window', () => {
    if (chatMessageWindow) {
      chatMessageWindow.close()
      chatMessageWindow = null
    }
  })

  // 新增：最小化聊天消息窗口
  ipcMain.on('minimize-chat-message-window', () => {
    if (chatMessageWindow) {
      chatMessageWindow.minimize()
    }
  })

  // WebSocket 相关事件
  ipcMain.on('init-websocket', (_event, userId) => {
    initWs(
      {
        userId: userId
      },
      {
        // Handle new messages received from the server
        handleNewMessage: (data) => {
          console.log('Received new message (main process):', data)
          // Forward the message to all open windows
          if (mainWindow) {
            console.log('Sending message to main window')
            mainWindow.webContents.send('new-message', data)
          }
          if (contactWindow) {
            console.log('Sending message to contacts window')
            contactWindow.webContents.send('new-message', data)
          }
          // Add support for chat message window
          if (chatMessageWindow) {
            console.log('Sending message to chat message window')
            chatMessageWindow.webContents.send('new-message', data)
          }
        },
        handleDeleteMessage: (data) => {
          console.log('Received delete message (main process):', data)
          // Forward the delete message to all open windows
          if (mainWindow) {
            console.log('Sending delete message to main window')
            mainWindow.webContents.send('delete-message', data)
          }
          if (contactWindow) {
            console.log('Sending delete message to contacts window')
            contactWindow.webContents.send('delete-message', data)
          }
          // Add support for chat message window
          if (chatMessageWindow) {
            console.log('Sending delete message to chat message window')
            chatMessageWindow.webContents.send('delete-message', data)
          }
        }
      }
    )
  })

  ipcMain.on('send-websocket-message', (_event, message) => {
    sendMessage(message)
  })

  // 用户信息相关事件
  ipcMain.on('set-user-info', (_event, userInfoData) => {
    userInfo = userInfoData
  })

  ipcMain.handle('get-user-info', () => {
    return userInfo
  })

  ipcMain.handle('download-file', async (_event, url, fileName, savePath) => {
    try {
      const result = await downloadFile(url, fileName, savePath)
      return { success: true, filePath: result }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage }
    }
  })

  // 修改打开聊天消息窗口的IPC处理程序
  ipcMain.on('open-chat-message-window', (_event, contactData) => {
    createChatMessageWindow(icon, contactData)
  })

  // 本地数据库
  // 添加ChatSession的IPC处理程序
  ipcMain.handle('add-chat-session', async (_, sessionData) => {
    try {
      // 检查sessionData是否存在
      if (!sessionData) {
        return { success: false, error: '会话数据不能为空' }
      }

      const result = await databaseManager.addChatSession(sessionData)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // 添加获取所有ChatSession的IPC处理程序
  ipcMain.handle('get-all-chat-sessions', async () => {
    try {
      const sessions = await databaseManager.getAllChatSessions()
      return { success: true, data: sessions }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // 添加清空ChatSession的IPC处理程序
  ipcMain.handle('clear-chat-sessions', async () => {
    try {
      await databaseManager.clearChatSessions()
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('sync-chat-sessions', async (_, sessions) => {
    try {
      for (const session of sessions) {
        await databaseManager.upsertChatSession(session)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('get-last-sync-time', async () => {
    try {
      // 可以在本地数据库中添加一个元数据表来跟踪同步时间
      const db = await open({
        filename: databaseManager.getDbPath(),
        driver: sqlite3.Database
      })

      // 创建元数据表（如果不存在）
      await db.exec(`
      CREATE TABLE IF NOT EXISTS SyncMetadata (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `)

      const result = await db.get(`SELECT value FROM SyncMetadata WHERE key = ?`, [
        'last_chat_session_sync'
      ])

      await db.close()

      return {
        success: true,
        lastSyncTime: result ? new Date(result.value) : null
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  })

  ipcMain.handle('set-last-sync-time', async (_, time) => {
    try {
      const db = await open({
        filename: databaseManager.getDbPath(),
        driver: sqlite3.Database
      })

      await db.run(
        `
      INSERT OR REPLACE INTO SyncMetadata (key, value) 
      VALUES (?, ?)
    `,
        ['last_chat_session_sync', time.toISOString()]
      )

      await db.close()
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  })

  // 添加UnifiedMessage的IPC处理程序
  ipcMain.handle('add-unified-message', async (_, messageData) => {
    try {
      const result = await databaseManager.addUnifiedMessage(messageData)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('get-all-unified-messages', async () => {
    try {
      const messages = await databaseManager.getAllUnifiedMessages()
      return { success: true, data: messages }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // 添加根据sessionId获取消息的IPC处理程序
  ipcMain.handle('get-messages-by-session-id', async (_, sessionId, page = 1, limit = 50) => {
    try {
      const result = await databaseManager.getMessagesBySessionId(sessionId, page, limit)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // ChatSessionUser相关处理
  ipcMain.handle('upsert-chat-session-user', async (_, userData) => {
    try {
      await databaseManager.upsertChatSessionUser(userData)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('delete-chat-session-user', async (_, id) => {
    try {
      await databaseManager.deleteChatSessionUser(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('update-chat-session-user', async (_, id, updateData) => {
    try {
      await databaseManager.updateChatSessionUser(id, updateData)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle(
    'update-chat-session-remark',
    async (_event, sessionId: string, remark: string) => {
      try {
        const userSession = await databaseManager.getChatSessionUser(sessionId)

        if (userSession && userSession.id) {
          await databaseManager.updateChatSessionUser(userSession.id, {
            customRemark: remark
          })

          return { success: true, message: '备注更新成功' }
        } else {
          return { success: false, message: '未找到对应的会话用户记录' }
        }
      } catch (error) {
        console.error('更新会话备注失败:', error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
      }
    }
  )
  // ... existin

  ipcMain.handle('get-chat-session-user', async (_, sessionId) => {
    try {
      const result = await databaseManager.getChatSessionUser(sessionId)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('get-chat-session-users-by-session-id', async (_, sessionId) => {
    try {
      const results = await databaseManager.getChatSessionUsersBySessionId(sessionId)
      return { success: true, data: results }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('update-unread-count', async (_, sessionId, unreadCount) => {
    try {
      await databaseManager.updateUnreadCount(sessionId, unreadCount)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('increment-unread-count', async (_, sessionId) => {
    try {
      await databaseManager.incrementUnreadCount(sessionId)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('reset-unread-count', async (_, sessionId) => {
    try {
      await databaseManager.resetUnreadCount(sessionId)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // 删除ChatSession的IPC处理程序
  ipcMain.handle('delete-chat-session', async (_, sessionId) => {
    try {
      await databaseManager.deleteChatSession(sessionId)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // 获取指定ChatSession的IPC处理程序
  ipcMain.handle('get-chat-session-by-id', async (_, sessionId) => {
    try {
      const session = await databaseManager.getChatSessionById(sessionId)
      return { success: true, data: session }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // 删除UnifiedMessage的IPC处理程序
  ipcMain.handle('delete-unified-message', async (_, id) => {
    try {
      await databaseManager.deleteUnifiedMessage(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // 删除File的IPC处理程序
  ipcMain.handle('delete-file', async (_, id) => {
    try {
      await databaseManager.deleteFile(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // 同步UnifiedMessage的IPC处理程序
  ipcMain.handle('sync-unified-messages', async (_, messages) => {
    try {
      await databaseManager.syncUnifiedMessages(messages)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // 同步ChatSessionUser的IPC处理程序
  ipcMain.handle('sync-chat-session-users', async (_, users) => {
    try {
      await databaseManager.syncChatSessionUsers(users)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('get-users-by-ids', async (_, userIds) => {
    try {
      const users = await databaseManager.getUsersByIds(userIds)
      return { success: true, data: users }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('delete-unified-messages-by-session-id', async (_, sessionId) => {
    try {
      await databaseManager.deleteUnifiedMessagesBySessionId(sessionId)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // 添加联系人更新转发到主窗口的处理程序
  ipcMain.on('updateContactInMainWindow', (_event, { contactId, updatedContact }) => {
    console.log('Received updateContactInMainWindow event with data:', {
      contactId,
      updatedContact
    })
    // 将联系人更新事件转发到主窗口
    if (mainWindow) {
      mainWindow.webContents.send('contactUpdated', { contactId, updatedContact })
    } else {
      console.warn('Main window not available to send contact update')
    }
  })

  ipcMain.handle('update-contact-remark', async (_, contactId, remark) => {
    try {
      // 首先尝试更新ChatSessionUser表中的remark字段
      const db = await open({
        filename: databaseManager.getDbPath(),
        driver: sqlite3.Database
      })

      // 更新ChatSessionUser表中的remark
      const result = await db.run(
        `UPDATE ChatSessionUser SET customRemark = ? WHERE contactId = ?`,
        [remark, contactId]
      )

      console.log('UPDATE ChatSessionUse: ', result)

      await db.close()

      return { success: true }
    } catch (error) {
      console.error('更新联系人备注失败:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // 添加保存文件对话框的处理程序
  ipcMain.handle('show-save-dialog', async (_, options) => {
    const { dialog } = await import('electron')
    const window = BrowserWindow.getFocusedWindow()

    if (!window) {
      // 如果没有聚焦的窗口，直接调用 showSaveDialog 而不传递父窗口
      const result = await dialog.showSaveDialog(options)
      return result
    }

    const result = await dialog.showSaveDialog(window, options)
    return result
  })

  // 添加下载文件到指定路径的处理程序
  ipcMain.handle('download-file-to-path', async (_, url, fileName, savePath) => {
    try {
      const result = await downloadFile(url, fileName, savePath)
      return { success: true, filePath: result }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage }
    }
  })

  // 添加checkAndOpenFile的IPC处理程序
  ipcMain.handle('check-and-open-file', async (_, fileName, basePath, dateStr) => {
    try {
      const result = await checkAndOpenFile(fileName, basePath, dateStr)
      return {
        exists: result.exists,
        message: result.message,
        canOpen: result.canOpen
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        exists: false,
        message: `检查文件时出错: ${errorMessage}`,
        canOpen: false
      }
    }
  })

  // 添加根据sessionId获取图片消息的IPC处理程序
  ipcMain.handle('get-image-messages-by-session-id', async (_, sessionId) => {
    try {
      const messages = await databaseManager.getImageMessagesBySessionId(sessionId)
      return { success: true, data: messages }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // 添加好友到群组窗口相关事件
  ipcMain.on('open-add-friend-to-group-window', (_event, groupId) => {
    createAddFriendToGroupWindow(icon, groupId)
  })

  ipcMain.on('close-add-friend-to-group-window', () => {
    if (addFriendToGroupWindow) {
      addFriendToGroupWindow.close()
      addFriendToGroupWindow = null
    }
  })
}
