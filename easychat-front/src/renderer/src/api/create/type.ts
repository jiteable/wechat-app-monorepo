// 创建群聊请求类型
export interface CreateGroupRequest {
  groupName: string // 群聊名称
  memberIds: number[] // 成员ID列表
  avatar?: string // 群聊头像（可选）
}

// 创建群聊响应类型
export interface CreateGroupResponse {
  success: boolean
  message?: string
  groupId?: string // 群聊ID（如果创建成功）
  groupName?: string // 群聊名称
}
