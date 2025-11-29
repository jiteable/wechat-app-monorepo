export interface SearchUserRequest {
  query: string // 用户输入的查询字符串，可以是chatId或email或username
}

export interface SearchUserResponse {
  users: Array<{
    id: number
    username: string
    avatar: string
    chatId: string
    searchMethod
    isFriend: boolean
  }>
}
