// 引入AES源码js
import CryptoJS from 'crypto-js'
import config from '../config'

const key = CryptoJS.enc.Utf8.parse(config.AES_KEY!) // 十六位十六进制数作为密钥
const iv = CryptoJS.enc.Utf8.parse(config.AES_OFF!) // 十六位十六进制数作为密钥偏移量
// const key = CryptoJS.enc.Utf8.parse("bGvnMc62sh5RV6zP")
// const iv = CryptoJS.enc.Utf8.parse("1eZ43DLcYtV2xb3Y")

// 解密方法
export function Decrypt(word) {
  const encryptedHexStr = CryptoJS.enc.Hex.parse(word)
  const srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr)
  const decrypt = CryptoJS.AES.decrypt(srcs, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })
  const decryptedStr = decrypt.toString(CryptoJS.enc.Utf8)
  return decryptedStr.toString()
}

// 加密方法
export function Encrypt(word) {
  const srcs = CryptoJS.enc.Utf8.parse(word)
  const encrypted = CryptoJS.AES.encrypt(srcs, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })
  return encrypted.ciphertext.toString().toUpperCase()
}

// 解析JWT令牌
export function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        })
        .join('')
    )

    return JSON.parse(jsonPayload)
  } catch (error) {
    return null
  }
}

// 验证JWT令牌是否过期
export function isTokenExpired(token: string): boolean {
  const parsedToken = parseJwt(token)
  if (!parsedToken || !parsedToken.exp) {
    return true
  }

  // 获取当前时间戳（秒）
  const currentTime = Math.floor(Date.now() / 1000)

  // 检查是否过期
  return parsedToken.exp < currentTime
}
