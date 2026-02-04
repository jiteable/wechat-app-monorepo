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

    <!-- 隐藏的音频元素用于播放远程音频流 -->
    <audio id="remoteAudio" ref="audioRef" autoplay playsinline style="display: none" />

    <!-- 显示ICE连接状态 -->
    <div class="connection-info">
      <p>ICE状态: {{ iceConnectionState || '未连接' }}</p>
      <p v-if="connectionStats">连接统计: {{ connectionStats }}</p>
      <p>WebRTC状态: {{ webRtcStatus }}</p>
    </div>

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
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Phone, Close, PhoneFilled } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import WebRTCManager from '@/utils/webRTCManager'

const route = useRoute()

const callStatus = ref('正在等待接听...')
const callStarted = ref(false)
const sessionId = ref('')
const avatar = ref('')
const contactName = ref('')
// 新增变量来区分发送方和接收方
const isCaller = ref(false) // true表示发送方，false表示接收方
const callId = ref(null) // 存储通话ID
const isProcessingCall = ref(false) // 标记是否正在处理通话相关操作
const iceConnectionState = ref('') // ICE连接状态
const connectionStats = ref('') // 连接统计信息
const webRtcStatus = ref('初始化') // WebRTC整体状态

// 添加对远程音频元素的引用
const audioRef = ref(null)

// 创建WebRTCManager实例时配置多个STUN服务器
const webrtcManager = new WebRTCManager()

// 存储待发送的ICE候选，直到获得callId后批量发送
let pendingIceCandidates = []

// 监听ICE连接状态变化
watch(
  () => webrtcManager.getIceConnectionState(),
  (newState) => {
    iceConnectionState.value = newState
    console.log('ICE连接状态更新:', newState)

    // 更新整体状态
    if (newState === 'connected') {
      webRtcStatus.value = '已连接'
    } else if (newState === 'failed') {
      webRtcStatus.value = '连接失败'
      callStatus.value = '连接失败，请检查网络'
      // 尝试重启ICE
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

// 监听连接状态变化
watch(
  () => webrtcManager.getConnectionState(),
  (newState) => {
    console.log('WebRTC连接状态更新:', newState)
    if (newState === 'connected') {
      webRtcStatus.value = '已连接'
    } else if (newState === 'failed') {
      webRtcStatus.value = '连接失败 - 可能是网络问题'
      callStatus.value = '连接失败，请检查网络设置'
      // 尝试重启连接或使用备用方案
      webrtcManager.restartIce()
    } else if (newState === 'connecting') {
      webRtcStatus.value = '正在连接'
    } else if (newState === 'disconnected') {
      webRtcStatus.value = '已断开'
    }
  }
)

// 定期获取连接统计信息
let statsInterval = null

// 发起通话请求
const initiateCall = async () => {
  isProcessingCall.value = true
  webRtcStatus.value = '正在发起通话'

  try {
    console.log('开始初始化PeerConnection...')
    await webrtcManager.initializePeerConnection()
    console.log('PeerConnection初始化成功')

    // 发送方也需要获取本地音频流以进行双向通话
    console.log('发送方模式：获取本地音视频流...')
    await webrtcManager.getLocalStream({ audio: true, video: false })
    console.log('本地音视频流获取成功')

    // 在创建Offer前，先设置ICE候选处理，但暂时缓存候选
    console.log('设置ICE候选处理...')
    webrtcManager.setOnIceCandidate((candidate) => {
      console.log('本地ICE候选生成:', candidate)

      // 如果已经获得了callId，则直接发送；否则暂存
      if (window.contactData?.targetUserId && window.contactData?.callId) {
        window.api.sendWebrtcIceCandidate({
          targetUserId: window.contactData.targetUserId,
          candidate: candidate,
          callId: window.contactData.callId,
          sessionId: window.contactData.sessionId
        })
      } else {
        // 暂存ICE候选，等待callId
        pendingIceCandidates.push(candidate)
        console.log('暂存ICE候选，等待callId:', candidate)
      }
    })

    console.log('开始创建Offer...')
    // 创建Offer - 指定发送音频并接收音频
    const offer = await webrtcManager.createOffer({
      offerToReceiveAudio: true, // 允许接收音频
      offerToReceiveVideo: false // 不接收视频
    })
    console.log('Offer创建成功:', offer)

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
          callType: 'audio',
          callerInfo: window.contactData?.callerInfo || {},
          sdp: {
            type: offer.type,
            sdp: offer.sdp
          }
        }
      }

      // 发送通话请求
      window.api.sendMessage(callData)
      console.log('已发送通话发起请求:', callData)
    } else {
      console.error('window.api.sendMessage 方法不可用')
    }
  } catch (error) {
    console.error('发起通话失败:', error)
    callStatus.value = `发起通话失败: ${error.message}`
    webRtcStatus.value = '发起失败'
  } finally {
    isProcessingCall.value = false
  }
}

const sendPendingIceCandidates = () => {
  if (
    pendingIceCandidates.length > 0 &&
    window.contactData?.targetUserId &&
    window.contactData?.callId
  ) {
    console.log('发送暂存的', pendingIceCandidates.length, '个ICE候选')

    pendingIceCandidates.forEach((candidate) => {
      window.api.sendWebrtcIceCandidate({
        targetUserId: window.contactData.targetUserId,
        candidate: candidate,
        callId: window.contactData.callId,
        sessionId: window.contactData.sessionId
      })
    })

    // 清空暂存的候选
    pendingIceCandidates = []
  }
}

// 接受通话
const acceptCall = async () => {
  isProcessingCall.value = true
  webRtcStatus.value = '正在接受通话'

  try {
    console.log('开始接受通话，当前window.contactData:', window.contactData)

    // 先初始化PeerConnection，再获取本地流
    await webrtcManager.initializePeerConnection()
    console.log('PeerConnection初始化成功')

    // 获取本地音频流 - 现在PeerConnection已经存在，轨道会被正确添加
    await webrtcManager.getLocalStream({ audio: true, video: false })
    console.log('本地音频流获取成功')

    // 首先设置远程Offer（这应该是从incoming_call消息中获得的）
    if (window.contactData?.offerSdp) {
      console.log('设置远程Offer:', window.contactData.offerSdp)
      await webrtcManager.setRemoteDescription(window.contactData.offerSdp)
      console.log('已设置远程Offer')
    } else {
      console.warn('没有找到远程Offer SDP')
      console.log('window.contactData内容:', JSON.stringify(window.contactData, null, 2))
      // 如果没有offer SDP，可能需要等待
      throw new Error('缺少远程Offer SDP')
    }

    // 创建Answer
    const answer = await webrtcManager.createAnswer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false
    })
    console.log('Answer创建成功:', answer)

    // 发送Answer给呼叫方
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

    console.log('通话已接受，Answer已发送')
  } catch (error) {
    console.error('接受通话失败:', error)
    callStatus.value = `接受通话失败: ${error.message}`
    webRtcStatus.value = '接受失败'
  } finally {
    isProcessingCall.value = false
  }
}

// 处理WebRTC信令消息
const handleWebrtcOffer = async (data) => {
  console.log('收到WebRTC Offer:', data)

  try {
    // 确保PeerConnection已初始化
    if (!webrtcManager.getPeerConnection()) {
      await webrtcManager.initializePeerConnection()
      // 在PeerConnection初始化后再获取本地流
      await webrtcManager.getLocalStream({ audio: true, video: false })
    }

    // 设置远程描述
    await webrtcManager.setRemoteDescription(data.sdp)

    // 创建Answer
    const answer = await webrtcManager.createAnswer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false
    })

    // 发送Answer给远端
    window.api.sendWebrtcAnswer({
      targetUserId: data.senderId,
      sdp: answer,
      callId: data.callId,
      sessionId: data.sessionId
    })

    console.log('Answer已创建并发送')
  } catch (error) {
    console.error('处理WebRTC Offer失败:', error)
  }
}

const handleWebrtcAnswer = async (data) => {
  console.log('收到WebRTC Answer:', data)

  try {
    // 设置远程描述
    await webrtcManager.setRemoteDescription(data.sdp)

    // 通话已连接
    callStatus.value = '通话中'
    callStarted.value = true

    console.log('通话已连接')
  } catch (error) {
    console.error('处理WebRTC Answer失败:', error)
  }
}
const handleWebrtcIceCandidate = async (data) => {
  console.log('收到ICE候选:', data)

  try {
    // 将接收到的数据转换为RTCIceCandidateInit对象
    const candidateInit = {
      candidate: data.candidate.candidate || data.candidate, // 处理两种可能的数据格式
      sdpMid: data.candidate.sdpMid,
      sdpMLineIndex: data.candidate.sdpMLineIndex,
      usernameFragment: data.candidate.usernameFragment
    }

    console.log('转换后的ICE候选:', candidateInit)

    // 添加ICE候选
    await webrtcManager.addIceCandidate(candidateInit)
  } catch (error) {
    console.error('处理ICE候选失败:', error)
  }
}
// 拒绝通话
const declineCall = () => {
  isProcessingCall.value = true

  if (window.api && typeof window.api.sendMessage === 'function') {
    // 判断是接收方拒绝还是发起方取消
    let reason = ''
    if (window.contactData?.callerId) {
      // 如果有callerId，表示当前用户是接收方，拒绝通话
      reason = '接收方拒绝通话'
    } else {
      // 如果没有callerId，表示当前用户是发起方，取消通话
      reason = '发送方取消通话'
    }

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
    console.log('已发送通话拒绝:', declineData)
  } else {
    console.error('window.api.sendMessage 方法不可用')
  }

  // 关闭窗口
  setTimeout(() => {
    window.close()
    isProcessingCall.value = false
  }, 500)
}

// 结束通话
const endCall = async () => {
  isProcessingCall.value = true

  try {
    // 关闭WebRTC连接
    await webrtcManager.closeConnection()

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
    setTimeout(() => {
      window.close()
      isProcessingCall.value = false
    }, 500)
  } catch (error) {
    console.error('结束通话失败:', error)
    setTimeout(() => {
      window.close()
      isProcessingCall.value = false
    }, 500)
  }
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

// 监听通话状态变化
onMounted(() => {
  // 设置远程流处理
  webrtcManager.setOnRemoteTrack((event) => {
    console.log('远程轨道到达:', event)
    // 检查是否为音频轨道
    if (event.track.kind === 'audio') {
      console.log('检测到远程音频轨道:', event.track)
      console.log('音频轨道是否启用:', event.track.enabled)
      console.log('音频轨道是否活跃:', event.track.readyState === 'live')

      // 获取远程音频流 - 使用event.streams[0]而不是创建新的MediaStream
      let remoteStream
      if (event.streams && event.streams.length > 0) {
        // 如果event包含streams数组，使用第一个流
        remoteStream = event.streams[0]
        console.log('使用event.streams[0]作为远程音频流')
      } else {
        // 否则创建一个新的MediaStream并添加轨道
        remoteStream = new MediaStream([event.track])
        console.log('创建新的MediaStream包含音频轨道')
      }

      // 将远程音频流分配给音频元素
      if (audioRef.value) {
        console.log('音频元素引用存在，准备设置srcObject')
        audioRef.value.srcObject = remoteStream

        // 检查浏览器是否允许自动播放
        const playPromise = audioRef.value.play()
        playPromise
          .then(() => {
            console.log('远程音频播放成功')

            // 额外的日志记录音频元素的状态
            console.log('音频元素音量:', audioRef.value.volume)
            console.log('音频元素静音状态:', audioRef.value.muted)
            console.log('音频元素暂停状态:', audioRef.value.paused)
          })
          .catch((error) => {
            console.error('播放远程音频失败:', error)
          })
      } else {
        console.error('音频元素引用不存在')
      }
    }
  })

  // 设置ICE候选处理 - 通过WebRTCManager的回调实现
  webrtcManager.setOnIceCandidate((candidate) => {
    console.log('本地ICE候选生成:', candidate)
    // 发送ICE候选给远端
    if (window.contactData?.targetUserId && window.contactData?.callId) {
      window.api.sendWebrtcIceCandidate({
        targetUserId: window.contactData.targetUserId,
        candidate: candidate,
        callId: window.contactData.callId,
        sessionId: window.contactData.sessionId
      })
    } else {
      console.warn('无法发送ICE候选：缺少targetUserId或callId', {
        targetUserId: window.contactData?.targetUserId,
        callId: window.contactData?.callId,
        sessionId: window.contactData?.sessionId
      })
    }
  })

  // 启动定期统计信息更新
  statsInterval = setInterval(updateConnectionStats, 2000)

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
    // 首先注册所有必要的监听器，然后再处理初始数据
    // 注册ICE候选监听器，确保在任何ICE候选消息到达时都能被处理
    window.electron.ipcRenderer.on('ice-candidate', (event, data) => {
      console.log('收到ICE候选:', data)
      handleWebrtcIceCandidate(data) // 复用现有的处理函数
    })

    // 监听其他WebRTC信令消息
    window.electron.ipcRenderer.on('webrtc-offer', (event, data) => {
      handleWebrtcOffer(data)
    })

    window.electron.ipcRenderer.on('webrtc-answer', (event, data) => {
      handleWebrtcAnswer(data)
    })

    // 监听来自主进程的WebSocket消息
    window.electron.ipcRenderer.on('incoming-call', (event, data) => {
      console.log('收到incoming-call消息:', data)
      console.log('当前isCaller值:', isCaller.value)
      console.log('当前window.contactData:', window.contactData)

      // 更可靠的判断方式：检查是否有callerId来确定是否为接收方
      const isReceiver = !!data.callerId
      console.log('根据callerId判断是否为接收方:', isReceiver)

      if (isReceiver) {
        // 这是接收方
        callStatus.value = '响铃中...'
        callId.value = data.callId

        // 如果有联系人信息，更新显示
        if (data.callerName) {
          contactName.value = data.callerName
        }
        if (data.callerAvatar) {
          avatar.value = data.callerAvatar
        }

        // 存储Offer SDP（如果有的话）
        if (data.offerSdp && data.offerSdp.sdp) {
          window.contactData = window.contactData || {}
          // 确保保存完整的contactData信息
          Object.assign(window.contactData, {
            contactName: data.callerName,
            avatar: data.callerAvatar,
            sessionId: data.sessionId,
            callId: data.callId,
            callerId: data.callerId,
            callType: data.callType,
            targetUserId: data.callerId,
            offerSdp: {
              type: data.offerSdp.type,
              sdp: data.offerSdp.sdp
            }
          })

          console.log('已存储远程Offer SDP:', {
            type: data.offerSdp.type,
            sdp_length: data.offerSdp.sdp.length
          })
          console.log('存储后的window.contactData:', window.contactData)
        } else {
          console.warn('收到的incoming-call消息中没有有效的offerSdp')
          console.log('data.offerSdp值:', data.offerSdp)
        }
      } else {
        console.log('忽略incoming-call消息，因为当前是发送方')
      }
    })

    window.electron.ipcRenderer.on('call-initiated', (event, data) => {
      console.log('收到call-initiated消息:', data)
      if (isCaller.value) {
        callStatus.value = '正在等待接听...'
        callId.value = data.callId

        // 将callId添加到window.contactData中
        if (window.contactData) {
          window.contactData.callId = data.callId
        }

        // 如果有待发送的ICE候选，立即发送
        sendPendingIceCandidates()
      }
    })

    window.electron.ipcRenderer.on('call-accepted', (event, data) => {
      console.log('收到call-accepted消息:', data)
      callStatus.value = '通话中'
      callStarted.value = true
      callId.value = data.callId
    })

    window.electron.ipcRenderer.on('call-rejected', (event, data) => {
      console.log('收到call-rejected消息:', data)
      //注: 这里应该通过  data.reason 判断是因什么原因拒绝的

      if (data.reason === '发送方取消通话') {
        callStatus.value = '通话已取消' // 发起方取消了通话
      } else if (data.reason === '接收方拒绝通话') {
        callStatus.value = '通话被拒绝' // 接收方拒绝了通话
      }

      // setTimeout(() => window.close(), 1000)
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

    // 获取联系人数据并继续处理
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

onUnmounted(async () => {
  // 清理统计信息更新定时器
  if (statsInterval) {
    clearInterval(statsInterval)
  }

  // 移除IPC监听器
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.removeAllListeners('set-contact-data')
    window.electron.ipcRenderer.removeAllListeners('incoming-call')
    window.electron.ipcRenderer.removeAllListeners('call-initiated')
    window.electron.ipcRenderer.removeAllListeners('call-accepted')
    window.electron.ipcRenderer.removeAllListeners('call-rejected')
    window.electron.ipcRenderer.removeAllListeners('call-ended')
    window.electron.ipcRenderer.removeAllListeners('call-failed')

    // 移除WebRTC信令监听器
    window.electron.ipcRenderer.removeAllListeners('webrtc-offer')
    window.electron.ipcRenderer.removeAllListeners('webrtc-answer')
    window.electron.ipcRenderer.removeAllListeners('ice-candidate')
  }

  // 清理WebRTC资源
  try {
    await webrtcManager.closeConnection()
  } catch (error) {
    console.error('清理WebRTC资源失败:', error)
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

.connection-info {
  text-align: center;
  margin-top: 10px;
  color: #666;
  font-size: 14px;
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
