const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * 处理聊天消息
 * @param {import('ws').WebSocket} ws WebSocket连接
 * @param {*} message 消息对象
 * @param {import('ws').WebSocketServer} wss WebSocket服务器实例
 */
async function handleChatMessage(ws, message, wss) {
  try {
    // 确保用户已经认证
    if (!ws.userId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '未认证的用户'
      }));
      return;
    }

    const { content, toUserId } = message.data;

    // 保存消息到数据库
    const chatMessage = await prisma.message.create({
      data: {
        content,
        fromUserId: ws.userId,
        toUserId
      }
    });

    // 构造返回的消息格式
    const messageToSend = {
      type: 'new_message',
      data: {
        id: chatMessage.id,
        content: chatMessage.content,
        fromUserId: chatMessage.fromUserId,
        toUserId: chatMessage.toUserId,
        timestamp: chatMessage.createdAt
      }
    };

    // 发送给目标用户（如果在线）
    wss.clients.forEach(client => {
      if (client.userId === toUserId && client.readyState === client.OPEN) {
        client.send(JSON.stringify(messageToSend));
      }
    });

    // 同时也发给自己用于确认
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(messageToSend));
    }
  } catch (error) {
    console.error('处理聊天消息出错:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: '发送消息失败'
    }));
  }
}

module.exports = handleChatMessage;