import config from '../../config'
import http from '../../utils/http'
import {
  GetFriendRequestResponse,
  GetGroupInvitationsResponse,
  SendFriendRequestParams,
  SendGroupInvitationsParams,
  SendFriendRequestResponse,
  SendGroupInvitationsResponse,
  AcceptFriendRequestParams,
  RejectFriendRequestParams
} from './type'

// 枚举地址
enum API {
  // 获取好友请求接口
  GET_FRIEND_REQUEST_URL = '/messages/getFriendRequest',
  // 获取群组邀请接口
  GET_GROUP_INVITATIONS_URL = '/messages/getGroupInvitations',
  SEND_FRIEND_REQUEST_URL = '/messages/sendFriendRequest',
  SEND_GROUP_INVITATIONS_URL = '/messages/sendGroupInvitations',
  ACCEPT_FRIEND_REQUEST_URL = '/messages/acceptFriendRequest',
  REJECT_FRIEND_REQUEST_URL = '/messages/rejectFriendRequest'
}

/**
 * 获取好友请求
 * @returns 好友请求列表
 */
export const getFriendRequest = async (): Promise<GetFriendRequestResponse> => {
  const response = await http.get<GetFriendRequestResponse>(
    `${config.api}${API.GET_FRIEND_REQUEST_URL}`
  )
  return response.data
}

/**
 * 获取群组邀请
 * @returns 群组邀请列表
 */
export const getGroupInvitations = async (): Promise<GetGroupInvitationsResponse> => {
  const response = await http.get<GetGroupInvitationsResponse>(
    `${config.api}${API.GET_GROUP_INVITATIONS_URL}`
  )
  return response.data
}

/**
 * 发送好友请求
 * @param params 发送好友请求参数
 * @returns 请求结果
 */
export const sendFriendRequest = async (
  params: SendFriendRequestParams
): Promise<SendFriendRequestResponse> => {
  const response = await http.post<SendFriendRequestResponse>(
    `${config.api}${API.SEND_FRIEND_REQUEST_URL}`,
    params
  )
  return response.data
}

/**
 * 发送群组邀请
 * @param params 发送群组邀请参数
 * @returns 邀请结果
 */
export const sendGroupInvitations = async (
  params: SendGroupInvitationsParams
): Promise<SendGroupInvitationsResponse> => {
  const response = await http.post<SendGroupInvitationsResponse>(
    `${config.api}${API.SEND_GROUP_INVITATIONS_URL}`,
    params
  )
  return response.data
}

/**
 * 接受好友请求
 * @param requestId 好友请求ID
 * @returns 处理结果
 */
export const acceptFriendRequest = async (params: AcceptFriendRequestParams) => {
  const response = await http.post(`${config.api}${API.ACCEPT_FRIEND_REQUEST_URL}`, params)
  return response.data
}

/**
 * 拒绝好友请求
 * @param requestId 好友请求ID
 * @returns 处理结果
 */

export const rejectFriendRequest = async (params: RejectFriendRequestParams) => {
  const response = await http.post(`${config.api}${API.REJECT_FRIEND_REQUEST_URL}`, params)
  return response.data
}
