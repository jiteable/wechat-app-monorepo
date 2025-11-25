var express = require('express');
var router = express.Router();
const { Decrypt } = require('../utils/aes');
const bcrypt = require('bcrypt');
const { db } = require('../db/db');

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

    // 检查用户名是否已存在
    const existingUsername = await db.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ error: '该用户名已被使用' });
    }

    // 在实际应用中，这里需要验证验证码是否正确
    // 由于这是演示环境，我们跳过验证码验证

    // 解密密码
    const decryptedPassword = Decrypt(password);

    // 密码加密
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(decryptedPassword, saltRounds);

    // 创建用户
    const user = await db.user.create({
      data: {
        email,
        username,
        password: hashedPassword
      }
    });

    res.json({
      message: '注册成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;