import config from '../../config'
import http from '../../utils/http'
import { SearchUserRequest, SearchUserResponse } from './type'

// 枚举地址
enum API {
  SEARCH_USER_URL = '/user/search'
}

/**
 * 通过chatId或email搜索用户
 * @param data 查询参数
 * @returns 搜索结果
 */
export const searchUser = async (data: SearchUserRequest): Promise<SearchUserResponse> => {
  const response = await http.post<SearchUserResponse>(`${config.api}${API.SEARCH_USER_URL}`, data)
  return response.data
}
