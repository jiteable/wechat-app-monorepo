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
        <!-- 显示通话时长 -->
        <p v-if="callStarted" class="call-duration">{{ formattedDuration }}</p>
      </div>
    </div>

    <!-- 隐藏的音频元素用于播放远程音频流 -->
    <audio id="remoteAudio" ref="audioRef" autoplay playsinline style="display: none" />

    <!-- 接收方的控制按钮 -->
    <div v-if="!isCaller" class="call-controls no-drag">
      <button
        v-if="!callStarted"
        class="control-btn accept-btn"
        :disabled="isProcessingCall"
        @click="handleAcceptCall"
      >
        <el-icon>
          <Phone />
        </el-icon>
      </button>

      <button
        class="control-btn decline-btn"
        :disabled="isProcessingCall"
        @click="handleDeclineCall"
      >
        <el-icon>
          <Close />
        </el-icon>
      </button>
    </div>

    <!-- 发送方的控制按钮 - 显示拒绝按钮，通话开始后显示结束按钮 -->
    <div v-else class="call-controls no-drag">
      <button
        v-if="!callStarted"
        class="control-btn decline-btn"
        :disabled="isProcessingCall"
        @click="handleDeclineCall"
      >
        <el-icon>
          <Close />
        </el-icon>
      </button>
      <button
        v-else
        class="control-btn decline-btn"
        :disabled="isProcessingCall"
        @click="handleEndCall"
      >
        <el-icon>
          <PhoneFilled />
        </el-icon>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { Phone, Close, PhoneFilled } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import WebRTCManager from '@/utils/webRTCManager'

const route = useRoute()

// 响应式数据
const callStatus = ref('正在等待接听...')
const callStarted = ref(false)
const sessionId = ref('')
const avatar = ref('')
const contactName = ref('')
const isCaller = ref(false) // true表示发送方，false表示接收方
const callId = ref(null)
const isProcessingCall = ref(false)
const iceConnectionState = ref('')
const connectionStats = ref('')
const webRtcStatus = ref('初始化')

// 音频引用
const audioRef = ref(null)

// WebRTC管理器
const webrtcManager = new WebRTCManager()

// 存储待发送的ICE候选
let pendingIceCandidates = []

// 统计信息定时器
let statsInterval = null

let durationTimer = null
const duration = ref(0) // 通话时长（秒）

// 响铃功能
let ringtoneAudio = null
let ringtoneInterval = null

// 格式化通话时长
const formattedDuration = computed(() => {
  const hours = Math.floor(duration.value / 3600)
  const minutes = Math.floor((duration.value % 3600) / 60)
  const seconds = duration.value % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// 开始计时
const startCallTimer = () => {
  console.log('awd')
  duration.value = 0

  // 每秒更新一次时长
  durationTimer = setInterval(() => {
    duration.value++
  }, 1000)
}

// 停止计时
const stopCallTimer = () => {
  if (durationTimer) {
    clearInterval(durationTimer)
    durationTimer = null
  }
}

// 响铃功能实现
const triggerRingtone = () => {
  try {
    if (!ringtoneAudio) {
      ringtoneAudio = new Audio()
      ringtoneAudio.src = '/src/assets/audio/wechat_ring.mp3'
    }

    // 清除之前的定时器
    if (ringtoneInterval) {
      clearInterval(ringtoneInterval)
      ringtoneInterval = null
    }

    const playRingtone = () => {
      ringtoneAudio.currentTime = 0
      ringtoneAudio.play().catch((e) => console.log('响铃播放失败:', e))
    }

    playRingtone()

    // 每次播放结束后等待0.5秒再播放
    ringtoneAudio.onended = () => {
      ringtoneInterval = setTimeout(playRingtone, 500)
    }
  } catch (error) {
    console.log('响铃功能初始化失败:', error)
  }
}

const stopRingtone = () => {
  if (ringtoneAudio) {
    ringtoneAudio.pause()
    ringtoneAudio.currentTime = 0
    ringtoneAudio.onended = null
  }

  if (ringtoneInterval) {
    clearTimeout(ringtoneInterval)
    clearInterval(ringtoneInterval)
    ringtoneInterval = null
  }
}

// 初始化联系人信息
const setContactInfo = (sessionData) => {
  if (sessionData) {
    contactName.value =
      sessionData.contactName || sessionData.name || sessionData.remark || '联系人'
    avatar.value = sessionData.avatar || ''
    if (!sessionId.value && (sessionData.sessionId || sessionData.id)) {
      sessionId.value = sessionData.sessionId || sessionData.id
    }
    if (sessionData.targetUserId) {
      window.contactData = window.contactData || {}
      window.contactData.targetUserId = sessionData.targetUserId
    }
  } else {
    contactName.value = '未知联系人'
    avatar.value = ''
  }
}

// 发起通话
const initiateCall = async () => {
  isProcessingCall.value = true
  webRtcStatus.value = '正在发起通话'

  try {
    await webrtcManager.initializePeerConnection()
    await webrtcManager.getLocalStream({ audio: true, video: false })

    webrtcManager.setOnIceCandidate((candidate) => {
      if (window.contactData?.targetUserId && window.contactData?.callId) {
        window.api.sendWebrtcIceCandidate({
          targetUserId: window.contactData.targetUserId,
          candidate: candidate,
          callId: window.contactData.callId,
          sessionId: window.contactData.sessionId
        })
      } else {
        pendingIceCandidates.push(candidate)
      }
    })

    const offer = await webrtcManager.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false
    })

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
        targetUserId,
        sessionId: sessionId.value,
        callType: 'audio',
        callerInfo: window.contactData?.callerInfo || {},
        sdp: {
          type: offer.type,
          sdp: offer.sdp
        }
      }
    }

    window.api.sendMessage(callData)
  } catch (error) {
    console.error('发起通话失败:', error)
    callStatus.value = `发起通话失败: ${error.message}`
    webRtcStatus.value = '发起失败'
  } finally {
    isProcessingCall.value = false
  }
}

// 发送暂存的ICE候选
const sendPendingIceCandidates = () => {
  if (
    pendingIceCandidates.length > 0 &&
    window.contactData?.targetUserId &&
    window.contactData?.callId
  ) {
    pendingIceCandidates.forEach((candidate) => {
      window.api.sendWebrtcIceCandidate({
        targetUserId: window.contactData.targetUserId,
        candidate: candidate,
        callId: window.contactData.callId,
        sessionId: window.contactData.sessionId
      })
    })
    pendingIceCandidates = []
  }
}

// 处理暂存的ICE候选
const handleStoredIceCandidates = () => {
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.invoke('get-stored-ice-candidates').then((storedCandidates) => {
      if (storedCandidates && storedCandidates.length > 0) {
        storedCandidates.forEach((candidate) => {
          handleWebrtcIceCandidate(candidate)
        })
      }
    })
  }
}

// 接受通话
const acceptCall = async () => {
  isProcessingCall.value = true
  webRtcStatus.value = '正在接受通话'

  try {
    await webrtcManager.initializePeerConnection()
    await webrtcManager.getLocalStream({ audio: true, video: false })

    if (window.contactData?.offerSdp) {
      await webrtcManager.setRemoteDescription(window.contactData.offerSdp)
    } else {
      throw new Error('缺少远程Offer SDP')
    }

    // 处理暂存的ICE候选
    for (const candidate of pendingIceCandidates) {
      await handleWebrtcIceCandidate(candidate)
    }
    pendingIceCandidates = []

    const answer = await webrtcManager.createAnswer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false
    })

    window.api.sendWebrtcAnswer({
      targetUserId: window.contactData?.targetUserId || window.contactData?.contactId,
      sdp: {
        type: answer.type,
        sdp: answer.sdp
      },
      callId: window.contactData?.callId,
      sessionId: window.contactData?.sessionId
    })

    callStatus.value = '通话中'
    callStarted.value = true

    // 开始计时 - 在接受通话时启动计时器
    console.log('acceptCall 被调用，准备开始计时')
    startCallTimer()
  } catch (error) {
    console.error('接受通话失败:', error)
    callStatus.value = `接受通话失败: ${error.message}`
    webRtcStatus.value = '接受失败'
  } finally {
    isProcessingCall.value = false
  }
}

// 处理ICE候选
const handleWebrtcIceCandidate = async (data) => {
  try {
    if (!webrtcManager.getPeerConnection()) {
      pendingIceCandidates.push(data)
      return
    }

    const candidateInit = {
      candidate: data.candidate.candidate || data.candidate,
      sdpMid: data.candidate.sdpMid,
      sdpMLineIndex: data.candidate.sdpMLineIndex,
      usernameFragment: data.candidate.usernameFragment
    }

    await webrtcManager.addIceCandidate(candidateInit)
  } catch (error) {
    console.error('处理ICE候选失败:', error)
  }
}

// 处理WebRTC信令消息
const handleWebrtcOffer = async (data) => {
  try {
    if (!webrtcManager.getPeerConnection()) {
      await webrtcManager.initializePeerConnection()
      await webrtcManager.getLocalStream({ audio: true, video: false })
    }

    await webrtcManager.setRemoteDescription(data.sdp)

    const answer = await webrtcManager.createAnswer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false
    })

    window.api.sendWebrtcAnswer({
      targetUserId: data.senderId,
      sdp: answer,
      callId: data.callId,
      sessionId: data.sessionId
    })

    // 当我们发送answer后，通话连接即将建立，可以准备计时
    console.log('handleWebrtcOffer 被调用，通话即将建立')
  } catch (error) {
    console.error('处理WebRTC Offer失败:', error)
  }
}

const handleWebrtcAnswer = async (data) => {
  try {
    await webrtcManager.setRemoteDescription(data.sdp)
    callStatus.value = '通话中'
    callStarted.value = true

    // 开始计时 - 在收到对方的answer后，通话连接建立
    console.log('handleWebrtcAnswer 被调用，通话已建立，准备开始计时')
    startCallTimer()
  } catch (error) {
    console.error('处理WebRTC Answer失败:', error)
  }
}

// 拒绝/结束通话
const declineCall = () => {
  isProcessingCall.value = true

  if (window.api && typeof window.api.sendMessage === 'function') {
    const isReceiver = !!window.contactData?.callerId
    const reason = isReceiver ? '接收方拒绝通话' : '发送方取消通话'

    const declineData = {
      type: 'call_reject',
      data: {
        callId: callId.value,
        targetUserId:
          window.contactData?.targetUserId ||
          window.contactData?.contactId ||
          window.contactData?.callerInfo?.userId ||
          '',
        reason: reason
      }
    }

    window.api.sendMessage(declineData)
  }

  setTimeout(() => {
    window.api.closeAudioCallWindow()
    isProcessingCall.value = false
  }, 500)
}

const endCall = async () => {
  isProcessingCall.value = true

  try {
    await webrtcManager.closeConnection()

    if (window.api && typeof window.api.sendMessage === 'function') {
      const endCallData = {
        type: 'call_end',
        data: { callId: callId.value }
      }

      window.api.sendMessage(endCallData)
    }

    setTimeout(() => {
      window.api.closeAudioCallWindow()
      isProcessingCall.value = false
    }, 500)
  } catch (error) {
    console.error('结束通话失败:', error)
    setTimeout(() => {
      window.api.closeAudioCallWindow()
      isProcessingCall.value = false
    }, 500)
  }
}

// 操作处理函数
const handleAcceptCall = () => {
  stopRingtone()
  acceptCall()
}

const handleDeclineCall = () => {
  stopRingtone()
  declineCall()
}

const handleEndCall = () => {
  stopRingtone()
  endCall()
}

// 获取连接统计信息
const updateConnectionStats = async () => {
  const pc = webrtcManager.getPeerConnection()
  if (pc) {
    try {
      const stats = await pc.getStats()
      const statsInfo = []
      stats.forEach((report) => {
        if (report.type === 'candidate-pair' && report.state === 'failed') {
          statsInfo.push(`连接失败: ${report.localCandidateId} -> ${report.remoteCandidateId}`)
        } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          statsInfo.push(`连接成功: ${report.localCandidateId} -> ${report.remoteCandidateId}`)
        } else if (report.type === 'transport') {
          statsInfo.push(`传输统计: 发送${report.bytesSent}, 接收${report.bytesReceived}`)
        }
      })
      if (statsInfo.length > 0) {
        connectionStats.value = statsInfo.join('; ')
      }
    } catch (error) {
      console.error('获取统计信息失败:', error)
    }
  }
}

// 监听器
watch(
  () => webrtcManager.getIceConnectionState(),
  (newState) => {
    iceConnectionState.value = newState
    if (newState === 'connected') {
      webRtcStatus.value = '已连接'
    } else if (newState === 'failed') {
      webRtcStatus.value = '连接失败'
      callStatus.value = '连接失败，请检查网络'
      webrtcManager.restartIce()
    } else if (newState === 'checking') {
      webRtcStatus.value = '正在连接'
    } else if (newState === 'disconnected') {
      webRtcStatus.value = '已断开'
    } else {
      webRtcStatus.value = `ICE: ${newState}`
    }
  }
)

watch(
  () => webrtcManager.getConnectionState(),
  (newState) => {
    if (newState === 'connected') {
      webRtcStatus.value = '已连接'
    } else if (newState === 'failed') {
      webRtcStatus.value = '连接失败 - 可能是网络问题'
      callStatus.value = '连接失败，请检查网络设置'
      webrtcManager.restartIce()
    } else if (newState === 'connecting') {
      webRtcStatus.value = '正在连接'
    } else if (newState === 'disconnected') {
      webRtcStatus.value = '已断开'
    }
  }
)

// 组件挂载
onMounted(() => {
  // 设置远程流处理
  webrtcManager.setOnRemoteTrack((event) => {
    if (event.track.kind === 'audio') {
      let remoteStream
      if (event.streams && event.streams.length > 0) {
        remoteStream = event.streams[0]
      } else {
        remoteStream = new MediaStream([event.track])
      }

      if (audioRef.value) {
        audioRef.value.srcObject = remoteStream
        const playPromise = audioRef.value.play()
        playPromise.catch((error) => console.error('播放远程音频失败:', error))
      }
    }
  })

  // 设置ICE候选处理
  webrtcManager.setOnIceCandidate((candidate) => {
    if (window.contactData?.targetUserId && window.contactData?.callId) {
      window.api.sendWebrtcIceCandidate({
        targetUserId: window.contactData.targetUserId,
        candidate: candidate,
        callId: window.contactData.callId,
        sessionId: window.contactData.sessionId
      })
    }
  })

  // 启动统计信息更新
  statsInterval = setInterval(updateConnectionStats, 2000)

  // 获取初始sessionId
  if (window.contactData && window.contactData.sessionId) {
    sessionId.value = window.contactData.sessionId
  } else {
    const routeSessionId = route.params.id
    if (routeSessionId && routeSessionId !== 'default') {
      sessionId.value = routeSessionId
    }
  }

  if (window.api) {
    // 注册所有监听器
    window.api.onWebrtcIceCandidate(handleWebrtcIceCandidate)
    window.api.onWebrtcOffer(handleWebrtcOffer)
    window.api.onWebrtcAnswer(handleWebrtcAnswer)

    window.api.onCallInitiated((data) => {
      if (isCaller.value) {
        callStatus.value = '正在等待接听...'
        callId.value = data.callId
        if (window.contactData) window.contactData.callId = data.callId
        sendPendingIceCandidates()
      }
    })

    window.api.onCallAccepted((data) => {
      callStatus.value = '通话中'
      callStarted.value = true
      callId.value = data.callId

      // 开始计时
      console.log('onCallAccepted 被调用，准备开始计时')
      startCallTimer()
    })

    window.api.onCallRejected((data) => {
      if (data.reason === '发送方取消通话') {
        callStatus.value = '通话已取消'
      } else if (data.reason === '接收方拒绝通话') {
        callStatus.value = '通话被拒绝'
      }

      stopCallTimer()

      setTimeout(() => window.api.closeAudioCallWindow(), 1000)
    })

    window.api.onCallEnded((data) => {
      callStatus.value = '通话已结束'
      stopCallTimer()
      setTimeout(() => window.api.closeAudioCallWindow(), 1000)
    })

    window.api.onCallFailed((data) => {
      callStatus.value = '通话失败: ' + (data.message || '')
      stopCallTimer()
      setTimeout(() => window.api.closeAudioCallWindow(), 1000)
    })

    // 获取联系人数据
    window.electron.ipcRenderer.invoke('set-contact-data').then((contactData) => {
      window.contactData = contactData
      callId.value = contactData.callId
      isCaller.value = contactData.callerId ? false : true

      if (!sessionId.value && (contactData.sessionId || contactData.id)) {
        sessionId.value = contactData.sessionId || contactData.id
      }
      setContactInfo(contactData)

      if (isCaller.value) {
        setTimeout(initiateCall, 100)
      } else {
        // 接收方触发响铃
        triggerRingtone()
        callStatus.value = '响铃中...'
      }
    })

    handleStoredIceCandidates()
  }
})

// 组件卸载
onUnmounted(async () => {
  if (statsInterval) clearInterval(statsInterval)
  if (durationTimer) clearInterval(durationTimer)
  pendingIceCandidates = []
  stopRingtone()

  try {
    await webrtcManager.closeConnection()
  } catch (error) {
    console.error('清理WebRTC资源失败:', error)
  }

  if (window.api && typeof window.api.closeAudioCallWindow === 'function') {
    window.api.closeAudioCallWindow()
  }
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

.call-duration {
  font-size: 14px;
  color: #888;
  margin: 5px 0 0 0;
  font-weight: normal;
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

.control-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.accept-btn {
  background-color: #67c23a;
}

.decline-btn {
  background-color: #f56c6c;
}
</style>
