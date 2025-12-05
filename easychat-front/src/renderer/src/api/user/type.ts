export interface UserInfo {
  userId: string
  username: string
  avatar: string
  chatId: string
}

// 定义API响应的接口
export interface ApiResponse {
  settings: UserSetState
}

export interface UserApiResponse {
  user: UserInfo
}

export interface UserSetState {
  // 新消息通知是否有声音
  newMessageSound: boolean

  // 添加好友设置
  needVerificationToAddFriend: boolean // 加我为朋友时是否需要验证
  canBeSearchedByChatId: boolean // 是否能够通过chatId搜索到我
  canBeSearchedByEmail: boolean // 是否能够通过邮箱搜索到我
  canAddFromGroup: boolean // 是否能通过群聊添加我

  // 通用设置
  language: string // 语言设置 (zh: 中文, en: 英文)
  fontSize: number // 字体大小设置
  openFileInReadonlyMode: boolean // 是否以只读的方式打开聊天中的文件
  showWebSearchHistory: boolean // 是否显示网络搜索历史
  autoConvertVoiceToText: boolean // 是否将聊天语音自动转成文字
}
