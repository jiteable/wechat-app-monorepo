import { defineStore } from 'pinia'
import type { ChatSession } from '@/api/chatSession/type'

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
    },
    clearSelectedContact() {
      this.selectedContact = null
    }
  }
})
