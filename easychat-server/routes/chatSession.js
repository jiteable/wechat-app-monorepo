var express = require('express');
var router = express.Router();
const { db } = require('../db/db');
const { authenticateToken } = require('../middleware');

router.get('/getSession', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id; // 当前登录用户ID
    const { contactUserId } = req.query; // 从查询参数中获取联系人用户ID

    console.log('contactUrlId: ', contactUserId)

    // 如果提供了contactUserId，则获取与指定联系人的会话，否则获取所有会话
    if (contactUserId) {
      // 查询与指定联系人的私聊会话
      const session = await db.chatSession.findFirst({
        where: {
          sessionType: 'private',
          ChatSessionUsers: {
            every: {
              userId: { in: [currentUserId, contactUserId] }
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
        }
      });

      // 检查是否确实有两个用户在会话中
      if (session) {
        const sessionUsers = await db.chatSessionUser.findMany({
          where: {
            sessionId: session.id
          }
        });

        if (sessionUsers.length !== 2) {
          return res.status(404).json({
            success: false,
            error: '会话不存在'
          });
        }
      } else {
        return res.status(404).json({
          success: false,
          error: '会话不存在'
        });
      }

      // 处理单个会话数据
      const currentUserSessionInfo = session.ChatSessionUsers.find(userSession => userSession.userId === currentUserId);
      const otherUsers = session.ChatSessionUsers.filter(userSession => userSession.userId !== currentUserId);

      let displayName, displayAvatar;

      if (session.sessionType === 'private' && otherUsers.length > 0) {
        // 私聊会话 - 使用为当前用户定制的显示名称和头像
        displayName = currentUserSessionInfo?.displayName || currentUserSessionInfo?.customRemark || otherUsers[0].user.username || otherUsers[0].user.email;
        displayAvatar = currentUserSessionInfo?.displayAvatar || otherUsers[0].user.avatar;
      } else if (session.sessionType === 'group' && session.group) {
        // 群聊会话
        displayName = session.name || session.group.name;
        displayAvatar = session.avatar || session.group.image;
      } else {
        // 默认情况
        displayName = session.name;
        displayAvatar = session.avatar;
      }

      // 查找私聊中的联系人ID
      let contactId = null;
      if (session.sessionType === 'private' && otherUsers.length > 0) {
        contactId = otherUsers[0].userId;
      }

      // 如果是群聊会话，获取群成员的部分信息
      let groupWithMembers = null;
      if (session.sessionType === 'group' && session.group) {
        // 获取群成员信息
        const memberUsers = await db.user.findMany({
          where: {
            id: {
              in: session.group.memberIds || []
            }
          },
          select: {
            id: true,
            username: true,
            avatar: true
          }
        });

        // 构造带有成员信息的群组对象
        groupWithMembers = {
          ...session.group,
          members: memberUsers.map(user => ({
            id: user.id,
            name: user.username,
            avatar: user.avatar
          }))
        };
      }

      const sessionData = {
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
        group: groupWithMembers || session.group || null,
        contactId: contactId // 添加联系人ID(限私聊)
      };

      return res.json({
        success: true,
        data: sessionData
      });
    } else {
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
      const sessionList = await Promise.all(sessions.map(async session => {
        // 获取当前用户的会话关系信息
        const currentUserSessionInfo = session.ChatSessionUsers.find(userSession => userSession.userId === currentUserId);

        // 获取会话中的其他用户（对于私聊）
        const otherUsers = session.ChatSessionUsers.filter(userSession => userSession.userId !== currentUserId);

        let displayName, displayAvatar;

        if (session.sessionType === 'private' && otherUsers.length > 0) {
          // 私聊会话 - 使用为当前用户定制的显示名称和头像
          displayName = currentUserSessionInfo?.displayName || currentUserSessionInfo?.customRemark || otherUsers[0].user.username || otherUsers[0].user.email;
          displayAvatar = currentUserSessionInfo?.displayAvatar || otherUsers[0].user.avatar;
        } else if (session.sessionType === 'group' && session.group) {
          // 群聊会话
          displayName = session.name || session.group.name;
          displayAvatar = session.avatar || session.group.image;
        } else {
          // 默认情况
          displayName = session.name;
          displayAvatar = session.avatar;
        }

        // 查找私聊中的联系人ID
        let contactId = null;
        if (session.sessionType === 'private' && otherUsers.length > 0) {
          contactId = otherUsers[0].userId;
        }

        // 如果是群聊会话，获取群成员的部分信息
        let groupWithMembers = null;
        if (session.sessionType === 'group' && session.group) {
          // 获取群成员信息
          const memberUsers = await db.user.findMany({
            where: {
              id: {
                in: session.group.memberIds || []
              }
            },
            select: {
              id: true,
              username: true,
              avatar: true
            }
          });

          // 构造带有成员信息的群组对象
          groupWithMembers = {
            ...session.group,
            members: memberUsers.map(user => ({
              id: user.id,
              name: user.username,
              avatar: user.avatar
            }))
          };
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
          group: groupWithMembers || session.group || null,
          contactId: contactId // 添加联系人ID(限私聊)
        };
      }));

      res.json({
        success: true,
        data: sessionList
      });
    }
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

    // 检查是否已经存在相同的群聊会话
    if (sessionType === 'group') {
      existingSession = await db.chatSession.findFirst({
        where: {
          sessionType: 'group',
          groupId: groupId
        }
      });

      if (existingSession) {
        return res.json({
          success: true,
          data: existingSession,
          message: '会话已存在'
        });
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

    // 获取用户详细信息（仅对私聊会话需要）
    let usersInfo = [];
    if (sessionType === 'private') {
      usersInfo = await db.user.findMany({
        where: {
          id: { in: userIds }
        },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true
        }
      });
    }

    const newSession = await db.chatSession.create({
      data: {
        ...sessionData,
        ChatSessionUsers: {
          create: userIds.map(userId => {
            // 对于私聊会话，设置各自看到的显示名称和头像
            let displayName = null;
            let displayAvatar = null;

            if (sessionType === 'private') {
              const userInfo = usersInfo.find(u => u.id === userId);
              const otherUserInfo = usersInfo.find(u => u.id !== userId);

              if (userInfo && otherUserInfo) {
                // 每个用户看到的是对方的信息
                displayName = otherUserInfo.username || otherUserInfo.email;
                displayAvatar = otherUserInfo.avatar;
              }
            }
            // 对于群聊会话，不设置个性化的 displayName 和 displayAvatar
            // 所有用户将看到相同的群聊名称和头像，这些信息存储在 ChatSession 的 name 和 avatar 字段中

            return {
              userId,
              sessionType,
              joinTime: new Date(),
              lastReadTime: new Date(),
              displayName,
              displayAvatar
            };
          })
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
        group: sessionType === 'group' ? true : false,
        unifiedMessages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1 // 获取最新的消息
        }
      }
    });

    const currentUserSessionInfo = newSession.ChatSessionUsers.find(userSession => userSession.userId === currentUserId);
    const otherUsers = newSession.ChatSessionUsers.filter(userSession => userSession.userId !== currentUserId);

    let displayName, displayAvatar;

    if (newSession.sessionType === 'private' && otherUsers.length > 0) {
      // 私聊会话 - 使用为当前用户定制的显示名称和头像
      displayName = currentUserSessionInfo?.displayName || currentUserSessionInfo?.customRemark || otherUsers[0].user.username || otherUsers[0].user.email;
      displayAvatar = currentUserSessionInfo?.displayAvatar || otherUsers[0].user.avatar;
    } else if (newSession.sessionType === 'group' && newSession.group) {
      // 群聊会话
      displayName = newSession.name || newSession.group.name;
      displayAvatar = newSession.avatar || newSession.group.image;
    } else {
      // 默认情况
      displayName = newSession.name;
      displayAvatar = newSession.avatar;
    }

    // 查找私聊中的联系人ID
    let contactId = null;
    if (newSession.sessionType === 'private' && otherUsers.length > 0) {
      contactId = otherUsers[0].userId;
    }

    // 如果是群聊会话，获取群成员的部分信息
    let groupWithMembers = null;
    if (newSession.sessionType === 'group' && newSession.group) {
      // 获取群成员信息
      const memberUsers = await db.user.findMany({
        where: {
          id: {
            in: newSession.group.memberIds || []
          }
        },
        select: {
          id: true,
          username: true,
          avatar: true
        }
      });

      // 构造带有成员信息的群组对象
      groupWithMembers = {
        ...newSession.group,
        members: memberUsers.map(user => ({
          id: user.id,
          name: user.username,
          avatar: user.avatar
        }))
      };
    }

    const formattedSession = {
      id: newSession.id,
      sessionType: newSession.sessionType,
      name: displayName,
      avatar: displayAvatar,
      ownerId: newSession.ownerId,
      createdAt: newSession.createdAt,
      updatedAt: newSession.updatedAt,
      isPinned: currentUserSessionInfo?.isPinned || false,
      isMuted: currentUserSessionInfo?.isMuted || false,
      unreadCount: currentUserSessionInfo?.unreadCount || 0,
      lastMessage: newSession.unifiedMessages.length > 0 ? newSession.unifiedMessages[0] : null,
      group: groupWithMembers || newSession.group || null,
      contactId: contactId // 添加联系人ID(限私聊)
    };

    // 添加时间戳消息
    await db.unifiedMessage.create({
      data: {
        sessionId: newSession.id,
        senderId: currentUserId,
        content: formatTimestamp(newSession.createdAt),
        messageType: 'timestamp',
        createdAt: newSession.createdAt,
        updatedAt: newSession.createdAt
      }
    })

    // 如果是私聊会话，添加一条系统消息
    if (sessionType === 'private') {
      await db.unifiedMessage.create({
        data: {
          sessionId: newSession.id,
          senderId: currentUserId,
          content: '已创建会话，可以开始聊天了',
          messageType: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    // 如果是群聊会话，添加一条系统消息，显示所有加入群聊的成员名称
    if (sessionType === 'group' && usersInfo.length > 0) {
      // 获取所有用户的名字
      const userNames = usersInfo.map(user => user.username).filter(name => name);

      // 构造消息内容
      let content = '';
      if (userNames.length > 0) {
        content = `${userNames.join('、')} 加入群聊`;
      } else {
        content = '成员加入群聊';
      }

      await db.unifiedMessage.create({
        data: {
          sessionId: newSession.id,
          senderId: currentUserId,
          content: content,
          messageType: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    res.status(201).json({
      success: true,
      data: formattedSession
    });
  } catch (error) {
    console.error('创建会话失败:', error);
    res.status(500).json({
      success: false,
      error: '创建会话失败'
    });
  }
});

router.get('/getSessionUsers', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // 查询当前用户参与的所有chatSessionUser记录
    const chatSessionUsers = await db.chatSessionUser.findMany({
      where: {
        userId: currentUserId
      },
      include: {
        session: {
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
          }
        }
      }
    });

    res.json({
      success: true,
      data: chatSessionUsers
    });
  } catch (error) {
    console.error('获取会话用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取会话用户信息失败'
    });
  }
});

router.get('/getGroup/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const currentUserId = req.user.id;

    // 检查用户是否有权限访问该群组（是否是群组成员）
    const isGroupMember = await db.chatSessionUser.findFirst({
      where: {
        userId: currentUserId,
        session: {
          sessionType: 'group',
          groupId: groupId
        }
      }
    });

    if (!isGroupMember) {
      return res.status(403).json({
        success: false,
        error: '您不是该群组的成员'
      });
    }

    console.log('groupId: ', groupId)

    // 获取群组详细信息
    const group = await db.group.findUnique({
      where: {
        id: groupId
      },
      include: {
        chatSession: {
          include: {
            ChatSessionUsers: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatar: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: '群组不存在'
      });
    }

    // 构造返回数据
    const groupData = {
      id: group.id,
      name: group.name,
      ownerId: group.ownerId,
      adminIds: group.adminIds,
      announcement: group.announcement,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      image: group.image,
      type: group.type,
      memberCount: group.chatSession?.ChatSessionUsers.length || 0,
      members: group.chatSession?.ChatSessionUsers.map(userSession => ({
        id: userSession.user.id,
        name: userSession.user.username,
        avatar: userSession.user.avatar
      })) || []
    };

    res.json({
      success: true,
      data: groupData
    });
  } catch (error) {
    console.error('获取群组信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取群组信息失败'
    });
  }
});

module.exports = router;