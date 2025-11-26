import { Encrypt } from '../../utils/aes'
import config from '../../config'
import { LoginRequest, LoginResponse } from './type'
import http from '@renderer/utils/http'

// 枚举地址
enum API {
  // 登录接口
  LOGIN_URL = '/login',
  // 发送验证码接口
  SEND_VERIFY_CODE_URL = '/register/send-verify-code',
  // 注册接口
  REGISTER_URL = '/register'
}

/**
 * 用户登录
 * @param data 登录信息
 * @returns 登录响应
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  // 对密码进行AES加密
  const encryptedPassword = Encrypt(data.password)

  console.log('encryptedPassword 1: ', encryptedPassword)

  // 构造请求数据
  const requestData = {
    email: data.email,
    password: encryptedPassword
  }

  const response = await http.post<LoginResponse>(`${config.api}${API.LOGIN_URL}`, requestData)
  return response.data
}

// 发送验证码接口
export interface SendVerifyCodeRequest {
  email: string
}

export interface SendVerifyCodeResponse {
  message: string
}

/**
 * 发送验证码
 * @param data 邮箱信息
 */
export const sendVerifyCode = async (data: SendVerifyCodeRequest) => {
  const response = await http.post<SendVerifyCodeResponse>(
    `${config.api}${API.SEND_VERIFY_CODE_URL}`,
    data
  )
  return response.data
}

// 注册接口
export interface RegisterRequest {
  email: string
  username: string
  password: string
  verifyCode: string
}

export interface RegisterResponse {
  message: string
}

/**
 * 用户注册
 * @param data 注册信息
 * @returns 注册响应
 */
export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
  // 对密码进行AES加密
  const encryptedPassword = Encrypt(data.password)

  // 构造请求数据
  const requestData = {
    email: data.email,
    username: data.username,
    password: encryptedPassword,
    verifyCode: data.verifyCode
  }

  const response = await http.post<RegisterResponse>(
    `${config.api}${API.REGISTER_URL}`,
    requestData
  )
  return response.data
}
