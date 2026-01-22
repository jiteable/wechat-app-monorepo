<template>
  <div class="audio-call-container">
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

    <!-- 通话控制按钮 -->
    <div v-if="!callStarted" class="call-controls">
      <button class="control-btn accept-btn" @click="acceptCall">
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

    <!-- 通话开始后的关闭按钮 -->
    <div v-else class="call-controls-centered">
      <button class="control-btn decline-btn" @click="endCall">
        <el-icon>
          <PhoneFilled />
        </el-icon>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Phone, Close, PhoneFilled } from '@element-plus/icons-vue'
import { useSessionListStore } from '@/store/sessionListStore' // 导入sessionListStore

const props = defineProps({
  contactName: {
    type: String,
    default: '联系人'
  },
  avatar: {
    type: String,
    default: ''
  }
})

const callStatus = ref('正在等待接听...')
const callStarted = ref(false)

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

// 监听通话状态变化
onMounted(() => {
  // 初始化音频通话逻辑

  // 打印sessionListStore中的数据
  const sessionListStore = useSessionListStore()
  console.log('AudioCall.vue中当前sessionListStore的数据:', sessionListStore.sessions)

  // 监听来自其他窗口的sessionListStore更新事件
  const handleStoreUpdate = (event) => {
    const customEvent = event
    sessionListStore.syncFromOtherWindows(customEvent.detail)
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
      } catch (e) {
        console.error('解析sessionListStore状态失败:', e)
      }
    }
  }

  window.addEventListener('storage', handleStorageChange)

  // 请求主进程发送最新的会话列表数据
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer
      .invoke('request-session-list')
      .then((sessionList) => {
        console.log('从主进程获取到的会话列表:', sessionList)
        if (sessionList && sessionList.length > 0) {
          sessionListStore.setSessions(sessionList)
          console.log('设置后AudioCall.vue中sessionListStore的数据:', sessionListStore.sessions)
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
  border-radius: 50%;
  object-fit: cover;
  border: 5px solid #fff;
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
