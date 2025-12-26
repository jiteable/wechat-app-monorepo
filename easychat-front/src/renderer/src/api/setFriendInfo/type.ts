export interface GetUserLabelsResponse {
  success: boolean
  labels: string[]
}

export interface AddUserLabelRequest {
  label: string
}

export interface AddUserLabelResponse {
  success: boolean
  labels: string[]
}

export interface RemoveUserLabelRequest {
  label: string
}

export interface RemoveUserLabelResponse {
  success: boolean
  labels: string[]
}

export interface SetFriendInfoRequest {
  friendId: string
  labels?: string[]
  remark?: string
  description?: string
  phone?: string[]
}

export interface SetFriendInfoResponse {
  success: boolean
  message: string
  labels?: string[]
}
