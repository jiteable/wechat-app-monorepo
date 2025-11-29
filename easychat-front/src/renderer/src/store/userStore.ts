import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    username: '',
    avatar: '',
    chatId: ''
  }),
  actions: {
    initialUserInfo(username, avatar, chatId) {
      this.username = username
      this.avatar = avatar
      this.chatId = chatId
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
