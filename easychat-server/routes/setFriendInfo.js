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

module.exports = router;