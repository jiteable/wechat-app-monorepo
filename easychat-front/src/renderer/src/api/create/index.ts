import config from '../../config'
import http from '../../utils/http'
import { CreateGroupRequest, CreateGroupResponse } from './type'

enum API {
  CREATE_GROUP_URL = '/create/createGroup'
}

/**
 * 创建群聊
 * @param data 包含群聊名称和成员ID列表
 * @returns 创建结果
 */
export const createGroup = async (data: CreateGroupRequest): Promise<CreateGroupResponse> => {
  const response = await http.post<CreateGroupResponse>(
    `${config.api}${API.CREATE_GROUP_URL}`,
    data
  )
  return response.data
}
