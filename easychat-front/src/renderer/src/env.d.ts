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
  }
}
