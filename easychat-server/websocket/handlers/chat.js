const WebSocket = require('ws');
const { broadcastToSession } = require('../utils/broadcast');

/**
 * 处理聊天消息 - 基于会话ID的优先策略
 * @param {WebSocket} ws WebSocket连接
 * @param {Object} data 消息数据
 * @param {Map} clients 客户端连接映射
 */
async function handleChatMessage(ws, data, clients) {
  try {
    // 确保用户已经认证
    if (!ws.userId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '用户未认证'
      }));
      return;
    }

    // 检查必要的参数
    if (!data.sessionId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '缺少会话ID'
      }));
      return;
    }

    // 这里的WebSocket只负责实时推送消息
    // 构造要广播的消息对象
    const messageToSend = {
      type: 'new_message',
      data: {
        id: newMessage.id,
        sessionId: newMessage.sessionId,
        sender: {
          id: newMessage.sender.id,
          username: newMessage.sender.username,
          avatar: newMessage.sender.avatar
        },
        content: newMessage.content,
        messageType: newMessage.messageType,
        mediaUrl: newMessage.mediaUrl,
        fileName: newMessage.fileName,
        fileSize: newMessage.fileSize,
        timestamp: newMessage.createdAt
      }
    };

    // 如果提供了会话信息，则通过会话广播消息
    if (data.session) {
      // 通过会话广播消息给所有参与者（除了发送者自己）
      broadcastToSession(clients, data.session, messageToSend, ws.userId);
    } else {
      // 如果没有提供会话信息，则至少发送给指定的目标用户
      // 这是一种后备机制
      if (data.targetUserId) {
        const targetClient = clients.get(data.targetUserId);
        if (targetClient && targetClient.readyState === WebSocket.OPEN) {
          targetClient.send(JSON.stringify(messageToSend));
        }
      }
    }

    // 同时也发给发送者本人，用于确认消息已送达
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(messageToSend));
    }

    console.log(`消息已通过WebSocket推送，会话ID: ${data.sessionId}`);
  } catch (error) {
    console.error('处理聊天消息出错:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: '发送消息失败'
    }));
  }
}

module.exports = handleChatMessage;