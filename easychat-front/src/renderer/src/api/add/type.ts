export interface AddFriendRequest {
  userId: number // 要添加为好友的用户ID
  source?: string // 添加好友的来源方式
}

export interface AddFriendResponse {
  success: boolean
  message?: string
}
