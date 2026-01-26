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
      <button v-if="!callStarted" class="control-btn accept-btn" @click="handleAcceptCall">
        <el-icon>
          <Phone />
        </el-icon>
      </button>

      <button class="control-btn decline-btn" @click="handleDeclineCall">
        <el-icon>
          <Close />
        </el-icon>
      </button>
    </div>

    <!-- 发送方的控制按钮 - 显示拒绝按钮，通话开始后显示结束按钮 -->
    <div v-else class="call-controls no-drag">
      <button v-if="!callStarted" class="control-btn decline-btn" @click="handleDeclineCall">
        <el-icon>
          <Close />
        </el-icon>
      </button>
      <button v-else class="control-btn decline-btn" @click="handleEndCall">
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
import { useRoute } from 'vue-router'

const route = useRoute()

const callStatus = ref('正在等待接听...')
const callStarted = ref(false)
const sessionId = ref('')
const avatar = ref('')
const contactName = ref('')
// 新增变量来区分发送方和接收方
const isCaller = ref(false) // true表示发送方，false表示接收方
const callId = ref(null) // 存储通话ID

// 发起通话请求
const initiateCall = () => {
  if (window.api && typeof window.api.sendMessage === 'function') {
    console.log('window.contactData: ', window.contactData)
    // 确保targetUserId有效
    const targetUserId =
      window.contactData?.targetUserId ||
      window.contactData?.contactId ||
      window.contactData?.callerInfo?.userId

    if (!targetUserId) {
      console.error('无法发起通话：缺少目标用户ID', window.contactData)
      return
    }

    const callData = {
      type: 'call_initiate',
      data: {
        targetUserId: targetUserId,
        sessionId: sessionId.value,
        callType: 'audio', // 或 'video'
        callerInfo: window.contactData?.callerInfo || {}
      }
    }

    window.api.sendMessage(callData)
    console.log('已发送通话发起请求:', callData)
  } else {
    console.error('window.api.sendMessage 方法不可用')
  }
}

// 接受通话
const acceptCall = () => {
  callStatus.value = '通话中...'
  callStarted.value = true

  if (window.api && typeof window.api.sendMessage === 'function') {
    const acceptData = {
      type: 'call_accept',
      data: {
        callId: callId.value,
        targetUserId:
          window.contactData?.targetUserId ||
          window.contactData?.contactId ||
          window.contactData?.callerInfo?.userId ||
          ''
      }
    }

    window.api.sendMessage(acceptData)
    console.log('已发送通话接受:', acceptData)
  } else {
    console.error('window.api.sendMessage 方法不可用')
  }
}

// 拒绝通话
const declineCall = () => {
  if (window.api && typeof window.api.sendMessage === 'function') {
    const declineData = {
      type: 'call_reject',
      data: {
        callId: callId.value,
        targetUserId:
          window.contactData?.targetUserId ||
          window.contactData?.contactId ||
          window.contactData?.callerInfo?.userId ||
          ''
      }
    }

    window.api.sendMessage(declineData)
    console.log('已发送通话拒绝:', declineData)
  } else {
    console.error('window.api.sendMessage 方法不可用')
  }

  // 关闭窗口
  window.close()
}

// 结束通话
const endCall = () => {
  if (window.api && typeof window.api.sendMessage === 'function') {
    const endCallData = {
      type: 'call_end',
      data: {
        callId: callId.value
      }
    }

    window.api.sendMessage(endCallData)
    console.log('已发送通话结束:', endCallData)
  } else {
    console.error('window.api.sendMessage 方法不可用')
  }

  // 关闭窗口
  window.close()
}

// 处理接受通话
const handleAcceptCall = () => {
  acceptCall()
}

// 处理拒绝通话
const handleDeclineCall = () => {
  declineCall()
}

// 处理结束通话
const handleEndCall = () => {
  endCall()
}

// 根据contactData设置联系人信息
const setContactInfo = (sessionData) => {
  if (sessionData) {
    // 根据contactData格式设置信息
    contactName.value =
      sessionData.contactName || sessionData.name || sessionData.remark || '联系人'
    avatar.value = sessionData.avatar || ''
    // 如果还没有设置sessionId，从sessionData中获取
    if (!sessionId.value && (sessionData.sessionId || sessionData.id)) {
      sessionId.value = sessionData.sessionId || sessionData.id
    }
    // 设置目标用户ID，用于通话
    if (sessionData.targetUserId) {
      window.contactData = window.contactData || {}
      window.contactData.targetUserId = sessionData.targetUserId
    }
  } else {
    contactName.value = '未知联系人'
    avatar.value = ''
  }
}

// 监听通话状态变化
onMounted(() => {
  // 初始化音频通话逻辑
  // 从多种来源获取sessionId，优先级：window.contactData > 路由参数
  let currentSessionId = ''

  // 首先尝试从window.contactData获取（主进程通过IPC发送的数据）
  if (window.contactData && window.contactData.sessionId) {
    currentSessionId = window.contactData.sessionId
  } else {
    // 然后从路由参数获取
    const routeSessionId = route.params.id
    if (routeSessionId && routeSessionId !== 'default') {
      currentSessionId = routeSessionId
    }
  }

  sessionId.value = currentSessionId

  console.log('AudioCall.vue中从路由参数获取的sessionId:', sessionId.value)

  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.invoke('set-contact-data').then((contactData) => {
      console.log('接收到主进程发送的contactData:', contactData)
      window.contactData = contactData
      callId.value = contactData.callId
      isCaller.value = contactData.callerId ? false : true
      console.log('isCaller: ', isCaller.value)
      // 更新sessionId（如果之前没有获取到）
      if (!sessionId.value && (contactData.sessionId || contactData.id)) {
        sessionId.value = contactData.sessionId || contactData.id
      }
      setContactInfo(contactData)

      // 如果是发送方，在收到contactData后发起通话
      if (isCaller.value) {
        // 延迟一点时间再发起通话，确保数据完全加载
        setTimeout(() => {
          initiateCall()
        }, 100) // 延迟100毫秒
      }
    })
  }

  // 监听来自主进程的WebSocket消息
  if (window.electron && window.electron.ipcRenderer) {
    // 监听通话相关的信令消息
    window.electron.ipcRenderer.on('incoming-call', (event, data) => {
      console.log('收到incoming-call消息:', data)
      if (!isCaller.value) {
        // 只有接收方才处理这个
        callStatus.value = '响铃中...'
        callId.value = data.callId

        // 如果有联系人信息，更新显示
        if (data.callerName) {
          contactName.value = data.callerName
        }
        if (data.callerAvatar) {
          avatar.value = data.callerAvatar
        }
      }
    })

    window.electron.ipcRenderer.on('call-initiated', (event, data) => {
      console.log('收到call-initiated消息:', data)
      if (isCaller.value) {
        callStatus.value = '正在等待接听...'
        callId.value = data.callId
      }
    })

    window.electron.ipcRenderer.on('call-accepted', (event, data) => {
      console.log('收到call-accepted消息:', data)
      callStatus.value = '通话中...'
      callStarted.value = true
      callId.value = data.callId
    })

    window.electron.ipcRenderer.on('call-rejected', (event, data) => {
      console.log('收到call-rejected消息:', data)
      //注: 这里应该通过  data.reason 判断是因什么原因拒绝的

      if (data.rejectedBy === window.currentUser?.userId) {
        callStatus.value = '通话已拒绝' // 当前用户自己拒绝了通话
      } else {
        callStatus.value = '通话被拒绝' // 对方拒绝了通话
      }

      setTimeout(() => window.close(), 1000)
    })

    window.electron.ipcRenderer.on('call-ended', (event, data) => {
      console.log('收到call-ended消息:', data)
      callStatus.value = '通话已结束'
      setTimeout(() => window.close(), 1000)
    })

    window.electron.ipcRenderer.on('call-failed', (event, data) => {
      console.log('收到call-failed消息:', data)
      callStatus.value = '通话失败: ' + (data.message || '')
      setTimeout(() => window.close(), 1000)
    })
  }

  // 请求主进程发送最新的会话列表数据
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer
      .invoke('request-session-list')
      .then((sessionList) => {
        console.log('从主进程获取到的会话列表:', sessionList)
        if (sessionList && sessionList.length > 0) {
          // 根据获取到的sessionId在会话列表中查找匹配的会话
          const matchedSession = sessionList.find(
            (session) => session.sessionId === sessionId.value || session.id === sessionId.value
          )

          if (matchedSession) {
            // 找到匹配的会话，设置联系人信息
            setContactInfo(matchedSession)
          } else if (window.contactData) {
            // 如果在会话列表中没找到，但有window.contactData，使用它
            setContactInfo(window.contactData)
          } else {
            // 没找到匹配的会话且没有window.contactData
            console.log(`未找到sessionId为 ${sessionId.value} 的会话，也没有window.contactData`)
            contactName.value = '未知联系人'
            avatar.value = ''
          }
        } else {
          console.log('从主进程获取的会话列表为空或未定义')
          // 尝试使用window.contactData
          if (window.contactData) {
            setContactInfo(window.contactData)

            // 如果是发送方，在获取contactData后发起通话
            if (isCaller.value) {
              // 延迟发起通话
              setTimeout(() => {
                initiateCall()
              }, 100)
            }
          } else {
            contactName.value = '未知联系人'
            avatar.value = ''
          }
        }

        // 如果是发送方，在获取会话列表后发起通话
        if (isCaller.value && !window.contactData) {
          // 延迟发起通话
          setTimeout(() => {
            initiateCall()
          }, 100)
        }
      })
      .catch((err) => {
        console.error('请求会话列表失败:', err)
        // 尝试使用window.contactData
        if (window.contactData) {
          setContactInfo(window.contactData)

          // 如果是发送方，在获取contactData后发起通话
          if (isCaller.value) {
            // 延迟发起通话
            setTimeout(() => {
              initiateCall()
            }, 100)
          }
        } else {
          contactName.value = '未知联系人'
          avatar.value = ''
        }
      })
  } else {
    console.warn('未找到window.electron.ipcRenderer，无法请求会话列表')
    // 尝试使用window.contactData
    if (window.contactData) {
      setContactInfo(window.contactData)

      // 如果是发送方，在获取contactData后发起通话
      if (isCaller.value) {
        // 延迟发起通话
        setTimeout(() => {
          initiateCall()
        }, 100)
      }
    } else {
      contactName.value = '未知联系人'
      avatar.value = ''
    }
  }
})

onUnmounted(() => {
  // 移除IPC监听器
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.removeAllListeners('set-contact-data')
    window.electron.ipcRenderer.removeAllListeners('incoming-call')
    window.electron.ipcRenderer.removeAllListeners('call-initiated')
    window.electron.ipcRenderer.removeAllListeners('call-accepted')
    window.electron.ipcRenderer.removeAllListeners('call-rejected')
    window.electron.ipcRenderer.removeAllListeners('call-ended')
    window.electron.ipcRenderer.removeAllListeners('call-failed')
  }

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
