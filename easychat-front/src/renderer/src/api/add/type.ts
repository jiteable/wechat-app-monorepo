export interface AddFriendRequest {
  userId: number // 要添加为好友的用户ID
}

export interface AddFriendResponse {
  success: boolean
  message?: string
}
