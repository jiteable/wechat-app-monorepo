var express = require('express');
var router = express.Router();
const { authenticateToken } = require('../middleware');
const { db } = require('../db/db');

/**
 * 添加好友接口
 * 需要用户登录状态，传入要添加的好友ID
 */
router.post('/addFriend', authenticateToken, async function (req, res, next) {
  try {
    const { userId, source } = req.body; // 要添加为好友的用户ID
    const currentUserId = req.user.id; // 当前登录用户ID

    let method = ''

    if (source == 'chatId') {
      method = '通过搜索微信号添加'
    } else if (source == "email") {
      method = '通过搜索邮箱添加'
    } else if (source == "username") {
      method = '通过搜索用户名添加'
    }

    // 添加好友关系（双向添加）
    await db.userWithFriend.create({
      data: {
        userId: currentUserId,
        friendId: userId,
        source: method,
        createdAt: new Date()
      }
    });

    await db.userWithFriend.create({
      data: {
        userId: userId,
        friendId: currentUserId,
        source: method,
        createdAt: new Date()
      }
    });


    // 返回成功响应
    res.json({
      success: true,
      message: '添加好友成功'
    });

  } catch (error) {
    console.error('添加好友失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 添加成员到群组接口
 * 需要用户登录状态，传入群组ID和成员ID列表
 */
router.post('/addMembersToGroup', authenticateToken, async function (req, res, next) {
  try {
    const { groupId, memberIds } = req.body; // 群组ID和成员ID列表
    const currentUserId = req.user.id; // 当前登录用户ID

    // 验证参数
    if (!groupId || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数或成员ID列表无效'
      });
    }

    // 检查当前用户是否为群主或管理员
    const group = await db.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: '群组不存在'
      });
    }

    // 检查当前用户是否有权限添加成员（群主或管理员）
    if (group.ownerId !== currentUserId && (!group.adminIds || !group.adminIds.includes(currentUserId))) {
      return res.status(403).json({
        success: false,
        message: '没有权限添加成员到此群组'
      });
    }

    // 验证成员ID是否存在且不是当前用户自己
    const members = await db.user.findMany({
      where: {
        id: {
          in: memberIds
        }
      }
    });

    // 检查是否所有成员都存在
    const foundMemberIds = members.map(member => member.id);
    const missingMemberIds = memberIds.filter(id => !foundMemberIds.includes(id));

    if (missingMemberIds.length > 0) {
      return res.status(404).json({
        success: false,
        message: `以下成员不存在: ${missingMemberIds.join(', ')}`
      });
    }

    // 检查成员是否已在群组中
    const existingMembers = group.memberIds || [];
    const newMembers = memberIds.filter(id => !existingMembers.includes(id));

    if (newMembers.length === 0) {
      return res.status(400).json({
        success: false,
        message: '所选成员已在群组中'
      });
    }

    // 更新群组成员列表
    const updatedMemberIds = [...new Set([...existingMembers, ...newMembers])];
    await db.group.update({
      where: { id: groupId },
      data: {
        memberIds: updatedMemberIds,
        updatedAt: new Date()
      }
    });

    // 为新成员创建聊天会话
    for (const memberId of newMembers) {
      // 检查是否已存在会话
      const existingSession = await db.chatSessionUser.findFirst({
        where: {
          userId: memberId,
          sessionId: group.chatSessionId
        }
      });

      if (!existingSession) {
        // 创建群聊会话用户记录
        await db.chatSessionUser.create({
          data: {
            userId: memberId,
            sessionId: group.chatSessionId,
            sessionType: 'group',
            joinedAt: new Date(),
            isMuted: false,
            isPinned: false
          }
        });
      }
    }

    res.json({
      success: true,
      message: '成功添加成员到群组',
      data: {
        addedMembers: newMembers,
        totalMembers: updatedMemberIds.length
      }
    });

  } catch (error) {
    console.error('添加成员到群组失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;