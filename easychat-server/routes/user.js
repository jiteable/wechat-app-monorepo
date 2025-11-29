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


router.get('/settingInfo', authenticateToken, async function (req, res, next) {
  try {
    // 从认证中间件中获取用户信息
    const userId = req.user.id;

    // 从数据库中获取用户设置信息
    const userSettings = await db.userSetting.findUnique({
      where: { userId: userId }
    });

    if (!userSettings) {
      return res.status(404).json({ error: '用户设置不存在' });
    }

    // 返回用户设置信息
    res.json({
      settings: {
        newMessageSound: userSettings.newMessageSound,
        needVerificationToAddFriend: userSettings.needVerificationToAddFriend,
        canBeSearchedByChatId: userSettings.canBeSearchedByChatId,
        canBeSearchedByEmail: userSettings.canBeSearchedByEmail,
        canAddFromGroup: userSettings.canAddFromGroup,
        language: userSettings.language,
        fontSize: userSettings.fontSize,
        openFileInReadonlyMode: userSettings.openFileInReadonlyMode,
        showWebSearchHistory: userSettings.showWebSearchHistory,
        autoConvertVoiceToText: userSettings.autoConvertVoiceToText
      }
    });
  } catch (error) {
    console.error('获取用户设置失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/setSetting', authenticateToken, async function (req, res, next) {
  try {
    // 从认证中间件中获取用户信息
    const userId = req.user.id;

    // 从请求体中获取用户设置信息
    const {
      newMessageSound,
      needVerificationToAddFriend,
      canBeSearchedByChatId,
      canBeSearchedByEmail,
      canAddFromGroup,
      language,
      fontSize,
      openFileInReadonlyMode,
      showWebSearchHistory,
      autoConvertVoiceToText
    } = req.body;

    // 更新或创建用户设置
    const updatedSettings = await db.userSetting.upsert({
      where: { userId: userId },
      update: {
        newMessageSound,
        needVerificationToAddFriend,
        canBeSearchedByChatId,
        canBeSearchedByEmail,
        canAddFromGroup,
        language,
        fontSize,
        openFileInReadonlyMode,
        showWebSearchHistory,
        autoConvertVoiceToText,
        updatedAt: new Date()
      },
      create: {
        userId,
        newMessageSound: newMessageSound !== undefined ? newMessageSound : true,
        needVerificationToAddFriend: needVerificationToAddFriend !== undefined ? needVerificationToAddFriend : true,
        canBeSearchedByChatId: canBeSearchedByChatId !== undefined ? canBeSearchedByChatId : true,
        canBeSearchedByEmail: canBeSearchedByEmail !== undefined ? canBeSearchedByEmail : true,
        canAddFromGroup: canAddFromGroup !== undefined ? canAddFromGroup : true,
        language: language || 'zh',
        fontSize: fontSize || 14,
        openFileInReadonlyMode: openFileInReadonlyMode !== undefined ? openFileInReadonlyMode : false,
        showWebSearchHistory: showWebSearchHistory !== undefined ? showWebSearchHistory : true,
        autoConvertVoiceToText: autoConvertVoiceToText !== undefined ? autoConvertVoiceToText : true
      }
    });

    // 返回成功响应
    res.json({
      success: true
    });
  } catch (error) {
    console.error('设置用户信息失败:', error);
    res.status(500).json({ error: '服务器内部错误', success: false });
  }
});

module.exports = router;