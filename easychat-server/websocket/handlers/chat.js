const WebSocket = require('ws');
const { broadcastToSession } = require('../utils/broadcast');
const { db } = require('../../db/db'); // 添加数据库引用

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

    // 获取数据库中的完整消息记录
    const newMessage = await db.unifiedMessage.findUnique({
      where: { id: data.messageId || data.data?.id }, // 支持不同格式的ID
      include: {
        sender: true,
        file: true // 包含文件信息
      }
    });

    // 如果找不到消息，则使用传入的数据
    let messageData = newMessage;
    if (!newMessage && data.data) {
      messageData = data.data;
    }

    // 构造要广播的消息对象，包含所有必要字段
    const messageToSend = {
      type: 'new_message',
      data: {
        id: messageData.id,
        sessionId: messageData.sessionId,
        sender: messageData.sender || {
          id: messageData.senderId,
          username: data.data?.senderName || messageData.sender?.username, // 优先使用传入的senderName
          avatar: messageData.senderAvatar || messageData.sender?.avatar
        },
        content: messageData.content,
        messageType: messageData.messageType || messageData.type, // 支持不同的类型字段名
        mediaUrl: messageData.mediaUrl || messageData.imageUrl, // 支持不同的URL字段名
        fileName: messageData.fileName,
        fileSize: messageData.fileSize,
        fileExtension: messageData.fileExtension || messageData.file?.fileExtension, // 从文件对象或直接获取扩展名
        mimeType: messageData.mimeType || messageData.file?.mimeType, // 从文件对象或直接获取MIME类型
        timestamp: messageData.createdAt || messageData.timestamp || new Date().toISOString()
      }
    };

    // 广播消息给所有参与者
    if (data.session) {
      broadcastToSession(clients, data.session, messageToSend, ws.userId);
    }

    // 同时也发给发送者本人
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