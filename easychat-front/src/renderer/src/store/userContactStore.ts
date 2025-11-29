import { defineStore } from 'pinia'

export const userContactStore = defineStore('contact', {
  state: () => ({
    selectedContact: null
  }),
  actions: {
    setSelectedContact(contact) {
      this.selectedContact = contact
    }
  }
})
