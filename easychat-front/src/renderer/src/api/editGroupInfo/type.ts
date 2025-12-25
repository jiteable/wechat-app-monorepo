// 群组信息更新参数类型
// 群组信息更新参数类型
export interface UpdateGroupInfoParams {
  groupId: string
  name?: string
  announcement?: string
}

// 会话备注更新参数类型
export interface UpdateSessionRemarkParams {
  sessionId: string
  remark: string
  contactId?: string | null // 新增联系人ID字段
  groupId?: string | null // 新增群组ID字段
}

// 用户在群组中的昵称更新参数类型
export interface UpdateUserNicknameInGroupParams {
  groupId: string
  nickname: string
  contactId?: string | null // 新增联系人ID字段
}

// API响应基础类型
export interface BaseResponse<T = any> {
  code: number
  data: T
  message: string
}
