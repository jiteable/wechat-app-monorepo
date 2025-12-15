export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  EMOJI = 'emoji',
  VOICE = 'voice',
  VIDEO = 'video'
}

export interface Message {
  id: string
  sessionId: string
  senderId: string
  receiverId?: string
  groupId?: string
  content: string
  messageType: MessageType
  mediaUrl?: string
  fileName?: string
  fileSize?: number
  timestamp: string
  sender?: {
    id: string
    chatId: string
    username: string
    email: string
    avatar: string
  }
  receiver?: {
    id: string
    chatId: string
    username: string
    email: string
    avatar: string
  }
}

export interface GetMessagesResponse {
  success: boolean
  data: {
    messages: Message[]
    pagination: {
      currentPage: number
      totalPages: number
      totalMessages: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }
}

// 添加分页请求参数接口
export interface GetMessagesRequest {
  sessionId: string
  page?: number
  limit?: number
}

// 发送消息请求参数（优化版）
export interface SendMessageRequest {
  sessionId: string // 会话ID（必传，对应 UnifiedMessage.sessionId）
  senderId: string // 发送者ID（必传，对应 UnifiedMessage.senderId）

  // 接收者/群组ID（二选一，私聊传receiverId，群聊传groupId，不可同时传或同时不传）
  receiverId?: string // 接收者ID（私聊必传，群聊不传）
  groupId?: string // 群组ID（群聊必传，私聊不传）
  messageType: MessageType // 消息类型（必传，对应 UnifiedMessage.messageType）

  // 内容相关（区分文本内容与媒体URL）
  content?: string // 文本内容（仅text/emoji类型必传，其他类型可选，如图片描述）
  mediaUrl?: string // 媒体文件URL（image/voice/video/file类型必传，text/emoji类型不传）

  // 文件类型附加信息（仅file类型必传）
  fileName?: string // 文件名（file类型必传）
  fileSize?: number // 文件大小（file类型必传，单位字节）
}

// 发送消息响应
export interface SendMessageResponse {
  success: boolean
  data: {
    messageId: string
    sessionId: string
    senderId: string
    messageType: MessageType
    content: string
    fileName?: string
    fileSize?: number
    timestamp: string
  }
  message: string
}
