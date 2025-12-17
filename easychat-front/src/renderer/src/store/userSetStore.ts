import { defineStore } from 'pinia'

interface UserSetState {
  // 新消息通知是否有声音
  newMessageSound: boolean

  // 添加好友设置
  needVerificationToAddFriend: boolean // 加我为朋友时是否需要验证
  canBeSearchedByChatId: boolean // 是否能够通过chatId搜索到我
  canBeSearchedByEmail: boolean // 是否能够通过邮箱搜索到我
  canAddFromGroup: boolean // 是否能通过群聊添加我

  // 通用设置
  language: string // 语言设置 (zh: 中文, en: 英文)
  fontSize: number // 字体大小设置
  openFileInReadonlyMode: boolean // 是否以只读的方式打开聊天中的文件
  showWebSearchHistory: boolean // 是否显示网络搜索历史
  autoConvertVoiceToText: boolean // 是否将聊天语音自动转成文字
  StorageLocation: string // 文件下载路径
}

// 定义事件名称常量
const STORE_UPDATE_EVENT = 'userSetStoreUpdated'

export const useUserSetStore = defineStore('userSet', {
  state: (): UserSetState => ({
    // 新消息通知是否有声音
    newMessageSound: true,

    // 添加好友设置
    needVerificationToAddFriend: true, // 加我为朋友时是否需要验证
    canBeSearchedByChatId: true, // 是否能够通过chatId搜索到我
    canBeSearchedByEmail: true, // 是否能够通过邮箱搜索到我
    canAddFromGroup: true, // 是否能通过群聊添加我

    // 通用设置
    language: 'zh', // 语言设置 (zh: 中文, en: 英文)
    fontSize: 14, // 字体大小设置
    openFileInReadonlyMode: false, // 是否以只读的方式打开聊天中的文件
    showWebSearchHistory: true, // 是否显示网络搜索历史
    autoConvertVoiceToText: true, // 是否将聊天语音自动转成文字
    StorageLocation: 'D:\\EasyChat\\files\\'
  }),

  actions: {
    /**
     * 初始化用户设置
     */
    initializeSettings(settings: Partial<UserSetState>) {
      Object.assign(this, settings)
    },

    /**
     * 更新指定设置项
     */
    updateSetting<K extends keyof UserSetState>(key: K, value: UserSetState[K]) {
      // 使用类型断言解决 TypeScript 类型检查问题
      ;(this.$state as UserSetState)[key] = value

      // 同步到其他窗口
      this.syncToOtherWindows()
    },

    /**
     * 批量更新设置项
     */
    updateSettings(settings: Partial<UserSetState>) {
      // 遍历设置对象并逐个更新属性，确保触发响应式更新
      for (const [key, value] of Object.entries(settings)) {
        ;(this as unknown as UserSetState)[key] = value
      }

      // 同步到其他窗口
      this.syncToOtherWindows()
    },

    /**
     * 同步状态到其他窗口
     */
    syncToOtherWindows() {
      if (typeof window !== 'undefined' && window.localStorage) {
        // 将当前状态保存到localStorage
        localStorage.setItem(STORE_UPDATE_EVENT, JSON.stringify(this.$state))

        // 派发自定义事件，通知同域下的其他窗口
        window.dispatchEvent(
          new CustomEvent(STORE_UPDATE_EVENT, {
            detail: this.$state
          })
        )
      }
    },

    /**
     * 从其他窗口同步状态
     */
    syncFromOtherWindows(state: UserSetState) {
      Object.assign(this, state)
    }
  }
})
