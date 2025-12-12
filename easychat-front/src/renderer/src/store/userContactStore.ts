import { defineStore } from 'pinia'
import type { ChatSession } from '@/api/chatSession/type'

const STORE_UPDATE_EVENT = 'contactStoreUpdated'

interface ContactState {
  selectedContact: ChatSession | null
}

export const userContactStore = defineStore('contact', {
  state: (): ContactState => ({
    selectedContact: null
  }),
  actions: {
    setSelectedContact(contact: ChatSession) {
      this.selectedContact = contact

      // 同步到其他窗口
      this.syncToOtherWindows()
    },
    clearSelectedContact() {
      this.selectedContact = null

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
    syncFromOtherWindows(state: ContactState) {
      this.selectedContact = state.selectedContact
    }
  }
})
