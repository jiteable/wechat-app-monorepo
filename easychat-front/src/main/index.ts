import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
let loginWindow: BrowserWindow | null = null
let scaleFactor = 1.0

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: Math.round(900 / scaleFactor),
    height: Math.round(670 / scaleFactor),
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
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

function createLoginWindow(): void {
  // 如果登录窗口已存在，直接返回
  if (loginWindow) {
    loginWindow.show()
    return
  }

  // Create the login window.
  loginWindow = new BrowserWindow({
    width: Math.round(500 / scaleFactor),
    height: Math.round(360 / scaleFactor),
    frame: false,
    show: false,
    autoHideMenuBar: true,
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

  // 添加用于TOKEN检查的IPC处理器
  let tokenCheckWindow: BrowserWindow | null = null
  let tokenExists = false

  const tokenCheckHandler = (_event, hasToken) => {
    tokenExists = hasToken

    // 移除监听器
    ipcMain.removeListener('token-check-result', tokenCheckHandler)

    // 关闭临时窗口
    if (tokenCheckWindow) {
      tokenCheckWindow.destroy()
      tokenCheckWindow = null
    }

    // 根据TOKEN存在情况创建相应窗口
    if (tokenExists) {
      createWindow()
    } else {
      createLoginWindow()
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
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
