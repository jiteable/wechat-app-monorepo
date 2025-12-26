var express = require('express');
var router = express.Router();
const { authenticateToken } = require('../middleware');
const { db } = require('../db/db');

// 获取或创建当前用户的标签列表
router.get('/userLabels', authenticateToken, async function (req, res, next) {
  try {
    const userId = req.user.id;

    // 从数据库中获取用户的标签，如果不存在则创建
    let userLabels = await db.userLabel.findUnique({
      where: { userId: userId }
    });

    if (!userLabels) {
      // 如果用户没有标签，创建一个空标签数组
      userLabels = await db.userLabel.create({
        data: {
          userId: userId,
          Labels: []
        }
      });
    }

    // 返回用户的标签列表
    res.json({
      success: true,
      labels: userLabels.Labels || []
    });
  } catch (error) {
    console.error('获取或创建用户标签失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 添加单个标签
router.post('/addUserLabel', authenticateToken, async function (req, res, next) {
  try {
    const userId = req.user.id;
    const { label } = req.body;

    // 验证请求体
    if (!label || typeof label !== 'string' || label.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '标签名称不能为空'
      });
    }

    if (label.length > 50) {
      return res.status(400).json({
        success: false,
        error: '标签名称长度不能超过50个字符'
      });
    }

    // 获取当前用户的标签
    let userLabels = await db.userLabel.findUnique({
      where: { userId: userId }
    });

    let labels = userLabels ? userLabels.Labels : [];

    // 检查标签是否已存在
    if (labels.includes(label)) {
      return res.status(400).json({
        success: false,
        error: '标签已存在'
      });
    }

    // 检查标签数量是否超过限制
    if (labels.length >= 20) {
      return res.status(400).json({
        success: false,
        error: '每个用户最多只能有20个标签'
      });
    }

    // 添加新标签
    labels.push(label);

    // 创建或更新用户标签
    const updatedUserLabels = await db.userLabel.upsert({
      where: { userId: userId },
      update: {
        Labels: labels
      },
      create: {
        userId: userId,
        Labels: labels
      }
    });

    res.json({
      success: true,
      labels: updatedUserLabels.Labels
    });
  } catch (error) {
    console.error('添加用户标签失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 删除单个标签
router.post('/removeUserLabel', authenticateToken, async function (req, res, next) {
  try {
    const userId = req.user.id;
    const { label } = req.body;

    // 验证请求体
    if (!label || typeof label !== 'string' || label.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '标签名称不能为空'
      });
    }

    // 获取当前用户的标签
    const userLabels = await db.userLabel.findUnique({
      where: { userId: userId }
    });

    if (!userLabels) {
      return res.status(404).json({
        success: false,
        error: '用户标签不存在'
      });
    }

    let labels = userLabels.Labels;

    // 检查标签是否存在
    const labelIndex = labels.indexOf(label);
    if (labelIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '标签不存在'
      });
    }

    // 删除标签
    labels.splice(labelIndex, 1);

    // 更新用户标签
    const updatedUserLabels = await db.userLabel.update({
      where: { userId: userId },
      data: {
        Labels: labels
      }
    });

    res.json({
      success: true,
      labels: updatedUserLabels.Labels
    });
  } catch (error) {
    console.error('删除用户标签失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.post('/setFriendInfo', authenticateToken, async function (req, res, next) {
  try {
    const userId = req.user.id; // 当前用户ID
    const { friendId, labels, remark, description, phone } = req.body;

    // 验证请求体
    if (!friendId || typeof friendId !== 'string' || friendId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '好友ID不能为空'
      });
    }

    // 检查好友关系是否存在
    let friendRelation = await db.userWithFriend.findFirst({
      where: {
        userId: userId,
        friendId: friendId
      }
    });

    if (!friendRelation) {
      return res.status(404).json({
        success: false,
        error: '好友关系不存在'
      });
    }

    // 准备更新数据
    const updateData = {};

    // 处理标签
    if (labels !== undefined) {
      if (!Array.isArray(labels)) {
        return res.status(400).json({
          success: false,
          error: '标签列表必须是数组'
        });
      }

      // 检查标签数量是否超过限制
      if (labels.length > 20) {
        return res.status(400).json({
          success: false,
          error: '每个好友最多只能有20个标签'
        });
      }

      // 检查标签格式
      for (const label of labels) {
        if (typeof label !== 'string' || label.trim().length === 0) {
          return res.status(400).json({
            success: false,
            error: '标签名称不能为空'
          });
        }

        if (label.length > 50) {
          return res.status(400).json({
            success: false,
            error: '标签名称长度不能超过50个字符'
          });
        }
      }

      updateData.labels = labels;
    }

    // 处理备注
    if (remark !== undefined) {

      if (remark.length > 100) {
        return res.status(400).json({
          success: false,
          error: '备注长度不能超过100个字符'
        });
      }

      updateData.remark = remark;
    }

    // 处理描述
    if (description !== undefined) {

      if (description.length > 500) {
        return res.status(400).json({
          success: false,
          error: '描述长度不能超过500个字符'
        });
      }

      updateData.description = description;
    }

    // 处理电话
    if (phone !== undefined) {

      // 检查电话数量是否超过限制
      if (phone.length > 10) {
        return res.status(400).json({
          success: false,
          error: '每个好友最多只能有10个电话号码'
        });
      }

      // 检查电话格式
      for (const phoneNumber of phone) {
        if (typeof phoneNumber !== 'string' || phoneNumber.trim().length === 0) {
          return res.status(400).json({
            success: false,
            error: '电话号码不能为空'
          });
        }

        if (phoneNumber.length > 20) {
          return res.status(400).json({
            success: false,
            error: '电话号码长度不能超过20个字符'
          });
        }
      }

      updateData.phone = phone;
    }

    // 更新好友信息
    const updatedFriendRelation = await db.userWithFriend.update({
      where: {
        id: friendRelation.id
      },
      data: updateData
    });

    res.json({
      success: true,
      message: '好友信息设置成功',
      labels: updatedFriendRelation.labels,
      remark: updatedFriendRelation.remark,
      description: updatedFriendRelation.description,
      phone: updatedFriendRelation.phone
    });
  } catch (error) {
    console.error('设置好友信息失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
})



module.exports = router;