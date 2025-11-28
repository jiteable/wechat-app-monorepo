var express = require('express');
var router = express.Router();
const { Decrypt } = require('../utils/aes');
const bcrypt = require('bcrypt');
const { db } = require('../db/db');
const { sendEmail } = require('../utils/mailer')

// 发送验证码
router.post('/send-verify-code', async (req, res) => {
  try {
    const { email } = req.body;

    // 验证参数
    if (!email) {
      return res.status(400).json({ error: '缺少邮箱参数' });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }

    // 检查用户是否已存在
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    // 生成6位数字验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // 存储验证码到数据库 (使用VerificationToken模型)
    const expires = new Date()
    expires.setMinutes(expires.getMinutes() + 10) // 10分钟后过期

    // 删除旧的验证码
    await db.verificationToken.deleteMany({
      where: {
        identifier: email,
      },
    })

    // 创建新的验证码
    await db.verificationToken.create({
      data: {
        identifier: email,
        token: code,
        expires,
      },
    })

    // 发送邮件
    await sendEmail({
      toEmail: email,
      subject: 'easyChat 验证码',
      text: `您的验证码是: ${code}，10分钟内有效。如果不是您本人操作，请忽略此邮件。`,
    })

    // 实际应用中，这里会发送验证码到用户邮箱
    // 但在演示环境中，我们直接返回成功消息
    res.json({
      message: '验证码已发送至您的邮箱'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 用户注册
router.post('/', async (req, res) => {
  try {
    const { email, username, password, verifyCode } = req.body;

    // 验证参数
    if (!email || !username || !password || !verifyCode) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }

    // 检查用户是否已存在
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    // 验证验证码
    const verificationToken = await db.verificationToken.findUnique({
      where: {
        identifier: email,
      },
    });

    if (!verificationToken || verificationToken.token !== verifyCode) {
      return res.status(400).json({ error: '验证码无效或已过期' });
    }

    // 检查验证码是否过期
    if (new Date() > verificationToken.expires) {
      await db.verificationToken.delete({
        where: {
          identifier: email,
        },
      });
      return res.status(400).json({ error: '验证码已过期' });
    }

    // 解密密码
    const decryptedPassword = Decrypt(password);

    // 生成chatId (EC + 用户ID)
    const userId = generateUserId();
    const chatId = 'EC' + userId;

    // 使用事务同时创建用户和用户设置
    const user = await db.$transaction(async (prisma) => {
      // 创建用户
      const newUser = await prisma.user.create({
        data: {
          chatId: chatId,
          email,
          username,
          password: decryptedPassword,
          gender: '', // 默认值
          signature: '', // 默认值
          region: '', // 默认值
          avatar: 'https://file-dev.document-ai.top/avatar/chatImage/%E9%BB%98%E8%AE%A4%E5%A4%B4%E5%83%8F.jpg'
        }
      });

      // 创建用户设置
      await prisma.userSetting.create({
        data: {
          userId: newUser.id,
          // 使用模型中定义的默认值
        }
      });

      return newUser;
    });

    // 删除已使用的验证码
    await db.verificationToken.delete({
      where: {
        identifier: email,
      },
    });

    res.json({
      message: '注册成功',
      user: {
        id: user.id,
        chatId: user.chatId,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 生成用户ID的辅助函数
function generateUserId() {
  // 生成一个基于时间戳和随机数的唯一ID
  const timestamp = Date.now().toString();
  const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return timestamp.substring(timestamp.length - 6) + randomPart;
}

module.exports = router;