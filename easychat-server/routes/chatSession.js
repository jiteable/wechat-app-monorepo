var express = require('express');
var router = express.Router();
const { db } = require('../db/db');
const { authenticateToken } = require('../middleware');

router.get('/getSession', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id; // 当前登录用户ID

    // 查询当前用户参与的所有会话
    const sessions = await db.chatSession.findMany({
      where: {
        ChatSessionUsers: {
          some: {
            userId: currentUserId
          }
        }
      },
      include: {
        ChatSessionUsers: {
          include: {
            user: {
              select: {
                id: true,
                chatId: true,
                username: true,
                email: true,
                avatar: true,
                gender: true,
                signature: true,
                region: true
              }
            }
          }
        },
        group: true,
        unifiedMessages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1 // 获取最新的消息
        }
      },
      orderBy: {
        updatedAt: 'desc' // 按更新时间倒序排列
      }
    });

    // 处理会话数据，构建返回格式
    const sessionList = sessions.map(session => {
      // 获取当前用户的会话关系信息
      const currentUserSessionInfo = session.ChatSessionUsers.find(userSession => userSession.userId === currentUserId);

      // 获取会话中的其他用户（对于私聊）
      const otherUsers = session.ChatSessionUsers.filter(userSession => userSession.userId !== currentUserId);

      let displayName, displayAvatar;

      if (session.sessionType === 'private' && otherUsers.length > 0) {
        // 私聊会话
        const otherUser = otherUsers[0].user;
        // 使用自定义备注名或对方用户名
        displayName = currentUserSessionInfo?.customRemark || otherUser.username || otherUser.email;
        displayAvatar = otherUser.avatar;
      } else if (session.sessionType === 'group' && session.group) {
        // 群聊会话
        displayName = session.name || session.group.name;
        displayAvatar = session.avatar || session.group.image;
      } else {
        // 默认情况
        displayName = session.name;
        displayAvatar = session.avatar;
      }

      return {
        id: session.id,
        sessionType: session.sessionType,
        name: displayName,
        avatar: displayAvatar,
        ownerId: session.ownerId,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        isPinned: currentUserSessionInfo?.isPinned || false,
        isMuted: currentUserSessionInfo?.isMuted || false,
        unreadCount: currentUserSessionInfo?.unreadCount || 0,
        lastMessage: session.unifiedMessages.length > 0 ? session.unifiedMessages[0] : null,
        group: session.group || null
      };
    });

    res.json({
      success: true,
      data: sessionList
    });
  } catch (error) {
    console.error('获取会话失败:', error);
    res.status(500).json({
      success: false,
      error: '获取会话失败'
    });
  }
});

// 创建会话
router.post('/createSession', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { sessionType, name, avatar, userIds, groupId } = req.body;

    // 参数校验
    if (!sessionType || !['private', 'group'].includes(sessionType)) {
      return res.status(400).json({
        success: false,
        error: '会话类型不能为空且必须是 private 或 group'
      });
    }

    if (sessionType === 'private' && (!userIds || userIds.length !== 2 || !userIds.includes(currentUserId))) {
      return res.status(400).json({
        success: false,
        error: '私聊会话必须包含当前用户和另一个用户'
      });
    }

    if (sessionType === 'group' && !groupId) {
      return res.status(400).json({
        success: false,
        error: '群聊会话必须提供群组ID'
      });
    }

    // 检查是否已经存在相同的私聊会话
    let existingSession = null;
    if (sessionType === 'private') {
      const otherUserId = userIds.find(id => id !== currentUserId);
      existingSession = await db.chatSession.findFirst({
        where: {
          sessionType: 'private',
          ChatSessionUsers: {
            every: {
              userId: { in: [currentUserId, otherUserId] }
            }
          }
        }
      });

      // 检查是否确实有两个用户在会话中
      if (existingSession) {
        const sessionUsers = await db.chatSessionUser.findMany({
          where: {
            sessionId: existingSession.id
          }
        });

        if (sessionUsers.length === 2) {
          return res.json({
            success: true,
            data: existingSession,
            message: '会话已存在'
          });
        }
      }
    }

    // 创建会话
    const sessionData = {
      sessionType,
      name: name || null,
      avatar: avatar || null,
      ownerId: sessionType === 'group' ? currentUserId : null,
      groupId: sessionType === 'group' ? groupId : null
    };

    const newSession = await db.chatSession.create({
      data: {
        ...sessionData,
        ChatSessionUsers: {
          create: userIds.map(userId => ({
            userId,
            sessionType,
            joinTime: new Date(),
            lastReadTime: new Date()
          }))
        }
      },
      include: {
        ChatSessionUsers: {
          include: {
            user: {
              select: {
                id: true,
                chatId: true,
                username: true,
                email: true,
                avatar: true,
                gender: true,
                signature: true,
                region: true
              }
            }
          }
        },
        group: sessionType === 'group' ? true : false
      }
    });

    res.status(201).json({
      success: true,
      data: newSession
    });
  } catch (error) {
    console.error('创建会话失败:', error);
    res.status(500).json({
      success: false,
      error: '创建会话失败'
    });
  }
});

module.exports = router;