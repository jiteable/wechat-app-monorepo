import http from '../../utils/http'
import config from '../../config'
import type {
  UpdateGroupInfoParams,
  UpdateSessionRemarkParams,
  UpdateUserNicknameInGroupParams,
  BaseResponse
} from './type'

enum API {
  UPDATE_GROUP_INFO_URL = '/editGroup/groupUpdate',
  UPDATE_SESSION_REMARK_URL = '/editGroup/sessionRemark',
  UPDATE_USER_NICKNAME_IN_GROUP_URL = '/editGroup/memberNickname'
}

/**
 * 更新群组信息（群名、公告）
 * @param params 群组信息更新参数
 * @returns Promise<BaseResponse>
 */
export const updateGroupInfo = async (params: UpdateGroupInfoParams): Promise<BaseResponse> => {
  const response = await http.put<BaseResponse>(`${config.api}${API.UPDATE_GROUP_INFO_URL}`, params)
  return response.data
}

/**
 * 更新会话备注
 * @param params 会话备注更新参数
 * @returns Promise<BaseResponse>
 */
export const updateSessionRemark = async (
  params: UpdateSessionRemarkParams
): Promise<BaseResponse> => {
  const response = await http.put<BaseResponse>(
    `${config.api}${API.UPDATE_SESSION_REMARK_URL}`,
    params
  )
  return response.data
}

/**
 * 更新用户在群组中的昵称
 * @param params 用户昵称更新参数
 * @returns Promise<BaseResponse>
 */
export const updateUserNicknameInGroup = async (
  params: UpdateUserNicknameInGroupParams
): Promise<BaseResponse> => {
  const response = await http.put<BaseResponse>(
    `${config.api}${API.UPDATE_USER_NICKNAME_IN_GROUP_URL}`,
    params
  )
  return response.data
}
