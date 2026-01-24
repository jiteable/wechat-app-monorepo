<template>
  <div class="audio-call-container drag">
    <div class="call-header">
      <h2>音频通话</h2>
    </div>

    <div class="call-content">
      <div class="avatar-wrapper">
        <img :src="avatar" alt="Avatar" class="avatar" />
      </div>

      <div class="contact-info">
        <p class="contact-name">{{ contactName }}</p>
        <p class="call-status">{{ callStatus }}</p>
      </div>
    </div>

    <!-- 接收方的控制按钮 -->
    <div v-if="!isCaller" class="call-controls no-drag">
      <button v-if="!callStarted" class="control-btn accept-btn" @click="acceptCall">
        <el-icon>
          <Phone />
        </el-icon>
      </button>

      <button class="control-btn decline-btn" @click="declineCall">
        <el-icon>
          <Close />
        </el-icon>
      </button>
    </div>

    <!-- 发送方的控制按钮 - 显示拒绝按钮，通话开始后显示结束按钮 -->
    <div v-else class="call-controls no-drag">
      <button v-if="!callStarted" class="control-btn decline-btn" @click="declineCall">
        <el-icon>
          <Close />
        </el-icon>
      </button>
      <button v-else class="control-btn decline-btn" @click="endCall">
        <el-icon>
          <PhoneFilled />
        </el-icon>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Phone, Close, PhoneFilled } from '@element-plus/icons-vue'
import { useSessionListStore } from '@/store/sessionListStore'
import { useRoute } from 'vue-router'

const route = useRoute()

const callStatus = ref('正在等待接听...')
const callStarted = ref(false)
const sessionId = ref('')
const avatar = ref('')
const contactName = ref('')
// 新增变量来区分发送方和接收方
const isCaller = ref(false) // true表示发送方，false表示接收方

const acceptCall = () => {
  callStatus.value = '通话中...'
  callStarted.value = true
  // 实现接受通话逻辑
}

const declineCall = () => {
  // 实现拒绝通话逻辑
  window.close()
}

const endCall = () => {
  // 结束通话
  window.close()
}

// 根据sessionId查找并设置联系人信息
const setContactInfo = () => {
  if (!sessionId.value) return

  const sessionListStore = useSessionListStore()
  const session = sessionListStore.sessions.find((s) => s.sessionId === sessionId.value)

  if (session) {
    avatar.value = session.avatar || ''
    contactName.value = session.displayName || session.name || ''
  } else {
    // 如果在sessionListStore中没找到，尝试从props获取的contactData中获取信息
    if (window.contactData) {
      avatar.value = window.contactData.avatar || ''
      contactName.value = window.contactData.name || window.contactData.displayName || ''
    } else {
      contactName.value = '未知联系人'
    }
  }
}

// 监听通话状态变化
onMounted(() => {
  // 初始化音频通话逻辑
  const routeSessionId = route.params.id || route.query.sessionId
  sessionId.value = routeSessionId || ''

  // 根据路由参数判断是发送方还是接收方
  isCaller.value = !!routeSessionId

  console.log('AudioCall.vue中从路由参数获取的sessionId:', sessionId.value)
  console.log('当前角色是发送方:', isCaller.value)

  // 打印sessionListStore中的数据
  const sessionListStore = useSessionListStore()
  console.log('AudioCall.vue中当前sessionListStore的数据:', sessionListStore.sessions)

  // 设置初始联系人信息
  setContactInfo()

  // 监听来自其他窗口的sessionListStore更新事件
  const handleStoreUpdate = (event) => {
    const customEvent = event
    sessionListStore.syncFromOtherWindows(customEvent.detail)
    // 重新设置联系人信息
    setContactInfo()
  }

  // 添加事件监听器
  window.addEventListener('sessionListStoreUpdated', handleStoreUpdate)

  // 监听localStorage变化以同步store状态
  const handleStorageChange = (event) => {
    if (event.key === 'sessionListStoreUpdated') {
      try {
        const state = JSON.parse(event.newValue)
        console.log('通过localStorage收到sessionListStore更新:', state)
        sessionListStore.syncFromOtherWindows(state)
        // 重新设置联系人信息
        setContactInfo()
      } catch (e) {
        console.error('解析sessionListStore状态失败:', e)
      }
    }
  }

  window.addEventListener('storage', handleStorageChange)

  // 监听sessionListStore的变化
  watch(
    () => sessionListStore.sessions,
    () => {
      setContactInfo()
    },
    { deep: true }
  )

  // 请求主进程发送最新的会话列表数据
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer
      .invoke('request-session-list')
      .then((sessionList) => {
        console.log('从主进程获取到的会话列表:', sessionList)
        if (sessionList && sessionList.length > 0) {
          sessionListStore.setSessions(sessionList)
          console.log('设置后AudioCall.vue中sessionListStore的数据:', sessionListStore.sessions)
          // 重新设置联系人信息
          setContactInfo()
        } else {
          console.log('从主进程获取的会话列表为空或未定义')
        }
      })
      .catch((err) => {
        console.error('请求会话列表失败:', err)
      })
  } else {
    console.warn('未找到window.electron.ipcRenderer，无法请求会话列表')
  }

  // 组件卸载时清理监听器
  onUnmounted(() => {
    window.removeEventListener('sessionListStoreUpdated', handleStoreUpdate)
    window.removeEventListener('storage', handleStorageChange)
  })
})

onUnmounted(() => {
  // 清理资源
})
</script>

<style scoped>
.audio-call-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #f5f5f5;
}

.call-header {
  width: 100%;
  text-align: center;
}

.call-header h2 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.call-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  justify-content: center;
}

.avatar-wrapper {
  margin-bottom: 20px;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  /* 修改为方形边角 */
  object-fit: cover;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.contact-info {
  text-align: center;
}

.contact-name {
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 10px 0;
  color: #333;
}

.call-status {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.call-controls {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 20px;
}

.call-controls-centered {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.control-btn {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  color: white;
  transition: transform 0.2s;
}

.control-btn:hover {
  transform: scale(1.1);
}

.accept-btn {
  background-color: #67c23a;
}

.decline-btn {
  background-color: #f56c6c;
}
</style>
