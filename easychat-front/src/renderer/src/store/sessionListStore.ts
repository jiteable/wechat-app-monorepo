import { defineStore } from 'pinia'

const SESSION_LIST_STORE_UPDATE_EVENT = 'sessionListStoreUpdated'

export interface SessionItem {
  userSessionId: string
  avatar: string
  displayName: string
  name: string
}

export interface SessionListState {
  sessions: SessionItem[]
}

export const useSessionListStore = defineStore('sessionList', {
  state: (): SessionListState => ({
    sessions: []
  }),

  getters: {
    getSessionById: (state) => (userSessionId: string) => {
      return state.sessions.find(session => session.userSessionId === userSessionId)
    },

    getSessionByName: (state) => (name: string) => {
      return state.sessions.find(session => session.name === name)
    }
  },

  actions: {
    /**
     * 设置会话列表
     */
    setSessions(sessions: SessionItem[]) {
      this.sessions = sessions
      this.syncToOtherWindows()
    },

    /**
     * 添加或更新单个会话
     */
    upsertSession(session: SessionItem) {
      const index = this.sessions.findIndex(s => s.userSessionId === session.userSessionId)
      if (index !== -1) {
        // 更新现有会话
        this.sessions[index] = { ...this.sessions[index], ...session }
      } else {
        // 添加新会话
        this.sessions.push(session)
      }
      this.syncToOtherWindows()
    },

    /**
     * 根据 userSessionId 删除会话
     */
    removeSession(userSessionId: string) {
      this.sessions = this.sessions.filter(session => session.userSessionId !== userSessionId)
      this.syncToOtherWindows()
    },

    /**
     * 清空所有会话
     */
    clearSessions() {
      this.sessions = []
      this.syncToOtherWindows()
    },

    /**
     * 同步状态到其他窗口
     */
    syncToOtherWindows() {
      if (typeof window !== 'undefined' && window.localStorage) {
        // 将当前状态保存到localStorage
        localStorage.setItem(SESSION_LIST_STORE_UPDATE_EVENT, JSON.stringify(this.$state))

        // 派发自定义事件，通知同域下的其他窗口
        window.dispatchEvent(
          new CustomEvent(SESSION_LIST_STORE_UPDATE_EVENT, {
            detail: this.$state
          })
        )
      }
    },

    /**
     * 从其他窗口同步状态
     */
    syncFromOtherWindows(state: SessionListState) {
      this.sessions = state.sessions || []
    }
  }
})
