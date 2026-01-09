import config from '../../config'
import http from '../../utils/http'
import { AddFriendRequest, AddFriendResponse } from './type'

// 枚举地址
enum API {
  ADD_FRIEND_URL = '/add/addFriend'
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
