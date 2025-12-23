// 好友请求类型定义
export interface FriendRequest {
  id: string
  fromUserId: string
  toUserId: string
  status: string
  requestMessage?: string
  createdAt: string
  updatedAt: string
  fromUser: {
    id: string
    chatId: string
    username?: string
    email: string
    avatar?: string
    gender: string
    signature: string
    region: string
  }
}

// 群组邀请类型定义
export interface GroupInvitation {
  id: string
  groupId: string
  inviterId: string
  inviteeId: string
  status: string
  inviteMessage?: string
  createdAt: string
  updatedAt: string
  group: {
    id: string
    name: string
    ownerId: string
    image?: string
  }
  inviter: {
    id: string
    chatId: string
    username?: string
    email: string
    avatar?: string
  }
}

// 获取好友请求响应类型
export interface GetFriendRequestResponse {
  success: boolean
  data: FriendRequest[]
  error?: string
}

// 获取群组邀请响应类型
export interface GetGroupInvitationsResponse {
  success: boolean
  data: GroupInvitation[]
  error?: string
}

// 发送好友请求参数类型
export interface SendFriendRequestParams {
  toUserId: string
  requestMessage?: string
}

// 发送好友请求响应类型
export interface SendFriendRequestResponse {
  success: boolean
  data?: FriendRequest
  message?: string
  error?: string
}

// 发送群组邀请参数类型
export interface SendGroupInvitationsParams {
  groupId: string
  inviteeIds: string[]
  inviteMessage?: string
}

// 发送群组邀请响应类型
export interface SendGroupInvitationsResult {
  inviteeId: string
  invitation?: GroupInvitation
  error?: string
}

export interface SendGroupInvitationsResponse {
  success: boolean
  data?: {
    successfulInvitations: SendGroupInvitationsResult[]
    failedInvitations: SendGroupInvitationsResult[]
  }
  message?: string
  error?: string
}

export interface AcceptFriendRequestParams {
  requestId: string
}

export interface RejectFriendRequestParams {
  requestId: string
}

export interface RejectFriendRequestParams {
  requestId: string
}

export interface DeleteAllRequestsResponse {
  success: boolean
  message?: string
  error?: string
}
