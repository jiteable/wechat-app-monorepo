import http from '../../utils/http'
import config from '../../config'
import { GetSessionsResponse, CreateSessionRequest, CreateSessionResponse } from './type'

/**
 * 获取用户的会话
 * @param sessionId 可选的会话ID，如果不提供则获取所有会话
 */
export async function getSessions(sessionId?: string): Promise<GetSessionsResponse | null> {
  try {
    const url = sessionId
      ? `${config.api}/chatSession/getSession?sessionId=${sessionId}`
      : `${config.api}/chatSession/getSession`

    const response = await http.get<GetSessionsResponse>(url)
    return response.data
  } catch (error) {
    console.error('获取会话失败:', error)
    return null
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
