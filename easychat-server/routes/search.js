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


    // 分别根据chatId、email和username搜索用户
    const usersByChatId = await db.User.findMany({
      where: {
        AND: [
          {
            chatId: { contains: trimmedQuery, mode: 'insensitive' }
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

    const usersByEmail = await db.User.findMany({
      where: {
        AND: [
          {
            email: { contains: trimmedQuery, mode: 'insensitive' }
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

    const usersByUsername = await db.User.findMany({
      where: {
        AND: [
          {
            username: { contains: trimmedQuery, mode: 'insensitive' }
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

    // 合并所有搜索结果并去重，按照 email > chatId > username 的优先级设置搜索方式
    const userMap = new Map();

    // 按照优先级顺序处理搜索结果：email > chatId > username
    // 先处理username搜索结果（最低优先级）
    usersByUsername.forEach(user => {
      userMap.set(user.id, {
        ...user,
        searchMethod: 'username'
      });
    });

    // 再处理chatId搜索结果（中等优先级）
    usersByChatId.forEach(user => {
      userMap.set(user.id, {
        ...user,
        searchMethod: 'chatId'
      });
    });

    // 最后处理email搜索结果（最高优先级）
    usersByEmail.forEach(user => {
      userMap.set(user.id, {
        ...user,
        searchMethod: 'email'
      });
    });

    // 转换为数组格式
    let users = Array.from(userMap.values());

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

    // 获取这些用户的设置信息，特别是 needVerificationToAddFriend 字段
    const userIds = users.map(user => user.id);
    const userSettings = await db.UserSetting.findMany({
      where: {
        userId: { in: userIds }
      },
      select: {
        userId: true,
        needVerificationToAddFriend: true
      }
    });

    // 创建一个映射，便于快速查找用户的设置
    const settingsMap = new Map();
    userSettings.forEach(setting => {
      settingsMap.set(setting.userId, setting.needVerificationToAddFriend);
    });

    // 构造返回结果，标记是否为好友
    const resultUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      avatar: user.avatar || '',
      chatId: user.chatId,
      email: user.email,
      searchMethod: user.searchMethod,
      isFriend: friendIds.includes(user.id),
      needVerificationToAddFriend: settingsMap.get(user.id) ?? true // 默认值为 true
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