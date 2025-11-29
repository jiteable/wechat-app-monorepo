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
      };
    });

    res.json({ contacts });
  } catch (error) {
    console.error('获取联系人失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;