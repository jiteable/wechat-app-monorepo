import http from '@renderer/utils/http'
import { UserInfo, ApiResponse } from './type'
import config from '../../config'
export async function getUserInfo(): Promise<UserInfo | null> {
  try {
    // 从localStorage中获取token
    const token = localStorage.getItem('TOKEN')

    if (!token) {
      return null
    }

    // 设置认证头
    const headers = {
      Authorization: `Bearer ${token}`
    }

    // 调用后端API获取用户信息
    const response = await http.get<ApiResponse>(`${config.api}/user/info`, { headers })

    const { username, avatar, chatId } = response.data.user

    return {
      username,
      avatar,
      chatId
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}
