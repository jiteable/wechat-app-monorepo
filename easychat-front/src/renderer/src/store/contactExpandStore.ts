import { defineStore } from 'pinia'

const STORE_UPDATE_EVENT = 'contactExpandStoreUpdated'

interface ContactExpandState {
  groupExpanded: boolean
  contactsExpanded: boolean
}

export const useContactExpandStore = defineStore('contactExpand', {
  state: (): ContactExpandState => ({
    groupExpanded: false,
    contactsExpanded: false
  }),
  actions: {
    setExpandStates(states: { groupExpanded: boolean; contactsExpanded: boolean }) {
      this.$patch({ ...this.$state, ...states })
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
    syncFromOtherWindows(state: ContactExpandState) {
      this.groupExpanded = state.groupExpanded
      this.contactsExpanded = state.contactsExpanded
    }
  }
})
