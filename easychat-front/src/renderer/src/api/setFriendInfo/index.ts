import config from '../../config'
import http from '../../utils/http'
import {
  GetUserLabelsResponse,
  AddUserLabelRequest,
  AddUserLabelResponse,
  RemoveUserLabelRequest,
  RemoveUserLabelResponse,
  SetFriendInfoRequest,
  SetFriendInfoResponse
} from './type'

// 枚举API地址
enum API {
  GET_USER_LABELS_URL = '/setFriendInfo/userLabels',
  ADD_USER_LABEL_URL = '/setFriendInfo/addUserLabel',
  REMOVE_USER_LABEL_URL = '/setFriendInfo/removeUserLabel',
  SET_FRIEND_INFO_URL = '/setFriendInfo/setFriendInfo'
}

/**
 * 获取当前用户的标签列表
 * @returns 用户标签列表
 */
export const getUserLabels = async (): Promise<GetUserLabelsResponse> => {
  const response = await http.get<GetUserLabelsResponse>(`${config.api}${API.GET_USER_LABELS_URL}`)
  return response.data
}

/**
 * 添加单个标签
 * @param data 包含要添加的标签名称
 * @returns 添加结果
 */
export const addUserLabel = async (data: AddUserLabelRequest): Promise<AddUserLabelResponse> => {
  const response = await http.post<AddUserLabelResponse>(
    `${config.api}${API.ADD_USER_LABEL_URL}`,
    data
  )
  return response.data
}

/**
 * 删除单个标签
 * @param data 包含要删除的标签名称
 * @returns 删除结果
 */
export const removeUserLabel = async (
  data: RemoveUserLabelRequest
): Promise<RemoveUserLabelResponse> => {
  const response = await http.post<RemoveUserLabelResponse>(
    `${config.api}${API.REMOVE_USER_LABEL_URL}`,
    data
  )
  return response.data
}

/**
 * 设置好友标签
 * @param data 包含好友ID和标签数组
 * @returns 设置结果
 */
export const setFriendInfo = async (
  data: SetFriendInfoRequest
): Promise<SetFriendInfoResponse> => {
  const response = await http.post<SetFriendInfoResponse>(
    `${config.api}${API.SET_FRIEND_INFO_URL}`,
    data
  )
  return response.data
}
