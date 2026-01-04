import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import {
  setupIpcHandlers,
  createLoginWindow,
  createMainWindow,
  setWindows,
  setScaleFactor
} from './ipc'

let mainWindow: BrowserWindow | null = null
const loginWindow: BrowserWindow | null = null
const contactWindow: BrowserWindow | null = null
const addFriendWindow: BrowserWindow | null = null
const setWindow: BrowserWindow | null = null
const createGroupWindow: BrowserWindow | null = null
const chatMessageWindow: BrowserWindow | null = null
let scaleFactor = 1.0
let userId: string | null = null

process.env.NODE_OPTIONS = '--experimental-fetch'
process.env.LANG = 'zh_CN.UTF-8'
process.env.LC_ALL = 'zh_CN.UTF-8'

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
  setScaleFactor(scaleFactor)

  // 设置窗口引用
  setWindows(
    mainWindow,
    loginWindow,
    contactWindow,
    addFriendWindow,
    setWindow,
    createGroupWindow,
    chatMessageWindow
  )

  // 监听刷新主窗口的请求
  ipcMain.on('refresh-main-window', () => {
    if (mainWindow) {
      mainWindow.reload()
    }
  })

  // 添加用于TOKEN检查的IPC处理器
  let tokenCheckWindow: BrowserWindow | null = null
  let tokenExists = false

  const tokenCheckHandler = (_event, hasToken, id) => {
    tokenExists = hasToken
    userId = id

    // 移除监听器
    ipcMain.removeListener('token-check-result', tokenCheckHandler)

    // 先创建目标窗口
    if (tokenExists) {
      mainWindow = createMainWindow(icon, userId!)
      setWindows(
        mainWindow,
        loginWindow,
        contactWindow,
        addFriendWindow,
        setWindow,
        createGroupWindow,
        chatMessageWindow
      )
    } else {
      createLoginWindow(icon)
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

  // 设置其他IPC处理程序
  setupIpcHandlers(icon)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      if (tokenExists) {
        mainWindow = createMainWindow(icon, userId!)
        setWindows(
          mainWindow,
          loginWindow,
          contactWindow,
          addFriendWindow,
          setWindow,
          createGroupWindow,
          chatMessageWindow
        )
      } else {
        createLoginWindow(icon)
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
