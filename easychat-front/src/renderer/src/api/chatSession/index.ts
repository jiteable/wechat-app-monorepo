import http from '../../utils/http'
import config from '../../config'
import { GetSessionsResponse, CreateSessionRequest, CreateSessionResponse } from './type'

/**
 * 获取用户的会话
 * @param contactUserId 可选的会话ID，如果不提供则获取所有会话
 */
export async function getSessions(contactUserId?: string): Promise<GetSessionsResponse | null> {
  try {
    const url = contactUserId
      ? `${config.api}/chatSession/getSession?contactUserId=${contactUserId}`
      : `${config.api}/chatSession/getSession`

    const response = await http.get<GetSessionsResponse>(url)
    return response.data
  } catch (error) {
    console.error('获取会话失败:', error)
    throw error // 抛出错误让调用者处理
  }
}

/**
 * 创建新的会话
 * @param sessionData 会话数据
 */
export async function createSession(
  sessionData: CreateSessionRequest
): Promise<CreateSessionResponse | null> {
  try {
    const response = await http.post<CreateSessionResponse>(
      `${config.api}/chatSession/createSession`,
      sessionData
    )
    return response.data
  } catch (error) {
    console.error('创建会话失败:', error)
    return null
  }
}
