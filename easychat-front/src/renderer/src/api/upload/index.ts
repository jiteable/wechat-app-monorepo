import config from '../../config'
import http from '../../utils/http'
import {
  UploadAvatarResponse,
  UploadAvatarError,
  UploadFileResponse,
  UploadFileError,
  UploadImageResponse,
  UploadImageError,
  UploadFileParams
} from './type'

enum API {
  UPLOAD_AVATAR_URL = '/upload/avatar',
  UPLOAD_FILE_URL = '/upload/file',
  UPLOAD_IMAGE_URL = '/upload/image',
  UPLOAD_VIDEO_URL = '/upload/video'
}

/**
 * 上传用户头像
 * @param file 头像文件
 * @returns 上传结果
 */
export const uploadAvatar = async (file: File): Promise<UploadAvatarResponse> => {
  const formData = new FormData()
  formData.append('avatar', file)

  const response = await http.post<UploadAvatarResponse & UploadAvatarError>(
    `${config.api}${API.UPLOAD_AVATAR_URL}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )

  return response.data
}

/**
 * 上传文件
 * @param file 文件
 * @param fileType 文件类型(image/video/voice/file)
 * @returns 上传结果
 */
export const uploadFile = async (params: UploadFileParams): Promise<UploadFileResponse> => {
  const { file, fileName, sessionId, fileType } = params
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileName', fileName)
  formData.append('sessionId', sessionId)
  if (fileType) {
    formData.append('fileType', fileType)
  }

  // 根据文件大小计算超时时间，每MB增加1秒，最少10秒，最多5分钟
  const fileSizeMB = file.size / (1024 * 1024)
  const timeout = Math.min(Math.max(10000, fileSizeMB * 1000), 300000)

  const response = await http.post<UploadFileResponse & UploadFileError>(
    `${config.api}${API.UPLOAD_FILE_URL}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: timeout
    }
  )

  return response.data
}

/**
 * 上传图片
 * @param file 图片文件
 * @returns 上传结果
 */
export const uploadImage = async (file: File): Promise<UploadImageResponse> => {
  const formData = new FormData()
  formData.append('image', file)

  // 根据文件大小计算超时时间，每MB增加1秒，最少10秒，最多5分钟
  const fileSizeMB = file.size / (1024 * 1024)
  const timeout = Math.min(Math.max(10000, fileSizeMB * 1000), 300000)

  const response = await http.post<UploadImageResponse & UploadImageError>(
    `${config.api}${API.UPLOAD_IMAGE_URL}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: timeout
    }
  )

  return response.data
}

/**
 * 上传视频
 * @param file 视频文件
 * @returns 上传结果
 */
export const uploadVideo = async (
  file: File,
  sessionId: string,
  fileName?: string
): Promise<UploadFileResponse> => {
  const formData = new FormData()
  formData.append('video', file)
  formData.append('sessionId', sessionId)

  // 如果提供了文件名，则也添加到表单数据中
  if (fileName) {
    formData.append('fileName', fileName)
  }

  // 根据视频文件大小计算超时时间，每MB增加2秒，最少30秒，最多10分钟
  // 视频文件通常比图片大，所以给予更长的超时时间
  const fileSizeMB = file.size / (1024 * 1024)
  const timeout = Math.min(Math.max(30000, fileSizeMB * 2000), 600000)

  const response = await http.post<UploadFileResponse & UploadFileError>(
    `${config.api}${API.UPLOAD_VIDEO_URL}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: timeout
    }
  )

  return response.data
}
