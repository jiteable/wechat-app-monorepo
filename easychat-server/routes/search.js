var express = require('express');
var router = express.Router();
const { authenticateToken } = require('../middleware');
const { db } = require('../db/db');

// 用户搜索接口 - 根据chatId或email搜索用户
router.get('/userSearch', authenticateToken, async function (req, res, next) {
  try {
    // 修改这里：正确地从 req.query 获取 query 参数
    const { query } = req.query;
    const currentUserId = req.user.id;

    console.log('Query parameter: ', query);

    // 验证参数
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: '查询参数不能为空' });
    }

    // 去除首尾空格并转换为小写进行模糊匹配
    const trimmedQuery = query.trim();

    console.log('trimmedQuery: ', trimmedQuery);


    // 在数据库中搜索用户 (根据chatId或email)
    const users = await db.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { chatId: { contains: trimmedQuery, mode: 'insensitive' } },
              { email: { contains: trimmedQuery, mode: 'insensitive' } },
              { username: { contains: trimmedQuery, mode: 'insensitive' } }
            ]
          },
          // 排除当前用户自己
          { NOT: { id: currentUserId } }
        ]
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        chatId: true,
        email: true
      }
    });

    // 检查这些用户是否已经是当前用户的好友
    const friendships = await db.UserWithFriend.findMany({
      where: {
        OR: [
          { userId: currentUserId },
          { friendId: currentUserId }
        ]
      },
      select: {
        userId: true,
        friendId: true
      }
    });

    const friendIds = friendships
      .flatMap(f => [f.userId, f.friendId])
      .filter(id => id !== currentUserId);

    // 构造返回结果，标记是否为好友
    const resultUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      avatar: user.avatar || '',
      chatId: user.chatId,
      email: user.email,
      isFriend: friendIds.includes(user.id)
    }));

    res.json({
      users: resultUsers
    });
  } catch (error) {
    console.error('搜索用户失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;