export interface WebRTCConfig {
  stunServerUrls?: string[]
  iceServers?: RTCIceServer[]
  onIceCandidate?: (candidate: RTCIceCandidate) => void // 添加ICE候选回调接口
}

export interface CallOptions {
  targetUserId: string
  callType?: 'audio' | 'video'
  sessionId?: string
}

class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private config: WebRTCConfig
  private onRemoteTrackCallback: ((event: RTCTrackEvent) => void) | null = null
  private onIceCandidateCallback: ((candidate: RTCIceCandidate) => void) | null = null // 添加ICE候选回调

  constructor(config?: WebRTCConfig) {
    this.config = {
      // 使用更可靠的STUN服务器
      stunServerUrls: ['stun:stun.l.google.com:19302'],
      ...config
    }
  }

  // 设置远程轨道回调
  public setOnRemoteTrack(callback: (event: RTCTrackEvent) => void) {
    this.onRemoteTrackCallback = callback
  }

  // 设置ICE候选回调
  public setOnIceCandidate(callback: (candidate: RTCIceCandidate) => void) {
    this.onIceCandidateCallback = callback
  }

  // 初始化PeerConnection
  public async initializePeerConnection(): Promise<RTCPeerConnection> {
    // 构建ICE服务器配置
    const iceServers: RTCIceServer[] = []

    // 添加STUN服务器
    if (this.config.stunServerUrls) {
      this.config.stunServerUrls.forEach((url) => {
        iceServers.push({ urls: url })
      })
    }

    // 如果提供了额外的ICE服务器配置，合并它们
    if (this.config.iceServers) {
      iceServers.push(...this.config.iceServers)
    }

    // 优化配置以减少不必要的STUN请求
    const configuration: RTCConfiguration = {
      iceServers,
      // 减少ICE候选收集的复杂性
      // iceTransportPolicy: 'relay', // 优先使用中继候选（TURN），减少直连尝试
      bundlePolicy: 'balanced', // 平衡策略
      rtcpMuxPolicy: 'require' // 要求RTCP复用
    }

    // 创建PeerConnection实例
    this.peerConnection = new RTCPeerConnection(configuration)

    console.log('PeerConnection已创建，ICE服务器配置:', iceServers)

    console.log('Connection', this.peerConnection)

    // 处理ICE候选
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('新的ICE候选:', event.candidate)

        // 调用外部设置的ICE候选回调，确保传递可序列化的数据
        if (this.onIceCandidateCallback) {
          // 将RTCIceCandidate转换为可序列化的对象
          const serializableCandidate = {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            usernameFragment: event.candidate.usernameFragment
          }
          console.log('序列化后的ICE候选:', serializableCandidate)
          this.onIceCandidateCallback(serializableCandidate)
        }

        // 检查候选类型，优先使用srflx和relay类型的候选
        if (event.candidate.candidate) {
          if (
            event.candidate.candidate.includes('srflx') ||
            event.candidate.candidate.includes('relay')
          ) {
            console.log('发现服务器反射或中继候选，这是高质量候选')
          } else if (event.candidate.candidate.includes('host')) {
            console.log('发现主机候选，质量可能较低')
          }
        }
      } else {
        console.log('所有ICE候选收集完毕')
        // 不发送空的候选，仅记录状态
      }
    }

    // 远程流到达时的处理
    this.peerConnection.ontrack = (event) => {
      console.log('远程轨道到达:', event)
      if (this.onRemoteTrackCallback) {
        this.onRemoteTrackCallback(event)
      }
    }

    // 连接状态变更
    this.peerConnection.onconnectionstatechange = () => {
      console.log('连接状态变更:', this.peerConnection?.connectionState)
      if (this.peerConnection?.connectionState === 'connected') {
        console.log('WebRTC连接已建立')
      } else if (this.peerConnection?.connectionState === 'failed') {
        console.error('WebRTC连接失败')
        // 添加更详细的错误信息
        this.handleConnectionFailure()
      } else if (this.peerConnection?.connectionState === 'disconnected') {
        console.warn('WebRTC连接断开')
      } else if (this.peerConnection?.connectionState === 'closed') {
        console.log('WebRTC连接已关闭')
      }
    }

    // ICE连接状态变更
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE连接状态变更:', this.peerConnection?.iceConnectionState)

      // 当ICE连接失败时，提供更多调试信息
      if (this.peerConnection?.iceConnectionState === 'failed') {
        console.error('ICE连接失败，可能是防火墙或NAT问题')
        this.restartIce()
      }
    }

    // ICE收集状态变更
    this.peerConnection.onicegatheringstatechange = () => {
      console.log('ICE收集状态变更:', this.peerConnection?.iceGatheringState)
    }

    // 添加协商状态变更处理
    this.peerConnection.onnegotiationneeded = () => {
      console.log('需要协商')
    }

    return this.peerConnection
  }

  // 处理连接失败的方法
  private handleConnectionFailure() {
    console.error('WebRTC连接失败详情:')

    if (this.peerConnection) {
      // 获取连接统计信息以便调试
      this.peerConnection
        .getStats()
        .then((report) => {
          const statsInfo: string[] = []
          report.forEach((stat) => {
            if (stat.type === 'candidate-pair' && stat.state === 'failed') {
              console.error('失败的候选对:', stat)
              statsInfo.push(
                `Failed candidate pair: ${stat.localCandidateId} -> ${stat.remoteCandidateId}`
              )
            } else if (stat.type === 'local-candidate') {
              console.log('本地候选:', stat)
            } else if (stat.type === 'remote-candidate') {
              console.log('远程候选:', stat)
            } else if (stat.type === 'transport') {
              console.log('传输统计:', stat)
            }
          })

          if (statsInfo.length > 0) {
            console.log('连接失败详情:', statsInfo)
          }
        })
        .catch((e) => {
          console.error('获取统计信息失败:', e)
        })
    }
  }

  // 重启ICE收集过程
  public restartIce() {
    if (this.peerConnection && this.peerConnection.iceConnectionState === 'failed') {
      console.log('正在重启ICE收集过程')
      this.peerConnection.restartIce()
    }
  }

  // 获取本地媒体流
  public async getLocalStream(
    options: MediaStreamConstraints = { audio: true, video: false }
  ): Promise<MediaStream> {
    try {
      console.log('正在请求本地媒体流...', options)
      this.localStream = await navigator.mediaDevices.getUserMedia(options)
      console.log('本地媒体流获取成功')

      // 将本地流添加到PeerConnection
      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          console.log('添加轨道到PeerConnection:', track.kind, track.readyState)
          this.peerConnection!.addTrack(track, this.localStream!)
        })
      }

      return this.localStream
    } catch (error) {
      console.error('获取本地媒体流失败:', error)
      throw error
    }
  }

  // 创建Offer
  public async createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection未初始化')
    }

    console.log('正在创建Offer...')
    const offer = await this.peerConnection.createOffer(
      options || {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      }
    )

    console.log('this.peerConnection: ', this.peerConnection)

    console.log('Offer创建成功，正在设置本地描述...')
    await this.peerConnection.setLocalDescription(offer)
    console.log('本地描述设置成功')

    return offer
  }

  // 创建Answer
  public async createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection未初始化')
    }

    console.log('正在创建Answer...')
    console.log('createAnswer options: ', options)
    const answer = await this.peerConnection.createAnswer(options || {})
    console.log('createAnswer options: ', answer)

    console.log('Answer创建成功，正在设置本地描述...')
    await this.peerConnection.setLocalDescription(answer)
    console.log('本地描述设置成功')

    return answer
  }

  // 设置远程描述
  public async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection未初始化')
    }

    console.log('正在设置远程描述...')
    console.log('description: ', description)
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description))
      console.log('远程描述设置成功')
    } catch (error) {
      console.error('设置远程描述失败:', error)
      throw error
    }
  }

  // 添加ICE候选
  public async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection未初始化')
    }

    console.log('正在添加ICE候选...')
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
    console.log('ICE候选添加成功')
  }

  // 关闭连接
  public async closeConnection(): Promise<void> {
    console.log('正在关闭WebRTC连接...')

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop()
        console.log('停止轨道:', track.kind)
      })
      this.localStream = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
      console.log('PeerConnection已关闭')
    }
  }

  // 获取PeerConnection实例
  public getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection
  }

  // 检查是否已连接
  public isConnected(): boolean {
    return this.peerConnection?.connectionState === 'connected'
  }

  // 检查连接状态
  public getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState || null
  }

  // 检查ICE连接状态
  public getIceConnectionState(): RTCIceConnectionState | null {
    return this.peerConnection?.iceConnectionState || null
  }
}

export default WebRTCManager
