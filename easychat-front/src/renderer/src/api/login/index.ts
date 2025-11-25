import axios from 'axios'
import { Encrypt } from '../../utils/aes'
import config from '../../config'

// 登录接口
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  token: string
  user: {
    id: number
    email: string
  }
}

/**
 * 用户登录
 * @param data 登录信息
 * @returns 登录响应
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  // 对密码进行AES加密
  const encryptedPassword = Encrypt(data.password)

  // 构造请求数据
  const requestData = {
    email: data.email,
    password: encryptedPassword
  }

  // Deleted:  try {
  const response = await axios.post<LoginResponse>(`${config.api}/login`, requestData)
  return response.data
  // Deleted:  } catch (error) {
  // Deleted:    throw error
  // Deleted:  }
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
  // Deleted:  try {
  const response = await axios.post<SendVerifyCodeResponse>(`${config.api}/send-verify-code`, data)
  return response.data
  // Deleted:  } catch (error) {
  // Deleted:    throw error
  // Deleted:  }
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

  // Deleted:  try {
  const response = await axios.post<RegisterResponse>(`${config.api}/register`, requestData)
  return response.data
  // Deleted:  } catch (error) {
  // Deleted:    throw error
  // Deleted:  }
}
