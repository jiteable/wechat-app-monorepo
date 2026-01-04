<template>
  <div></div>
</template>

<script setup>
import { onMounted } from 'vue'
import { getUserInfo } from '@/api/user'

// 解析JWT令牌
function parseJwt(token) {
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
function isTokenExpired(token) {
  const parsedToken = parseJwt(token)
  if (!parsedToken || !parsedToken.exp) {
    return true
  }

  // 获取当前时间戳（秒）
  const currentTime = Math.floor(Date.now() / 1000)

  // 检查是否过期
  return parsedToken.exp < currentTime
}

onMounted(async () => {
  // 检查是否存在TOKEN以及是否过期
  const token = localStorage.getItem('TOKEN')

  let tokenValid = false
  let userId = null

  if (token) {
    try {
      // 检查token是否过期
      if (!isTokenExpired(token)) {
        tokenValid = true
        // 只有在令牌有效的情况下才获取用户信息
        const userInfo = await getUserInfo()
        userId = userInfo.userId
      }
    } catch (error) {
      console.error('Error checking token expiration or getting user info:', error)
      tokenValid = false
    }
  }

  // 通过IPC将结果发送回主进程
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('token-check-result', tokenValid, userId)
  }
})
</script>
