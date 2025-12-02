import http from '../../utils/http'
import config from '../../config'
import { GetContactResponse, GetGroupResponse } from './type'

export async function getContact(): Promise<GetContactResponse | null> {
  try {
    // 从localStorage中获取token
    const token = localStorage.getItem('TOKEN')

    if (!token) {
      console.error('未找到访问令牌')
      return null
    }

    // 调用后端API获取联系人列表（Authorization头由拦截器自动添加）
    const response = await http.get<GetContactResponse>(`${config.api}/get/getContact`)

    return response.data
  } catch (error) {
    console.error('获取联系人失败:', error)
    return null
  }
}

export async function getGroup(): Promise<GetGroupResponse | null> {
  try {
    const token = localStorage.getItem('TOKEN')

    if (!token) {
      console.error('未找到访问令牌')
      return null
    }

    // 调用后端API获取群组列表（Authorization头由拦截器自动添加）
    const response = await http.get<GetGroupResponse>(`${config.api}/get/getGroup`)

    return response.data
  } catch (error) {
    console.error('获取群组失败:', error)
    return null
  }
}
