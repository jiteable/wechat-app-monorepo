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
  mimeType: string
  fileExtension: string
  message: string
}

export interface UploadFileError {
  success: boolean
  error: string
}

export interface UploadFileParams {
  file: File
  fileName: string
  sessionId: string
  fileType?: 'video' | 'file'
}

export interface UploadImageResponse {
  success: boolean
  imageUrl: string
  originalName: string
  fileSize: number
  mimeType: string
  fileExtension: string
  message: string
}

export interface UploadImageError {
  success: boolean
  error: string
}

export interface videoInfo {
  duration: number
  width: number
  height: number
  bitrate: number
  codec: string
  fps: number
  thumbnailUrl: string
  downloadUrl: string
}

export interface UploadVideoResponse {
  success: boolean
  mediaUrl: string
  originalName: string
  fileSize: number
  mimeType: string
  fileExtension: string
  videoInfo: videoInfo
  message: string
}

export interface UploadVideoError {
  success: boolean
  error: string
}
