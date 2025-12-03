import { defineStore } from 'pinia'

const STORE_UPDATE_EVENT = 'userStoreUpdated'

interface UserState {
  username: string
  avatar: string
  chatId: string
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    username: '',
    avatar: '',
    chatId: ''
  }),
  actions: {
    initialUserInfo(username: string, avatar: string, chatId: string) {
      this.username = username
      this.avatar = avatar
      this.chatId = chatId

      // 同步到其他窗口
      this.syncToOtherWindows()
    },

    /**
     * 更新指定设置项
     */
    updateSetting<K extends keyof UserState>(key: K, value: UserState[K]) {
      // 使用类型断言解决 TypeScript 类型检查问题
      (this.$state as UserState)[key] = value

      // 同步到其他窗口
      this.syncToOtherWindows()
    },

    /**
     * 批量更新设置项
     */
    updateSettings(settings: Partial<UserState>) {
      // 遍历设置对象并逐个更新属性，确保触发响应式更新
      for (const [key, value] of Object.entries(settings)) {
        (this as unknown as UserState)[key] = value
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
    syncFromOtherWindows(state: UserState) {
      Object.assign(this, state)
    }
  }
})

export const useContactStore = defineStore('contact', {
  state: () => ({
    selectedContact: null
  }),
  actions: {
    setSelectedContact(contact) {
      this.selectedContact = contact
    }
  }
})
