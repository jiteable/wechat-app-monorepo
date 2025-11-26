export interface UserInfo {
  username: string
  avatar: string
  chatId: string
}

// 定义API响应的接口
export interface ApiResponse {
  user: UserInfo
}
