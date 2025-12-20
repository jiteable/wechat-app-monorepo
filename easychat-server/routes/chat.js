var express = require('express');
var router = express.Router();
const { db } = require('../db/db');
const { authenticateToken } = require('../middleware');
const { broadcastToSession } = require('../websocket/utils/broadcast');


/**
 * 获取聊天记录接口
 */
router.get('/getChat/:sessionId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    // 添加分页参数，默认值分别为0和50
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // 验证会话是否存在以及用户是否有权限访问该会话
    const session = await db.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        ChatSessionUsers: true
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: '会话不存在'
      });
    }

    // 检查用户是否属于该会话
    const isSessionUser = session.ChatSessionUsers.some(user => user.userId === userId);
    if (!isSessionUser) {
      return res.status(403).json({
        success: false,
        error: '您无权访问此会话'
      });
    }

    // 查询消息记录总数
    const totalMessages = await db.unifiedMessage.count({
      where: {
        sessionId: sessionId
      }
    });

    console.log('totalMessages: ', totalMessages)

    // 查询消息记录，按创建时间倒序排列（从新到旧）
    const messages = await db.unifiedMessage.findMany({
      where: {
        sessionId: sessionId
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
        file: {
          include: {
            video: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // 改为降序排列，获取最新的消息
      },
      skip: skip,
      take: limit
    });

    // 清零当前用户的未读计数
    await db.chatSessionUser.update({
      where: {
        sessionId_userId: {
          sessionId: sessionId,
          userId: userId
        }
      },
      data: {
        unreadCount: 0
      }
    });

    // 处理消息数据，确保视频文件的thumbnailUrl被包含
    const processedMessages = messages.map(message => {
      if (message.file && message.file.thumbnailUrl) {
        const processedMessage = {
          ...message,
          thumbnailUrl: message.file.thumbnailUrl
        };

        // 如果文件有关联的视频信息，也包含视频的宽度和高度
        if (message.file.video) {
          processedMessage.videoInfo = {
            videoWidth: message.file.video.width,
            videoHeight: message.file.video.height,
            duration: message.file.video.duration,
            bitrate: message.file.video.bitrate,
            codec: message.file.video.codec,
            fps: message.file.video.fps
          };
        }

        return processedMessage;
      }
      return message;
    });

    console.log('messsagesssaaaaaaaaaaaaaaaa: ', processedMessages)

    // 计算分页信息（由于改为降序，需要重新计算分页逻辑）
    const totalPages = Math.ceil(totalMessages / limit);
    console.log('totalPages: ', totalPages)
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        messages: processedMessages,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalMessages: totalMessages,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage
        }
      }
    });
  } catch (error) {
    console.error('获取消息失败:', error);
    // 添加更详细的错误信息
    res.status(500).json({
      success: false,
      error: '获取消息失败',
      message: error.message
    });
  }
});


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
      fileSize,
      mimeType,
      fileExtension,
      videoInfo, // 添加视频信息参数
      thumbnailUrl, // 添加缩略图URL参数
      duration, // 添加视频时长参数
      width, // 添加视频宽度参数
      height // 添加视频高度参数
    } = req.body;


    console.log('messagewaddawdawdwa: ', req.body)

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
    let messageContent = content;
    let messageMediaUrl = mediaUrl;
    let messageFileName = fileName;
    let messageFileSize = fileSize;
    let messageThumbnailUrl = thumbnailUrl; // 添加缩略图URL变量
    let messageVideoInfo = videoInfo; // 添加视频信息变量

    switch (messageType) {
      case 'text':
      case 'timestamp':
      case 'system':
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

        // 特别处理视频消息
        if (messageType === 'video') {
          messageThumbnailUrl = thumbnailUrl || null;
          messageVideoInfo = videoInfo || {};

          // 如果提供了单独的视频参数，则整合进videoInfo
          if (duration || width || height) {
            messageVideoInfo = {
              ...messageVideoInfo,
              duration: duration || messageVideoInfo.duration,
              width: width || messageVideoInfo.width,
              height: height || messageVideoInfo.height
            };
          }
        }

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
    if ((messageType === 'file' || messageType === 'video') && mediaUrl && fileName && fileSize) {
      // 简单判断文件类型
      let fileType = 'document';
      if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
        fileType = 'image';
      } else if (fileName.match(/\.(mp4|avi|mov|wmv|flv|mkv)$/i)) {
        fileType = 'video';
      } else if (fileName.match(/\.(mp3|wav|ogg|flac|m4a)$/i)) {
        fileType = 'audio';
      }

      // 准备视频信息（如果有的话）
      let fileVideoInfo = null;
      if (messageType === 'video' && messageVideoInfo) {
        fileVideoInfo = messageVideoInfo;
      }

      fileRecord = await db.file.create({
        data: {
          name: fileName,
          url: mediaUrl,
          size: fileSize,
          mimeType: mimeType || '', // 使用传入的mimeType，如果没有则为空字符串
          fileType: fileType,
          fileExtension: fileExtension || path.extname(fileName).toLowerCase(), // 使用传入的扩展名或从文件名提取
          uploaderId: senderId,
          thumbnailUrl: messageThumbnailUrl || null, // 将缩略图URL存储在文件记录中
          // 将视频信息存储在单独的video模型中，并与file建立关系
          video: messageVideoInfo ? {
            create: messageVideoInfo
          } : undefined
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
        mimeType: newMessage.file?.mimeType, // 添加mimeType字段
        fileExtension: newMessage.file?.fileExtension, // 添加fileExtension字段
        timestamp: newMessage.createdAt
      }
    };

    // 从文件记录中获取视频相关信息
    if (newMessage.file && newMessage.file.thumbnailUrl) {
      messageToSend.data.thumbnailUrl = newMessage.file.thumbnailUrl;
    }

    if (newMessage.file && newMessage.file.video) {
      messageToSend.data.videoInfo = newMessage.file.video;
    }

    // 获取WebSocket客户端映射
    const { getWebSocketClients } = require('../websocket/clients');
    const clients = getWebSocketClients();

    // 如果成功获取到客户端映射，则使用broadcastToSession广播消息
    if (clients) {
      broadcastToSession(clients, session, messageToSend, senderId);
    }

    // 返回成功响应
    const responseData = {
      success: true,
      data: {
        messageId: newMessage.id,
        sessionId: newMessage.sessionId,
        senderId: newMessage.senderId,
        messageType: newMessage.messageType,
        content: newMessage.content,
        fileName: newMessage.fileName,
        fileSize: newMessage.fileSize,
        mimeType: newMessage.file?.mimeType, // 添加mimeType字段
        fileExtension: newMessage.file?.fileExtension, // 添加fileExtension字段
        createdAt: newMessage.createdAt
      },
      message: '消息发送成功'
    };

    // 从文件记录中获取视频相关信息
    if (newMessage.file && newMessage.file.thumbnailUrl) {
      responseData.data.thumbnailUrl = newMessage.file.thumbnailUrl;
    }

    if (newMessage.file && newMessage.file.video) {
      responseData.data.videoInfo = newMessage.file.video;
    }

    console.log('responseData: ', responseData)

    res.status(201).json(responseData);
  } catch (error) {
    console.error('发送消息失败:', error);
    res.status(500).json({
      success: false,
      error: '发送消息失败'
    });
  }
});

/**
 * 获取用户所有聊天记录接口
 */
router.get('/getAllChat', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 查询用户参与的所有会话
    const sessions = await db.chatSession.findMany({
      where: {
        ChatSessionUsers: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        ChatSessionUsers: true
      }
    });

    // 获取所有会话的ID
    const sessionIds = sessions.map(session => session.id);

    // 查询所有消息记录
    const messages = await db.unifiedMessage.findMany({
      where: {
        sessionId: {
          in: sessionIds
        }
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
        file: {
          include: {
            video: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 处理消息数据，确保视频文件的thumbnailUrl被包含
    const processedMessages = messages.map(message => {
      if (message.file && message.file.thumbnailUrl) {
        const processedMessage = {
          ...message,
          thumbnailUrl: message.file.thumbnailUrl
        };

        // 如果文件有关联的视频信息，也包含视频的宽度和高度
        if (message.file.video) {
          processedMessage.videoInfo = {
            videoWidth: message.file.video.width,
            videoHeight: message.file.video.height,
            duration: message.file.video.duration,
            bitrate: message.file.video.bitrate,
            codec: message.file.video.codec,
            fps: message.file.video.fps
          };
        }

        return processedMessage;
      }
      return message;
    });

    console.log('processedMessages: ', processedMessages[0])

    res.json({
      success: true,
      data: processedMessages
    });
  } catch (error) {
    console.error('获取所有消息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取所有消息失败',
      message: error.message
    });
  }
});

/**
 * 标记会话中的消息为已读
 */
router.post('/markAsRead/:sessionId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    // 验证会话是否存在以及用户是否有权限访问该会话
    const session = await db.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        ChatSessionUsers: true
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: '会话不存在'
      });
    }

    // 检查用户是否属于该会话
    const isSessionUser = session.ChatSessionUsers.some(user => user.userId === userId);
    if (!isSessionUser) {
      return res.status(403).json({
        success: false,
        error: '您无权访问此会话'
      });
    }

    // 更新会话中用户未读计数为0
    await db.chatSessionUser.update({
      where: {
        sessionId_userId: {
          sessionId: sessionId,
          userId: userId
        }
      },
      data: {
        unreadCount: 0
      }
    });

    res.json({
      success: true,
      message: '消息已标记为已读'
    });
  } catch (error) {
    console.error('标记消息为已读失败:', error);
    res.status(500).json({
      success: false,
      error: '标记消息为已读失败'
    });
  }
});


module.exports = router;