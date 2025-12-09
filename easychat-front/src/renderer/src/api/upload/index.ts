import config from '../../config'
import http from '../../utils/http'
import { UploadAvatarResponse, UploadAvatarError, UploadFileResponse, UploadFileError } from './type'

enum API {
  UPLOAD_AVATAR_URL = '/upload/avatar',
  UPLOAD_FILE_URL = '/upload/file'
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
export const uploadFile = async (file: File, fileType?: 'image' | 'video' | 'voice' | 'file'): Promise<UploadFileResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  if (fileType) {
    formData.append('fileType', fileType)
  }

  const response = await http.post<UploadFileResponse & UploadFileError>(
    `${config.api}${API.UPLOAD_FILE_URL}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )

  return response.data
}
