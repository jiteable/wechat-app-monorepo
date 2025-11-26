var express = require('express');
var router = express.Router();
const { Decrypt } = require('../utils/aes');
const bcrypt = require('bcrypt');
const { db } = require('../db/db');
const { generateToken } = require('../utils/JWT');

// 用户登录
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 验证参数
    if (!email || !password) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 解密密码
    const decryptedPassword = Decrypt(password);

    // 查找用户
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: '用户不存在' });
    }

    // 直接比较密码（因为数据库存储的是明文）
    const isValidPassword = decryptedPassword === user.password;
    if (!isValidPassword) {
      return res.status(400).json({ error: '密码错误' });
    }

    // 清理用户之前的会话
    await db.session.deleteMany({
      where: { userId: user.id }
    });

    // 生成JWT令牌
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username
    };

    const token = generateToken(payload);

    // 将JWT令牌存储到数据库中确保唯一性
    const expires = new Date();
    expires.setDate(expires.getDate() + 1); // 24小时后过期

    await db.session.create({
      data: {
        sessionToken: token,
        userId: user.id,
        expires: expires
      }
    });

    res.json({
      message: '登录成功',
      token,
      user: { id: user.id, email: user.email, username: user.username }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;