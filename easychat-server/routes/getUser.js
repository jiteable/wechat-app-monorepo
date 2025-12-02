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

// 获取群组接口
router.get('/getGroup', authenticateToken, async function (req, res, next) {
  try {
    // 获取当前登录用户的ID
    const userId = req.user.id;

    // 查询该用户参与的所有群组关系
    const userGroups = await db.userWithGroup.findMany({
      where: {
        userId: userId
      }
    });

    // 提取群组ID列表
    const groupIds = userGroups.map(userGroup => userGroup.groupId);

    // 查询群组的详细信息
    const groupsInfo = await db.group.findMany({
      where: {
        id: {
          in: groupIds
        }
      }
    });

    // 构建群组信息映射
    const groupInfoMap = {};
    groupsInfo.forEach(group => {
      groupInfoMap[group.id] = group;
    });

    // 合并用户与群组关系信息和群组详细信息
    const groups = userGroups.map(userGroup => {
      const groupInfo = groupInfoMap[userGroup.groupId];
      if (!groupInfo) return null;

      return {
        id: groupInfo.id,
        name: groupInfo.name,
        ownerId: groupInfo.ownerId,
        adminIds: groupInfo.adminIds,
        memberIds: groupInfo.memberIds,
        announcement: groupInfo.announcement,
        createdAt: groupInfo.createdAt,
        updatedAt: groupInfo.updatedAt,
        image: groupInfo.image,
        identity: userGroup.identity,
        nickname: userGroup.nickname,
        remark: userGroup.remark,
        muteNotification: userGroup.muteNotification,
        stickyTopChat: userGroup.stickyTopChat,
        showMemberNameCard: userGroup.showMemberNameCard,
        background: userGroup.background
      };
    }).filter(group => group !== null); // 过滤掉空值

    res.json({ groups });
  } catch (error) {
    console.error('获取群组失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});



module.exports = router;