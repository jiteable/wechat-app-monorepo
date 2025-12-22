/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  api: {
    // 窗口控制相关
    toggleAlwaysOnTop: (isAlwaysOnTop: boolean) => void
    toggleMaximizeWindow: (maximize: boolean) => void
    minimizeWindow: () => void
    closeWindow: () => void

    // 登录相关
    userLoggedIn: () => void
    navigateToLogin: () => void
    navigateToMain: () => void
    refreshMainWindow: () => void
    checkTokenAndSwitchWindow: () => void
    toggleLoginForm: (isLogin: boolean) => void

    // 通讯录窗口相关
    openContactWindow: () => void
    closeContactWindow: () => void
    minimizeContactWindow: () => void

    // 添加好友窗口相关
    openAddFriendWindow: () => void
    closeAddFriendWindow: () => void
    minimizeAddFriendWindow: () => void

    // 设置窗口相关
    openSetWindow: () => void
    closeSetWindow: () => void

    // 创建群组窗口相关
    openCreateGroupWindow: () => void
    closeCreateGroupWindow: () => void

    // 聊天消息窗口相关
    openChatMessageWindow: () => void
    closeChatMessageWindow: () => void
    minimizeChatMessageWindow: () => void

    // 用户信息相关
    setUserInfo: (userInfo: import('../renderer/src/api/user/type').UserInfo) => void
    getUserInfo: () => Promise<import('../renderer/src/api/user/type').UserInfo>

    // WebSocket 相关
    initWebSocket: (userId: string) => void
    sendMessage: (message: any) => void
    onNewMessage: (callback: (data: any) => void) => void
    removeNewMessageListener: () => void

    // 设置更新相关
    onSettingsUpdated: (callback: () => void) => void
    removeSettingsUpdatedListener: () => void

    // 文件下载相关
    downloadFile: (url: string, fileName: string, savePath: string) => Promise<any>

    //本地数据库相关
    addChatSession: () => Promise<any>
    getAllChatSessions: (userId: string) => Promise<any>
    clearChatSessions: () => Promise<any>
    syncChatSessions: (sessions: any[]) => Promise<any>
    getLastSyncTime: () => Promise<any>
    setLastSyncTime: (time: Date) => Promise<any>
    addUnifiedMessage: (messageData: any) => Promise<any>
    getAllUnifiedMessages: () => Promise<any>
    getMessagesBySessionId: (sessionId: string, page?: number, limit?: number) => Promise<any>

    // ChatSessionUser相关
    upsertChatSessionUser: (userData: Partial<ChatSessionUser>) => Promise<any>
    updateChatSessionUser: (id: string, updateData: Partial<ChatSessionUser>) => Promise<any>
    getChatSessionUser: (sessionId: string, userId: string) => Promise<any>
    getChatSessionUsersBySessionId: (sessionId: string) => Promise<any>
    updateUnreadCount: (sessionId: string, userId: string, unreadCount: number) => Promise<any>
    incrementUnreadCount: (sessionId: string, userId: string) => Promise<any>
    resetUnreadCount: (sessionId: string, userId: string) => Promise<any>

    // 删除相关函数
    deleteChatSessionUser: (id: string) => Promise<any>
    deleteChatSession: (sessionId: string) => Promise<any>
    deleteUnifiedMessage: (id: string) => Promise<any>
    deleteUnifiedMessagesBySessionId: (sessionId: string) => Promise<any>
    deleteFile: (id: string) => Promise<any>
    // 同步相关函数
    syncUnifiedMessages: (messages: any[]) => Promise<any>
    syncChatSessionUsers: (users: any[]) => Promise<any>
    getUsersByIds: (userIds: string[]) => Promise<any>
    getChatSessionById: (sessionId: string) => Promise<any>
  }
}
