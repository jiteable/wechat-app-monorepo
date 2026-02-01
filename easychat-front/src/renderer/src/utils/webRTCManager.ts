export interface WebRTCConfig {
  stunServerUrls?: string[]
  iceServers?: RTCIceServer[]
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

  constructor(config?: WebRTCConfig) {
    this.config = {
      stunServerUrls: ['stun:stun.l.google.com:19302'],
      ...config
    }
  }

  // 设置远程轨道回调
  public setOnRemoteTrack(callback: (event: RTCTrackEvent) => void) {
    this.onRemoteTrackCallback = callback
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

    const configuration: RTCConfiguration = {
      iceServers
    }

    this.peerConnection = new RTCPeerConnection(configuration)

    console.log('新的ICE候选: ')

    // 处理ICE候选
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('新的ICE候选:', event.candidate)
        // 这里应该通过信令服务器发送ICE候选给远端
        // 可以通过回调函数或者事件发射器来处理
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
      }
    }

    // ICE连接状态变更
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE连接状态变更:', this.peerConnection?.iceConnectionState)
    }

    // ICE收集状态变更
    this.peerConnection.onicegatheringstatechange = () => {
      console.log('ICE收集状态变更:', this.peerConnection?.iceGatheringState)
    }

    return this.peerConnection
  }

  // 获取本地媒体流
  public async getLocalStream(
    options: MediaStreamConstraints = { audio: true, video: false }
  ): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(options)

      // 将本地流添加到PeerConnection
      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach((track) => {
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

    const offer = await this.peerConnection.createOffer(
      options || {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      }
    )

    await this.peerConnection.setLocalDescription(offer)

    return offer
  }

  // 创建Answer
  public async createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection未初始化')
    }

    const answer = await this.peerConnection.createAnswer(options || {})

    await this.peerConnection.setLocalDescription(answer)

    return answer
  }

  // 设置远程描述
  public async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection未初始化')
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description))
  }

  // 添加ICE候选
  public async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection未初始化')
    }

    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
  }

  // 关闭连接
  public async closeConnection(): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
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
