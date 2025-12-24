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

export interface SetFriendLabelRequest {
  friendId: string
  labels: string[]
}

export interface SetFriendLabelResponse {
  success: boolean
  message: string
  labels: string[]
}
