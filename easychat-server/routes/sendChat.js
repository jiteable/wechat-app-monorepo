var express = require('express');
var router = express.Router();
const { db } = require('../db/db');
const { authenticateToken } = require('../middleware');
const { broadcastToSession } = require('../websocket/utils/broadcast');

/**
 * 发送聊天消息接口
 */
router.post('/sendChat', authenticateToken, async (req, res) => {
  try {
    const senderId = req.user.id;
    const {
      sessionId,
      receiverId,
      groupId,
      messageType,
      content,
      mediaUrl,
      fileName,
      fileSize
    } = req.body;

    console.log('message: ', req.body)

    // 参数校验
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: '缺少会话ID'
      });
    }

    if (!messageType) {
      return res.status(400).json({
        success: false,
        error: '缺少消息类型'
      });
    }

    // 验证会话是否存在以及用户是否有权限发送消息
    const session = await db.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        ChatSessionUsers: true,
        group: true
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: '会话不存在'
      });
    }

    // 检查发送者是否属于该会话
    const isSessionUser = session.ChatSessionUsers.some(user => user.userId === senderId);
    if (!isSessionUser) {
      return res.status(403).json({
        success: false,
        error: '您无权在此会话中发送消息'
      });
    }

    // 根据消息类型构建消息内容
    let messageContent = '';
    let messageMediaUrl = null;
    let messageFileName = null;
    let messageFileSize = null;

    switch (messageType) {
      case 'text':
      case 'emoji':
        if (!content) {
          return res.status(400).json({
            success: false,
            error: '文本消息必须包含内容'
          });
        }
        messageContent = content;
        break;

      case 'image':
      case 'video':
      case 'voice':
      case 'file':
        if (!mediaUrl) {
          return res.status(400).json({
            success: false,
            error: '媒体消息必须包含媒体URL'
          });
        }
        messageContent = content || ''; // 可选的描述内容
        messageMediaUrl = mediaUrl;

        if (messageType === 'file') {
          if (!fileName || !fileSize) {
            return res.status(400).json({
              success: false,
              error: '文件消息必须包含文件名和文件大小'
            });
          }
          messageFileName = fileName;
          messageFileSize = fileSize;
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          error: '不支持的消息类型'
        });
    }

    // 创建消息记录
    const messageData = {
      sessionId,
      senderId,
      receiverId: receiverId || null,
      groupId: groupId || null,
      content: messageContent,
      messageType,
      mediaUrl: messageMediaUrl,
      fileName: messageFileName,
      fileSize: messageFileSize
    };

    // 如果是文件类型，同时创建文件记录
    let fileRecord = null;
    if (messageType === 'file' && mediaUrl && fileName && fileSize) {
      // 简单判断文件类型
      let fileType = 'document';
      if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
        fileType = 'image';
      } else if (fileName.match(/\.(mp4|avi|mov|wmv|flv|mkv)$/i)) {
        fileType = 'video';
      } else if (fileName.match(/\.(mp3|wav|ogg|flac|m4a)$/i)) {
        fileType = 'audio';
      }

      fileRecord = await db.file.create({
        data: {
          name: fileName,
          url: mediaUrl,
          size: fileSize,
          mimeType: '', // 前端暂未提供，可后续补充
          fileType: fileType,
          uploaderId: senderId
        }
      });
    }

    const newMessage = await db.unifiedMessage.create({
      data: {
        ...messageData,
        file: fileRecord ? { connect: { id: fileRecord.id } } : undefined
      },
      include: {
        sender: {
          select: {
            id: true,
            chatId: true,
            username: true,
            email: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            chatId: true,
            username: true,
            email: true,
            avatar: true
          }
        },
        group: true,
        file: true
      }
    });

    // 更新会话的最后更新时间
    await db.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() }
    });

    // 更新会话中其他用户的未读计数
    await db.chatSessionUser.updateMany({
      where: {
        sessionId: sessionId,
        NOT: { userId: senderId }
      },
      data: {
        unreadCount: { increment: 1 }
      }
    });

    // 通过WebSocket广播消息给会话中的其他用户
    const messageToSend = {
      type: 'new_message',
      data: {
        id: newMessage.id,
        sessionId: newMessage.sessionId,
        senderId: newMessage.senderId,
        content: newMessage.content,
        messageType: newMessage.messageType,
        mediaUrl: newMessage.mediaUrl,
        fileName: newMessage.fileName,
        fileSize: newMessage.fileSize,
        timestamp: newMessage.createdAt
      }
    };

    // 获取WebSocket客户端映射
    const { getWebSocketClients } = require('../websocket/clients');
    const clients = getWebSocketClients();

    // 如果成功获取到客户端映射，则使用broadcastToSession广播消息
    if (clients) {
      broadcastToSession(clients, session, messageToSend, senderId);
    }

    // 返回成功响应
    res.status(201).json({
      success: true,
      data: {
        messageId: newMessage.id,
        sessionId: newMessage.sessionId,
        senderId: newMessage.senderId,
        messageType: newMessage.messageType,
        content: newMessage.content,
        fileName: newMessage.fileName,
        fileSize: newMessage.fileSize,
        timestamp: newMessage.createdAt
      },
      message: '消息发送成功'
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    res.status(500).json({
      success: false,
      error: '发送消息失败'
    });
  }
});

module.exports = router;