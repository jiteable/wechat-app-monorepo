var express = require('express');
var router = express.Router();
const { db } = require('../db/db');
const { authenticateToken } = require('../middleware');

// 获取好友请求
router.get('/getFriendRequest', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 查询当前用户收到的所有好友请求，按创建时间倒序排列
    const friendRequests = await db.friendRequest.findMany({
      where: {
        toUserId: userId,
      },
      include: {
        fromUser: {
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: friendRequests
    });
  } catch (error) {
    console.error('获取好友请求失败:', error);
    res.status(500).json({
      success: false,
      error: '获取好友请求失败'
    });
  }
});

//获取邀请入群请求
router.get('/getGroupInvitations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 查询当前用户收到的所有群组邀请，按创建时间倒序排列
    const groupInvitations = await db.groupInvitation.findMany({
      where: {
        inviteeId: userId,
        status: 'pending'
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            image: true
          }
        },
        inviter: {
          select: {
            id: true,
            chatId: true,
            username: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: groupInvitations
    });
  } catch (error) {
    console.error('获取群组邀请失败:', error);
    res.status(500).json({
      success: false,
      error: '获取群组邀请失败'
    });
  }
});

// 发送好友请求
router.post('/sendFriendRequest', authenticateToken, async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const { toUserId, requestMessage } = req.body;

    // 验证参数
    if (!toUserId) {
      return res.status(400).json({
        success: false,
        error: '缺少目标用户ID'
      });
    }


    // 检查是否已经发送过好友请求且仍在等待处理
    const existingRequest = await db.friendRequest.findFirst({
      where: {
        fromUserId: fromUserId,
        toUserId: toUserId,
        status: 'pending'
      }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: '好友请求已发送，请等待对方处理'
      });
    }

    // 创建好友请求
    const friendRequest = await db.friendRequest.create({
      data: {
        fromUserId: fromUserId,
        toUserId: toUserId,
        requestMessage: requestMessage || null,
        status: 'pending'
      }
    });

    res.json({
      success: true,
      data: friendRequest,
      message: '好友请求发送成功'
    });
  } catch (error) {
    console.error('发送好友申请失败:', error);
    res.status(500).json({
      success: false,
      error: '发送好友申请失败'
    });
  }
});

//发送邀请入群请求
router.post('/sendGroupInvitations', authenticateToken, async (req, res) => {
  try {
    const inviterId = req.user.id;
    const { groupId, inviteeIds, inviteMessage } = req.body;

    // 验证参数
    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: '缺少群组ID'
      });
    }

    if (!inviteeIds || !Array.isArray(inviteeIds) || inviteeIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: '缺少被邀请用户ID列表'
      });
    }

    // 检查群组是否存在
    const group = await db.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: '群组不存在'
      });
    }

    // // 检查邀请人是否是群组成员
    // const inviterMembership = await db.userWithGroup.findFirst({
    //   where: {
    //     userId: inviterId,
    //     groupId: groupId
    //   }
    // });

    // if (!inviterMembership) {
    //   return res.status(403).json({
    //     success: false,
    //     error: '只有群组成员才能邀请他人加入'
    //   });
    // }

    // 准备存储邀请结果的数组
    const results = [];
    const errors = [];

    // 逐个处理邀请
    for (const inviteeId of inviteeIds) {
      try {

        // 检查被邀请人是否已经是群组成员
        const existingMembership = await db.userWithGroup.findFirst({
          where: {
            userId: inviteeId,
            groupId: groupId
          }
        });

        if (existingMembership) {
          errors.push({
            inviteeId,
            error: '该用户已经是群组成员'
          });
          continue;
        }

        // 检查是否已经发送过邀请且仍在等待处理
        const existingInvitation = await db.groupInvitation.findFirst({
          where: {
            groupId: groupId,
            inviterId: inviterId,
            inviteeId: inviteeId,
            status: 'pending'
          }
        });

        if (existingInvitation) {
          errors.push({
            inviteeId,
            error: '邀请已发送，请等待对方处理'
          });
          continue;
        }

        // 创建群组邀请
        const invitation = await db.groupInvitation.create({
          data: {
            groupId: groupId,
            inviterId: inviterId,
            inviteeId: inviteeId,
            inviteMessage: inviteMessage || null,
            status: 'pending'
          }
        });

        results.push({
          inviteeId,
          invitation
        });
      } catch (error) {
        errors.push({
          inviteeId,
          error: '处理邀请时发生错误'
        });
      }
    }

    res.json({
      success: true,
      data: {
        successfulInvitations: results,
        failedInvitations: errors
      },
      message: '群组邀请处理完成'
    });
  } catch (error) {
    console.error('发送群组邀请失败:', error);
    res.status(500).json({
      success: false,
      error: '发送群组邀请失败'
    });
  }
});

// 接受好友申请
router.post('/acceptFriendRequest', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.body;

    // 查找好友申请记录
    const friendRequest = await db.friendRequest.findUnique({
      where: { id: requestId }
    });

    // 检查申请是否存在
    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        error: '好友申请不存在'
      });
    }

    // 检查当前用户是否有权限处理此申请（必须是接收者）
    if (friendRequest.toUserId !== userId) {
      return res.status(403).json({
        success: false,
        error: '无权处理此申请'
      });
    }

    // 更新申请状态为已接受
    const updatedRequest = await db.friendRequest.update({
      where: { id: requestId },
      data: { status: 'accepted' }
    });

    // 添加好友关系（双向）
    await db.userWithFriend.create({
      data: {
        userId: friendRequest.fromUserId,
        friendId: friendRequest.toUserId,
        source: '通过好友申请添加',
        createdAt: new Date()
      }
    });

    await db.userWithFriend.create({
      data: {
        userId: friendRequest.toUserId,
        friendId: friendRequest.fromUserId,
        source: '通过好友申请添加',
        createdAt: new Date()
      }
    });

    res.json({
      success: true,
      data: updatedRequest,
      message: '好友申请已接受'
    });
  } catch (error) {
    console.error('接受好友申请失败:', error);
    res.status(500).json({
      success: false,
      error: '接受好友申请失败'
    });
  }
});

// 拒绝好友申请
router.post('/rejectFriendRequest', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.body;

    // 查找好友申请记录
    const friendRequest = await db.friendRequest.findUnique({
      where: { id: requestId }
    });

    // 检查申请是否存在
    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        error: '好友申请不存在'
      });
    }

    // 检查当前用户是否有权限处理此申请（必须是接收者）
    if (friendRequest.toUserId !== userId) {
      return res.status(403).json({
        success: false,
        error: '无权处理此申请'
      });
    }

    // 更新申请状态为已拒绝
    const updatedRequest = await db.friendRequest.update({
      where: { id: requestId },
      data: { status: 'rejected' }
    });

    res.json({
      success: true,
      data: updatedRequest,
      message: '好友申请已拒绝'
    });
  } catch (error) {
    console.error('拒绝好友申请失败:', error);
    res.status(500).json({
      success: false,
      error: '拒绝好友申请失败'
    });
  }
});

// 删除所有好友请求和群组邀请
router.post('/deleteAllRequests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 删除当前用户收到的所有待处理好友请求
    await db.friendRequest.deleteMany({
      where: {
        toUserId: userId,
        status: 'pending'
      }
    });

    // 删除当前用户收到的所有待处理群组邀请
    await db.groupInvitation.deleteMany({
      where: {
        inviteeId: userId,
        status: 'pending'
      }
    });

    res.json({
      success: true,
      message: '所有待处理的申请和邀请已清除'
    });
  } catch (error) {
    console.error('删除所有申请和邀请失败:', error);
    res.status(500).json({
      success: false,
      error: '删除失败'
    });
  }
});

module.exports = router;