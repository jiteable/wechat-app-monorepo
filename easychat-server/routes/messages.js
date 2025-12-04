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
        status: 'pending'
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

module.exports = router;