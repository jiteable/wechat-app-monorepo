import http from '../../utils/http'
import { UserInfo, ApiResponse, UserSetState, UserApiResponse } from './type'
import config from '../../config'

export async function getUserInfo(): Promise<UserInfo | null> {
  try {
    // 从localStorage中获取token
    const token = localStorage.getItem('TOKEN')

    if (!token) {
      return null
    }

    // 调用后端API获取用户信息（Authorization头由拦截器自动添加）
    const response = await http.get<UserApiResponse>(`${config.api}/user/info`)

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

export async function getUserSettingInfo() {
  try {
    // 从localStorage中获取token
    const token = localStorage.getItem('TOKEN')

    if (!token) {
      return null
    }

    // 调用后端API获取用户设置信息（Authorization头由拦截器自动添加）
    const response = await http.get<ApiResponse & { settings: UserSetState }>(
      `${config.api}/user/settingInfo`
    )

    // 获取用户基本信息
    const settings = response.data.settings

    return settings
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}

export async function setSetting(settingInfo: UserSetState): Promise<boolean> {
  try {
    // 从localStorage中获取token
    const token = localStorage.getItem('TOKEN')

    if (!token) {
      return false
    }

    // 调用后端API获取用户设置信息（Authorization头由拦截器自动添加）
    const response = await http.post<{ success: boolean }>(
      `${config.api}/user/setSetting`,
      settingInfo
    )

    return response.data.success
  } catch (error) {
    console.error('设置用户信息失败:', error)
    return false
  }
}
