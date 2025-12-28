var express = require('express');
var router = express.Router();
const { authenticateToken } = require('../middleware');
const { db } = require('../db/db');

/**
 * 更新群组信息（群名、公告）
 * PUT /editGroup/groupUpdate
 */
router.put('/groupUpdate', authenticateToken, async function (req, res, next) {
  try {
    const { groupId, name, announcement } = req.body;
    const currentUserId = req.user.id;

    // 检查参数
    if (!groupId) {
      return res.status(400).json({
        code: 400,
        message: '群组ID是必需的'
      });
    }

    // 检查群组是否存在
    const group = await db.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return res.status(404).json({
        code: 404,
        message: '群组不存在'
      });
    }

    // 检查当前用户是否是群主或管理员
    const isAdmin = group.ownerId === currentUserId || group.adminIds.includes(currentUserId);
    if (!isAdmin) {
      return res.status(403).json({
        code: 403,
        message: '只有群主或管理员才能修改群组信息'
      });
    }

    // 准备更新数据
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (announcement !== undefined) updateData.announcement = announcement;
    updateData.updatedAt = new Date();

    // 更新群组信息
    const updatedGroup = await db.group.update({
      where: { id: groupId },
      data: updateData
    });

    // 如果群名称有变更，也需要更新会话中的名称
    if (name !== undefined) {
      // 查找对应的chatSession（一对一关系，直接通过groupId获取）
      const chatSession = await db.chatSession.findUnique({
        where: { groupId: groupId }
      });

      if (chatSession) {
        // 使用chatSession的id来更新
        await db.chatSession.update({
          where: { id: chatSession.id },
          data: { name: name }
        });
      }
    }

    // 返回成功响应
    res.json({
      code: 200,
      data: updatedGroup,
      message: '群组信息更新成功'
    });
  } catch (error) {
    console.error('更新群组信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

/**
 * 更新会话备注
 * PUT /editGroup/sessionRemark
 */
router.put('/sessionRemark', authenticateToken, async function (req, res, next) {
  try {
    const { sessionId, remark } = req.body;
    const currentUserId = req.user.id;

    // 检查参数
    if (!sessionId) {
      return res.status(400).json({
        code: 400,
        message: '会话ID是必需的'
      });
    }

    // 检查会话是否存在以及用户是否属于该会话
    const sessionUser = await db.chatSessionUser.findFirst({
      where: {
        sessionId: sessionId,
        userId: currentUserId
      },
      include: {
        session: true
      }
    });

    if (!sessionUser) {
      return res.status(404).json({
        code: 404,
        message: '会话不存在或您不在此会话中'
      });
    }

    // 更新会话备注 - 使用多个字段作为条件而不是复合唯一键
    const updatedSessionUser = await db.chatSessionUser.update({
      where: {
        sessionId_userId: {
          sessionId: sessionId,
          userId: currentUserId
        }
      },
      data: {
        customRemark: remark 
      }
    });

    // 返回成功响应
    res.json({
      code: 200,
      data: updatedSessionUser,
      message: '会话备注更新成功'
    });
  } catch (error) {
    console.error('更新会话备注失败:', error);
    // 添加更详细的错误信息
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      error: error.message
    });
  }
});
/**
 * 更新用户在群组中的昵称
 * PUT /editGroup/memberNickname
 */
router.put('/memberNickname', authenticateToken, async function (req, res, next) {
  try {
    const { groupId, nickname } = req.body;
    const currentUserId = req.user.id;

    // 检查参数
    if (!groupId) {
      return res.status(400).json({
        code: 400,
        message: '群组ID是必需的'
      });
    }

    // 检查群组是否存在
    const group = await db.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return res.status(404).json({
        code: 404,
        message: '群组不存在'
      });
    }

    // 检查用户是否在群组中
    if (!group.memberIds.includes(currentUserId)) {
      return res.status(403).json({
        code: 403,
        message: '您不在此群组中'
      });
    }

    // 查找用户在该群组会话中的记录（一对一关系，直接通过groupId获取）
    const session = await db.chatSession.findUnique({
      where: { groupId: groupId }
    });

    if (!session) {
      return res.status(404).json({
        code: 404,
        message: '群组会话不存在'
      });
    }

    // 更新用户在群组中的昵称
    const updatedSessionUser = await db.chatSessionUser.update({
      where: {
        sessionId_userId: {
          sessionId: session.id,
          userId: currentUserId
        }
      },
      data: {
        nickname: nickname
      }
    });

    // 返回成功响应
    res.json({
      code: 200,
      data: updatedSessionUser,
      message: '群组昵称更新成功'
    });
  } catch (error) {
    console.error('更新群组昵称失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;