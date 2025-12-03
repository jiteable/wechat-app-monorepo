export interface UploadAvatarResponse {
  success: boolean
  avatarUrl: string
  message: string
}

export interface UploadAvatarError {
  success: boolean
  error: string
}
