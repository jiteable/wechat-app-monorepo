/* eslint-disable @typescript-eslint/no-explicit-any */
import WebSocket from 'ws'

const NODE_ENV = process.env.NODE_ENV

let ws: WebSocket | null = null
let wsUrl: string | null = null
let sender: any = null
let needReconnect: boolean = true
let maxReConnectTimes: number = 5
let lockReconnect: boolean = false
let reconnectTimeout: NodeJS.Timeout | null = null
let heartbeatInterval: NodeJS.Timeout | null = null
let userId: string | null = null

const initWs = (config: any, _sender: any) => {
  // 使用相对地址而不是硬编码的本地地址
  wsUrl = `ws://localhost:3000/ws`

  sender = _sender
  userId = config.userId || null
  needReconnect = true
  maxReConnectTimes = 5
  createWs()
}

const closeWs = () => {
  needReconnect = false

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }

  if (ws) {
    ws.close()
    ws = null
  }
}

const createWs = () => {
  // 防止重复连接
  if (lockReconnect) {
    console.log('WebSocket connection is locked, returning...')
    return
  }

  if (wsUrl == null) {
    console.error('WebSocket URL is not set')
    return
  }

  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    console.log('WebSocket is already connecting or open, returning...')
    return
  }

  lockReconnect = true
  console.log('Creating WebSocket connection to:', wsUrl)

  try {
    ws = new WebSocket(wsUrl)
    console.log('WebSocket instance created')

    ws.onopen = function () {
      console.log('客户端WebSocket连接成功')
      lockReconnect = false

      // 重置重连次数
      maxReConnectTimes = 5

      // 发送认证消息
      if (userId) {
        const authMessage = JSON.stringify({
          type: 'auth',
          userId: userId
        })
        console.log('Sending auth message:', authMessage)
        ws!.send(authMessage)
      }

      // 启动心跳机制(每30秒发送一次心跳)
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
      }

      heartbeatInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          const pingMessage = JSON.stringify({
            type: 'ping'
          })
          console.log('Sending ping message:', pingMessage)
          ws.send(pingMessage)
        }
      }, 30000)
    }

    // 从服务器接收到信息的回调函数
    ws.onmessage = async function (e) {
      try {
        const data = JSON.parse(e.data)

        switch (data.type) {
          case 'connection_success':
            console.log('WebSocket认证成功:', data.message)
            break

          case 'pong':
            console.log('收到心跳回应')
            break

          case 'new_message':
            // 处理新消息
            if (sender) {
              sender.handleNewMessage(data)
            }
            break

          default:
            console.log('收到未知类型消息:', data)
        }
      } catch (error) {
        console.error('解析WebSocket消息失败:', error)
      }
    }

    ws.onclose = function () {
      console.log('WebSocket连接已关闭')
      // ... existing code ...
    }

    ws.onerror = function (error) {
      console.error('WebSocket连接出错:', error)
      console.log('WebSocket readyState:', ws?.readyState)

      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
        heartbeatInterval = null
      }
    }
  } catch (error) {
    console.error('创建WebSocket连接失败:', error)
    lockReconnect = false

    // 出错时也尝试重连
    if (needReconnect && maxReConnectTimes > 0) {
      maxReConnectTimes--
      console.log(`WebSocket尝试重连，剩余次数: ${maxReConnectTimes}`)
      reconnectTimeout = setTimeout(() => {
        createWs()
      }, 5000)
    }
  }
}

// 发送消息的方法
const sendMessage = (message: any) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
  } else {
    console.warn('WebSocket未连接，无法发送消息')
  }
}

export { initWs, closeWs, createWs, sendMessage }
