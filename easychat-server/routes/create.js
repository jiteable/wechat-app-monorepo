var express = require('express');
var router = express.Router();
const { authenticateToken } = require('../middleware');
const { db } = require('../db/db');

/**
 * 创建群组接口
 * 需要用户登录状态，传入群组名称和成员ID列表
 */
router.post('/createGroup', authenticateToken, async function (req, res, next) {
  try {
    const { groupName, memberIds } = req.body;
    const currentUserId = req.user.id; // 当前登录用户ID

    // 检查参数
    if (!groupName || !memberIds || !Array.isArray(memberIds) || memberIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: '群组名称和至少两个成员ID是必需的'
      });
    }

    // 确保创建者也在成员列表中
    if (!memberIds.includes(currentUserId)) {
      memberIds.push(currentUserId);
    }

    // 验证所有成员ID是否存在
    const members = await db.user.findMany({
      where: {
        id: { in: memberIds }
      }
    });

    const existingMemberIds = members.map(member => member.id);
    const missingMemberIds = memberIds.filter(id => !existingMemberIds.includes(id));

    if (missingMemberIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `以下用户ID不存在: ${missingMemberIds.join(', ')}`
      });
    }

    // 创建群组
    const group = await db.group.create({
      data: {
        ownerId: currentUserId,
        adminIds: [currentUserId], // 默认创建者为管理员
        memberIds: memberIds,
        name: groupName,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // 为每个成员创建群组关系记录
    const userWithGroupRecords = memberIds.map(userId => ({
      userId: userId.toString(),
      groupId: group.id,
      identity: userId === currentUserId ? 'owner' : 'member',
      createdAt: new Date()
    }));

    await db.userWithGroup.createMany({
      data: userWithGroupRecords
    });

    // 返回成功响应
    res.json({
      success: true,
      message: '群组创建成功',
      groupId: group.id,
      groupName: group.name
    });

  } catch (error) {
    console.error('创建群组失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
