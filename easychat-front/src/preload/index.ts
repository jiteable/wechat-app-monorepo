/* eslint-disable @typescript-eslint/no-explicit-any */
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { UserInfo } from '../renderer/src/api/user/type'

// Custom APIs for renderer
const api = {
  // 窗口控制相关
  closeWindow: (): void => ipcRenderer.send('close-main-window'),
  minimizeWindow: (): void => ipcRenderer.send('minimize-main-window'),
  toggleMaximizeWindow: (maximize: boolean): void =>
    ipcRenderer.send('toggle-maximize-window', maximize),
  toggleAlwaysOnTop: (isAlwaysOnTop: boolean): void =>
    ipcRenderer.send('toggle-always-on-top', isAlwaysOnTop),

  // 登录相关
  userLoggedIn: (userId: string): void => ipcRenderer.send('user-logged-in', userId),
  navigateToLogin: (): void => ipcRenderer.send('navigate-to-login'),
  navigateToMain: (): void => ipcRenderer.send('navigate-to-main'),
  refreshMainWindow: (): void => ipcRenderer.send('refresh-main-window'),
  checkTokenAndSwitchWindow: (): void => ipcRenderer.send('check-token-and-switch-window'),
  toggleLoginForm: (isLogin: boolean): void => ipcRenderer.send('login-form-toggle', isLogin),
  closeLoginWindow: (): void => ipcRenderer.send('close-login-window'),

  // 通讯录窗口相关
  openContactWindow: (): void => ipcRenderer.send('open-contact-window'),
  closeContactWindow: (): void => ipcRenderer.send('close-contact-window'),
  minimizeContactWindow: (): void => ipcRenderer.send('minimize-contact-window'),

  // 添加好友窗口相关
  openAddFriendWindow: (): void => ipcRenderer.send('open-add-friend-window'),
  closeAddFriendWindow: (): void => ipcRenderer.send('close-add-friend-window'),

  // 设置窗口相关
  openSetWindow: (): void => ipcRenderer.send('open-set-window'),
  closeSetWindow: (): void => ipcRenderer.send('close-set-window'),

  // 创建群组窗口相关
  openCreateGroupWindow: (): void => ipcRenderer.send('open-create-group-window'),
  closeCreateGroupWindow: (): void => ipcRenderer.send('close-create-group-window'),

  // 聊天消息窗口相关
  openChatMessageWindow: (contactData?: any): void =>
    ipcRenderer.send('open-chat-message-window', contactData),
  closeChatMessageWindow: (): void => ipcRenderer.send('close-chat-message-window'),
  minimizeChatMessageWindow: (): void => ipcRenderer.send('minimize-chat-message-window'),

  // 设置备注和标签窗口相关
  openSetRemarkAndTagWindow: (contactData?: any): void =>
    ipcRenderer.send('open-set-remark-and-tag-window', contactData),
  closeSetRemarkAndTagWindow: (): void => ipcRenderer.send('close-set-remark-and-tag-window'),

  // 添加好友到群组窗口相关
  openAddFriendToGroupWindow: (GroupId: string): void =>
    ipcRenderer.send('open-add-friend-to-group-window', GroupId),
  closeAddFriendToGroupWindow: (): void => ipcRenderer.send('close-add-friend-to-group-window'),

  // 用户信息相关
  setUserInfo: (userInfo: UserInfo): void => ipcRenderer.send('set-user-info', userInfo),
  getUserInfo: (): Promise<UserInfo> => ipcRenderer.invoke('get-user-info'),

  // WebSocket 相关
  initWebSocket: (userId: string): void => ipcRenderer.send('init-websocket', userId),
  sendMessage: (message: any): void => ipcRenderer.send('send-websocket-message', message),
  onNewMessage: (callback: (data: any) => void): void => {
    ipcRenderer.on('new-message', (_event, data) => {
      console.log('收到新消息:', data)
      callback(data)
    })
  },
  onDeleteMessage: (callback: (data: any) => void): void => {
    ipcRenderer.on('delete-message', (_event, data) => {
      console.log('收到删除消息:', data)
      callback(data)
    })
  },
  removeNewMessageListener: (): void => {
    ipcRenderer.removeAllListeners('new-message')
  },
  removeDeleteMessageListener: (): void => {
    ipcRenderer.removeAllListeners('delete-message')
  },

  // 设置更新相关
  onSettingsUpdated: (callback: () => void): void => {
    ipcRenderer.on('settings-updated', () => callback())
  },
  removeSettingsUpdatedListener: (): void => {
    ipcRenderer.removeAllListeners('settings-updated')
  },

  // 文件下载相关
  downloadFile: (url: string, fileName: string, savePath: string): Promise<any> =>
    ipcRenderer.invoke('download-file', url, fileName, savePath),

  // 本地数据库相关
  addChatSession: (sessionData: any): Promise<any> =>
    ipcRenderer.invoke('add-chat-session', sessionData),
  getAllChatSessions: (): Promise<any> => ipcRenderer.invoke('get-all-chat-sessions'),
  clearChatSessions: (): Promise<any> => ipcRenderer.invoke('clear-chat-sessions'),
  syncChatSessions: (sessions: any[]): Promise<any> =>
    ipcRenderer.invoke('sync-chat-sessions', sessions),
  getLastSyncTime: (): Promise<any> => ipcRenderer.invoke('get-last-sync-time'),
  setLastSyncTime: (time: Date): Promise<any> => ipcRenderer.invoke('set-last-sync-time', time),
  addUnifiedMessage: (messageData: any): Promise<any> =>
    ipcRenderer.invoke('add-unified-message', messageData),
  getAllUnifiedMessages: (): Promise<any> => ipcRenderer.invoke('get-all-unified-messages'),
  getMessagesBySessionId: (sessionId: string, page?: number, limit?: number): Promise<any> =>
    ipcRenderer.invoke('get-messages-by-session-id', sessionId, page, limit),

  // ChatSessionUser相关
  upsertChatSessionUser: (userData: any): Promise<any> =>
    ipcRenderer.invoke('upsert-chat-session-user', userData),
  updateChatSessionUser: (id: string, updateData: any): Promise<any> =>
    ipcRenderer.invoke('update-chat-session-user', id, updateData),
  getChatSessionUser: (sessionId: string): Promise<any> =>
    ipcRenderer.invoke('get-chat-session-user', sessionId),
  getChatSessionUsersBySessionId: (sessionId: string): Promise<any> =>
    ipcRenderer.invoke('get-chat-session-users-by-session-id', sessionId),
  updateUnreadCount: (sessionId: string, unreadCount: number): Promise<any> =>
    ipcRenderer.invoke('update-unread-count', sessionId, unreadCount),
  incrementUnreadCount: (sessionId: string): Promise<any> =>
    ipcRenderer.invoke('increment-unread-count', sessionId),
  resetUnreadCount: (sessionId: string): Promise<any> =>
    ipcRenderer.invoke('reset-unread-count', sessionId),
  updateChatSessionRemark: (sessionId: string, remark: string): Promise<any> =>
    ipcRenderer.invoke('update-chat-session-remark', sessionId, remark),

  // 删除相关函数
  deleteChatSessionUser: (id: string): Promise<any> =>
    ipcRenderer.invoke('delete-chat-session-user', id),
  deleteChatSession: (sessionId: string): Promise<any> =>
    ipcRenderer.invoke('delete-chat-session', sessionId),
  deleteUnifiedMessage: (id: string): Promise<any> =>
    ipcRenderer.invoke('delete-unified-message', id),
  deleteUnifiedMessagesBySessionId: (sessionId: string): Promise<any> =>
    ipcRenderer.invoke('delete-unified-messages-by-session-id', sessionId),
  deleteFile: (id: string): Promise<any> => ipcRenderer.invoke('delete-file', id),
  syncUnifiedMessages: (messages: any[]): Promise<any> =>
    ipcRenderer.invoke('sync-unified-messages', messages),
  syncChatSessionUsers: (users: any[]): Promise<any> =>
    ipcRenderer.invoke('sync-chat-session-users', users),
  getUsersByIds: (userIds: string[]): Promise<any> =>
    ipcRenderer.invoke('get-users-by-ids', userIds),
  getChatSessionById: (sessionId: string): Promise<any> =>
    ipcRenderer.invoke('get-chat-session-by-id', sessionId),

  // 添加联系人更新相关
  updateContactInMainWindow: (contactData: { contactId: string; updatedContact: any }): void =>
    ipcRenderer.send('updateContactInMainWindow', contactData),

  // 添加更新联系人备注的API
  updateContactRemark: (contactId: string, remark: string): Promise<any> =>
    ipcRenderer.invoke('update-contact-remark', contactId, remark),

  // 联系人更新相关
  onContactUpdated: (callback: (data: any) => void): void => {
    ipcRenderer.on('contactUpdated', (_event, data) => {
      callback(data)
    })
  },
  removeContactUpdatedListener: (): void => {
    ipcRenderer.removeAllListeners('contactUpdated')
  },
  // 添加文件保存对话框功能
  showSaveDialog: (options: any): Promise<any> => ipcRenderer.invoke('show-save-dialog', options),

  downloadFileToPath: (url: string, fileName: string, savePath: string): Promise<any> =>
    ipcRenderer.invoke('download-file-to-path', url, fileName, savePath),
  checkAndOpenFile: (fileName: string, basePath: string, dateStr?: string): Promise<any> =>
    ipcRenderer.invoke('check-and-open-file', fileName, basePath, dateStr),

  // 添加监听sessionId数据的API
  onSetGroupData: (callback: (sessionId: string) => void): void => {
    ipcRenderer.on('set-group-id-data', (_event, sessionId) => {
      callback(sessionId)
    })
  }
}
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
