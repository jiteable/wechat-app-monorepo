/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import type { ChatSession } from '@/api/chatSession/type'

const STORE_UPDATE_EVENT = 'contactStoreUpdated'

interface ContactState {
  selectedContact: ChatSession | null
  selectedUser: any | null // 专门用于联系人页面的用户选择
}

export const userContactStore = defineStore('contact', {
  state: (): ContactState => ({
    selectedContact: null,
    selectedUser: null
  }),
  actions: {
    setSelectedContact(contact: ChatSession) {
      this.selectedContact = contact
      this.syncToOtherWindows()
    },
    clearSelectedContact() {
      this.selectedContact = null
      this.syncToOtherWindows()
    },
    setSelectedUser(user: any) {
      this.selectedUser = user
      this.syncToOtherWindows()
    },
    clearSelectedUser() {
      this.selectedUser = null
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
      this.selectedUser = state.selectedUser
    }
  }
})
