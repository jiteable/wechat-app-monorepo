var express = require('express');
var router = express.Router();
const { authenticateToken } = require('../middleware');
const { db } = require('../db/db');

// 获取当前用户信息
router.get('/info', authenticateToken, async function (req, res, next) {
  try {
    // 从认证中间件中获取用户信息
    const userId = req.user.id;

    // 从数据库中获取用户详细信息
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        avatar: true,
        chatId: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 返回用户信息
    res.json({
      user: {
        username: user.username,
        avatar: user.avatar || '',
        chatId: user.chatId
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;