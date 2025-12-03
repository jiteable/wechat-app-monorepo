import config from '../../config'
import http from '../../utils/http'
import { UploadAvatarResponse, UploadAvatarError } from './type'

enum API {
  UPLOAD_AVATAR_URL = '/upload/avatar'
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
