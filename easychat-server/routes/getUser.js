var express = require('express');
var router = express.Router();
const { authenticateToken } = require('../middleware');
const { db } = require('../db/db');

// 获取联系人接口
router.get('/getContact', authenticateToken, async function (req, res, next) {
  try {
    // 获取当前登录用户的ID
    const userId = req.user.id;

    // 查询该用户的所有好友关系
    const userFriends = await db.userWithFriend.findMany({
      where: {
        userId: userId
      }
    });

    // 提取好友ID列表
    const friendIds = userFriends.map(userFriend => userFriend.friendId);

    // 查询好友的详细信息
    const friendsInfo = await db.user.findMany({
      where: {
        id: {
          in: friendIds
        }
      }
    });

    // 构建联系人信息映射
    const friendInfoMap = {};
    friendsInfo.forEach(friend => {
      friendInfoMap[friend.id] = friend;
    });

    // 合并好友关系信息和详细信息
    const contacts = userFriends.map(userFriend => {
      const friendInfo = friendInfoMap[userFriend.friendId];
      return {
        id: friendInfo.id,
        chatId: friendInfo.chatId,
        username: friendInfo.username,
        avatar: friendInfo.avatar,
        gender: friendInfo.gender,
        signature: friendInfo.signature,
        region: friendInfo.region,
        remark: userFriend.remark,
        source: userFriend.source,
        labels: userFriend.labels, // 添加标签字段
        groupCount: 0 // 初始化为0，后续会更新
      };
    });

    // 查询当前用户参与的所有群聊
    const userGroups = await db.group.findMany({
      where: {
        memberIds: {
          has: userId // 包含当前用户
        }
      }
    });

    // 计算每个好友的共同群聊数量
    contacts.forEach(contact => {
      const commonGroupsCount = userGroups.filter(group =>
        group.memberIds.includes(contact.id) // 群聊也包含该好友
      ).length;

      contact.groupCount = commonGroupsCount;
    });

    res.json({ contacts });
  } catch (error) {
    console.error('获取联系人失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取群组接口
router.get('/getGroup', authenticateToken, async function (req, res, next) {
  try {
    // 获取当前登录用户的ID
    const userId = req.user.id;

    // 查询该用户参与的所有群聊会话
    const userChatSessions = await db.chatSessionUser.findMany({
      where: {
        userId: userId,
        sessionType: 'group'
      },
      include: {
        session: {
          include: {
            group: true
          }
        }
      }
    });

    // 过滤并提取群组信息
    const groups = userChatSessions
      .filter(chatSessionUser => chatSessionUser.session && chatSessionUser.session.group)
      .map(chatSessionUser => {
        const group = chatSessionUser.session.group;
        return {
          id: group.id,
          name: group.name,
          ownerId: group.ownerId,
          adminIds: group.adminIds,
          memberIds: group.memberIds,
          announcement: group.announcement,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt,
          image: group.image,
          identity: chatSessionUser.identity,
          nickname: chatSessionUser.nickname,
          remark: chatSessionUser.remark,
          muteNotification: chatSessionUser.isMuted,
          stickyTopChat: chatSessionUser.isPinned,
          showMemberNameCard: chatSessionUser.showMemberNameCard,
          background: chatSessionUser.background
        };
      });

    res.json({ groups });
  } catch (error) {
    console.error('获取群组失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * 删除好友接口
 * 需要用户登录状态，传入要删除的好友ID
 */
router.post('/deleteFriend', authenticateToken, async function (req, res, next) {
  try {
    const { friendId } = req.body; // 要删除的好友ID
    const currentUserId = req.user.id; // 当前登录用户ID

    // 检查好友关系是否存在
    const existingFriendship = await db.userWithFriend.findFirst({
      where: {
        userId: currentUserId,
        friendId: friendId
      }
    });

    if (!existingFriendship) {
      return res.status(400).json({
        success: false,
        message: '好友关系不存在'
      });
    }

    // 删除双向好友关系
    await db.userWithFriend.deleteMany({
      OR: [
        {
          userId: currentUserId,
          friendId: friendId
        },
        {
          userId: friendId,
          friendId: currentUserId
        }
      ]
    });

    // 删除与该好友的会话（如果存在）
    await db.chatSession.deleteMany({
      where: {
        sessionType: 'private',
        userSessionConnections: {
          some: {
            userId: currentUserId
          }
        },
        userSessionConnections: {
          some: {
            userId: friendId
          }
        }
      }
    });

    // 返回成功响应
    res.json({
      success: true,
      message: '删除好友成功'
    });

  } catch (error) {
    console.error('删除好友失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;