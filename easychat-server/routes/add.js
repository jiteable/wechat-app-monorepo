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

module.exports = router;