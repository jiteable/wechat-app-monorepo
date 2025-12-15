export interface UploadAvatarResponse {
  success: boolean
  avatarUrl: string
  message: string
}

export interface UploadAvatarError {
  success: boolean
  error: string
}

export interface UploadFileResponse {
  success: boolean
  mediaUrl: string
  originalName: string
  fileSize: number
  message: string
}

export interface UploadFileError {
  success: boolean
  error: string
}

export interface UploadImageResponse {
  success: boolean
  imageUrl: string
  originalName: string
  fileSize: number
  message: string
}

export interface UploadImageError {
  success: boolean
  error: string
}
