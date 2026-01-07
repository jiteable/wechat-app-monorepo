import config from '../../config'
import http from '../../utils/http'
import {
  AddFriendRequest,
  AddFriendResponse,
  AddMembersToGroupRequest,
  AddMembersToGroupResponse
} from './type'

// 枚举地址
enum API {
  ADD_FRIEND_URL = '/add/addFriend',
  ADD_MEMBERS_TO_GROUP_URL = '/add/addMembersToGroup'
}

/**
 * 添加好友
 * @param data 包含要添加好友的用户ID
 * @returns 添加结果
 */
export const addFriend = async (data: AddFriendRequest): Promise<AddFriendResponse> => {
  const response = await http.post<AddFriendResponse>(`${config.api}${API.ADD_FRIEND_URL}`, data)
  return response.data
}

export const addMembersToGroup = async (
  data: AddMembersToGroupRequest
): Promise<AddMembersToGroupResponse> => {
  const response = await http.post<AddMembersToGroupResponse>(
    `${config.api}${API.ADD_MEMBERS_TO_GROUP_URL}`,
    data
  )
  return response.data
}
