import config from '../../config'
import http from '../../utils/http'
import { SendMessageRequest, SendMessageResponse } from './type'

// 枚举地址
enum API {
  SEND_MESSAGE_URL = '/chat/sendChat'
}

/**
 * 发送聊天消息
 * @param data 消息数据
 * @returns 发送结果
 */
export const sendMessage = (data: SendMessageRequest) => {
  return http.post<SendMessageResponse>(`${config.api}${API.SEND_MESSAGE_URL}`, data)
}
