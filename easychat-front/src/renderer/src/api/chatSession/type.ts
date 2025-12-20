export interface ChatSessionUser {
  id: string
  sessionId: string
  userId: string
  joinTime: string
  lastReadTime: string
  isMuted: boolean
  isPinned: boolean
  customRemark: string | null
  unreadCount: number
  sessionType: string
  identity: string | null
  nickname: string | null
  remark: string | null
  showMemberNameCard: boolean
  background: string | null
  displayName: string | null
  displayAvatar: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    chatId: string
    username: string
    email: string
    avatar: string
    gender: string
    signature: string
    region: string
  }
}

// 群组信息
export interface Group {
  id: string
  ownerId: string
  adminIds: string[]
  members: member[]
  name: string
  announcement: string | null
  createdAt: string
  updatedAt: string
  image: string | null
  type: string
  mutedMembers: string[]
  allowMembersInvite: boolean
  needApprovalToJoin: boolean
  isDismissed: boolean
  dismissedAt: string | null
}
export interface member {
  id: string
  name: string
  avatar: string
}

// 最后一条消息
export interface LastMessage {
  id: string
  sessionId: string
  senderId: string
  receiverId: string | null
  groupId: string | null
  content: string
  messageType: string
  mediaUrl: string | null
  fileName: string | null
  fileSize: number | null
  isRecalled: boolean
  isDeleted: boolean
  status: string
  readStatus: boolean
  createdAt: string
  updatedAt: string
  recalledAt: string | null
  deletedAt: string | null
}

// 会话信息
export interface ChatSession {
  id: string
  sessionType: string
  name: string | null
  avatar: string | null
  ownerId: string | null
  createdAt: string
  updatedAt: string
  isPinned: boolean
  isMuted: boolean
  unreadCount: number
  lastMessage: LastMessage | null
  group: Group | null
  contactId?: string // 添加联系人ID(限私聊)
}

// 获取会话响应
export interface GetSessionsResponse {
  success: boolean
  data: ChatSession[]
}

// 获取会话用户响应
export interface GetSessionUsersResponse {
  success: boolean
  data: ChatSessionUser[]
}

// 创建会话请求参数
export interface CreateSessionRequest {
  sessionType: 'private' | 'group'
  name?: string
  avatar?: string
  userIds?: string[]
  groupId?: string
}

// 创建会话响应
export interface CreateSessionResponse {
  success: boolean
  data: ChatSession
  message?: string
}
