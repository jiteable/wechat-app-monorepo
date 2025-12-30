/* eslint-disable @typescript-eslint/no-explicit-any */
import WebSocket from 'ws'

interface WsConfig {
  userId?: string
}

interface MessageSender {
  handleNewMessage: (data: any) => void
  handleDeleteMessage: (data: any) => void
}

let ws: WebSocket | null = null
let wsUrl: string | null = null
let sender: MessageSender | null = null
let needReconnect: boolean = true
let maxReConnectTimes: number = 5
let lockReconnect: boolean = false
let reconnectTimeout: NodeJS.Timeout | null = null
let heartbeatInterval: NodeJS.Timeout | null = null
let userId: string | null = null

const WEBSOCKET_URL = 'ws://localhost:3000/ws'
const HEARTBEAT_INTERVAL = 30000
const RECONNECT_DELAY = 5000

const initWs = (config: WsConfig, _sender: MessageSender) => {
  wsUrl = WEBSOCKET_URL
  sender = _sender
  userId = config.userId || null
  needReconnect = true
  maxReConnectTimes = 5
  createWs()
}

const closeWs = () => {
  needReconnect = false
  cleanup()

  if (ws) {
    ws.close()
    ws = null
  }
}

const cleanup = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
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

      // 启动心跳机制
      setupHeartbeat()
    }

    // 从服务器接收到信息的回调函数
    ws.onmessage = async function (e) {
      try {
        // 确保以UTF-8格式解析消息
        let messageData
        if (typeof e.data === 'string') {
          messageData = e.data
        } else if (e.data instanceof ArrayBuffer) {
          // 将ArrayBuffer转换为UTF-8字符串
          const decoder = new TextDecoder('utf-8')
          messageData = decoder.decode(e.data)
        } else {
          // 处理Blob类型的数据
          const blob = e.data
          const arrayBuffer = await blob.arrayBuffer()
          const decoder = new TextDecoder('utf-8')
          messageData = decoder.decode(arrayBuffer)
        }

        const data = JSON.parse(messageData)

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
          case 'delete_message':
            //处理要删除的消息
            if (sender) {
              sender.handleDeleteMessage(data)
            }
            break
          case 'delete_message_confirmation':
            // 处理删除消息确认
            if (sender) {
              console.log('收到删除消息确认:', data)
            }
            break
          case 'server_message':
            // 处理服务器定时发送的消息
            // console.log('收到服务器定时消息:', data)
            // 可以在这里添加处理逻辑，比如显示通知等
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
      handleDisconnection()
    }

    ws.onerror = function (error) {
      console.error('WebSocket连接出错:', error)
      console.log('WebSocket readyState:', ws?.readyState)

      cleanup()
      handleDisconnection()
    }
  } catch (error) {
    console.error('创建WebSocket连接失败:', error)
    lockReconnect = false

    // 出错时也尝试重连
    handleReconnection()
  }
}

const setupHeartbeat = () => {
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
  }, HEARTBEAT_INTERVAL)
}

const handleDisconnection = () => {
  cleanup()
  handleReconnection()
}

const handleReconnection = () => {
  if (needReconnect && maxReConnectTimes > 0) {
    maxReConnectTimes--
    console.log(`WebSocket尝试重连，剩余次数: ${maxReConnectTimes}`)
    reconnectTimeout = setTimeout(() => {
      createWs()
    }, RECONNECT_DELAY)
  }
}

const sendMessage = (message: any) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    // 如果是发送聊天消息的请求，则直接发送到后端
    if (message.type === 'send_message') {
      ws.send(
        JSON.stringify({
          type: 'send_message', // 与后端路由保持一致
          data: message.data
        })
      )
    } else {
      // 其他类型的消息保持原有格式
      ws.send(JSON.stringify(message))
    }
  } else {
    console.warn('WebSocket未连接，无法发送消息')
  }
}

export { initWs, closeWs, createWs, sendMessage }
