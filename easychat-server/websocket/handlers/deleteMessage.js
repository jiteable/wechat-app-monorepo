const WebSocket = require('ws');
const { broadcastToSession } = require('../utils/broadcast');
const { db } = require('../../db/db');

/**
 * 处理删除消息
 * @param {WebSocket} ws WebSocket连接
 * @param {Object} data 删除消息数据
 * @param {Map} clients 客户端连接映射
 */
async function handleDeleteMessage(ws, data, clients) {
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

    if (!data.messageId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '缺少消息ID'
      }));
      return;
    }

    // 验证消息是否属于当前用户或当前会话
    const message = await db.unifiedMessage.findUnique({
      where: { id: data.messageId },
      include: {
        sender: true
      }
    });

    if (!message) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '消息不存在'
      }));
      return;
    }

    // 检查用户是否有权限删除此消息（可以是消息发送者或群管理员等）
    // 这里简化处理，只允许消息发送者删除自己的消息
    if (message.senderId !== ws.userId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '没有权限删除此消息'
      }));
      return;
    }

    // 从数据库中删除消息
    await db.unifiedMessage.update({
      where: { id: data.messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    // 构造要广播的删除消息对象
    const messageToSend = {
      type: 'delete_message',
      messageId: data.messageId,
      sessionId: data.sessionId,
      senderId: ws.userId,
      sender: message.sender || {
        id: ws.userId
      },
      timestamp: new Date().toISOString()
    };

    // 获取会话信息
    const session = await db.chatSession.findUnique({
      where: { id: data.sessionId },
      include: {
        ChatSessionUsers: {
          include: {
            user: true
          }
        },
        group: {
          include: {
            members: true
          }
        }
      }
    });

    if (session) {
      // 广播删除消息给会话中的所有参与者
      broadcastToSession(clients, session, messageToSend, null); // 不排除任何人，因为所有人都需要知道消息被删除了
    }

    await db.unifiedMessage.update({
      where: { id: data.messageId },
      data: {
        isDeleted: true,  // 标记为已删除
        deletedAt: new Date()  // 记录删除时间
      }
    });

    // 同时也发给发送者本人确认
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'delete_message_confirmation',
        messageId: data.messageId,
        success: true
      }));
    }

    console.log(`消息已删除并广播，消息ID: ${data.messageId}，会话ID: ${data.sessionId}`);
  } catch (error) {
    console.error('处理删除消息出错:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: '删除消息失败'
    }));
  }
}

module.exports = handleDeleteMessage;