import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
let loginWindow: BrowserWindow | null = null
let contactWindow: BrowserWindow | null = null
let addFriendWindow: BrowserWindow | null = null
let setWindow: BrowserWindow | null = null
let createGroupWindow: BrowserWindow | null = null
let scaleFactor = 1.0

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: Math.round(1250 / scaleFactor),
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

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.on('closed', () => {
    console.log('mainWindow Close')
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createContactWindow(): void {
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

function createAddFriendWindow(): void {
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

function createSetWindow(): void {
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

function createGroupWindowFunc(): void {
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

function createLoginWindow(): void {
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 获取 scaleFactor
  scaleFactor = screen.getPrimaryDisplay().scaleFactor

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
    const token = localStorage.getItem('TOKEN')

    if (!token && mainWindow) {
      // Close main window and open login window
      mainWindow.hide()
      createLoginWindow()
    }
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
      createWindow()
    }
  })

  ipcMain.on('navigate-to-login', () => {
    if (mainWindow) {
      mainWindow.hide()
    }

    // 检查是否已存在登录窗口，如果不存在则创建
    if (!loginWindow) {
      createLoginWindow()
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
      createWindow()
    }
  })

  // 监听刷新主窗口的请求
  ipcMain.on('refresh-main-window', () => {
    if (mainWindow) {
      mainWindow.reload()
    }
  })

  // 添加用于TOKEN检查的IPC处理器
  let tokenCheckWindow: BrowserWindow | null = null
  let tokenExists = false

  const tokenCheckHandler = (_event, hasToken) => {
    tokenExists = hasToken

    // 移除监听器
    ipcMain.removeListener('token-check-result', tokenCheckHandler)

    // 先创建目标窗口
    if (tokenExists) {
      createWindow()
    } else {
      createLoginWindow()
    }

    // 然后关闭临时窗口
    if (tokenCheckWindow) {
      tokenCheckWindow.destroy()
      tokenCheckWindow = null
    }
  }

  // 创建用于检查TOKEN的隐藏窗口
  tokenCheckWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 监听TOKEN检查结果
  ipcMain.on('token-check-result', tokenCheckHandler)

  // 加载TOKEN检查页面
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    tokenCheckWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/#/check-token')
  } else {
    tokenCheckWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/check-token' })
  }

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

  //通讯录窗口
  ipcMain.on('toggle-maximize-window', (event, maximize) => {
    if (mainWindow) {
      if (maximize) {
        mainWindow.maximize()
      } else {
        mainWindow.unmaximize()
      }
    }
  })

  ipcMain.on('open-contact-window', () => {
    createContactWindow()
  })

  ipcMain.on('open-contact-window', () => {
    createContactWindow()
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

  ipcMain.on('open-add-friend-window', () => {
    createAddFriendWindow()
  })

  ipcMain.on('minimize-add-friend-window', () => {
    if (addFriendWindow) {
      addFriendWindow.minimize()
    }
  })

  ipcMain.on('close-add-friend-window', () => {
    if (addFriendWindow) {
      addFriendWindow.close()
      addFriendWindow = null
    }
  })

  // 打开设置窗口
  ipcMain.on('open-set-window', () => {
    createSetWindow()
  })

  ipcMain.on('close-set-window', () => {
    if (setWindow) {
      setWindow.close()
      setWindow = null
    }
  })

  ipcMain.on('close-set-window', () => {
    if (setWindow) {
      setWindow.close()
      setWindow = null
    }
  })

  ipcMain.on('open-create-group-window', () => {
    createGroupWindowFunc()
  })

  ipcMain.on('close-create-group-window', () => {
    if (createGroupWindow) {
      createGroupWindow.close()
      createGroupWindow = null
    }
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      if (tokenExists) {
        createWindow()
      } else {
        createLoginWindow()
      }
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  console.log('quit')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
