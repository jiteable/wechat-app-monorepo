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
