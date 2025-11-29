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
    const { userId } = req.body; // 要添加为好友的用户ID
    const currentUserId = req.user.id; // 当前登录用户ID

    // 检查目标用户是否设置了需要验证才能添加好友
    const targetUserSettings = await db.userSetting.findUnique({
      where: { userId: userId }
    });

    // // 如果目标用户设置了需要验证，则需要发送好友请求而不是直接添加
    // if (targetUserSettings && targetUserSettings.needVerificationToAddFriend) {
    //   // 这里应该创建好友请求记录，但由于需求未明确说明，我们暂时直接添加
    //   // 在实际应用中，这里可能需要创建一个好友请求记录等待对方确认
    // }

    // 添加好友关系（双向添加）
    await db.userWithFriend.create({
      data: {
        userId: currentUserId,
        friendId: userId,
        createdAt: new Date()
      }
    });

    await db.userWithFriend.create({
      data: {
        userId: userId,
        friendId: currentUserId,
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

module.exports = router;