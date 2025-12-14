import config from '../../config'
import http from '../../utils/http'
import {
  SendMessageRequest,
  SendMessageResponse,
  GetMessagesResponse,
  GetMessagesRequest
} from './type'

// 枚举地址
enum API {
  SEND_MESSAGE_URL = '/chat/sendChat',
  GET_MESSAGES_URL = '/chat/getChat',
  MARK_AS_READ_URL = '/chat/markAsRead/'
}

/**
 * 发送聊天消息
 * @param data 消息数据
 * @returns 发送结果
 */
export const sendMessage = (data: SendMessageRequest) => {
  return http.post<SendMessageResponse>(`${config.api}${API.SEND_MESSAGE_URL}`, data)
}

/**
 * 获取聊天记录
 * @param params 会话ID和分页参数
 * @returns 聊天记录和分页信息
 */
export const getMessages = (params: GetMessagesRequest) => {
  const { sessionId, page = 1, limit = 50 } = params
  return http.get<GetMessagesResponse>(`${config.api}${API.GET_MESSAGES_URL}/${sessionId}`, {
    params: {
      page,
      limit
    }
  })
}

/**
 * 标记会话中的消息为已读
 * @param sessionId 会话ID
 * @returns 标记结果
 */
export const markAsRead = (sessionId: string) => {
  return http.post(`${config.api}${API.MARK_AS_READ_URL}${sessionId}`)
}
