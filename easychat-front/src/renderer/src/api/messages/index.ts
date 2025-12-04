import config from '../../config'
import http from '../../utils/http'
import { GetFriendRequestResponse, GetGroupInvitationsResponse } from './type'

// 枚举地址
enum API {
  // 获取好友请求接口
  GET_FRIEND_REQUEST_URL = '/messages/getFriendRequest',
  // 获取群组邀请接口
  GET_GROUP_INVITATIONS_URL = '/messages/getGroupInvitations'
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
