var express = require('express');
var router = express.Router();
const { Decrypt } = require('../utils/aes');
const bcrypt = require('bcrypt');
const db = require('../db/db');

// 用户登录
router.post('/login', async (req, res) => {
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

    // 验证密码
    const isValidPassword = await bcrypt.compare(decryptedPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: '密码错误' });
    }

    // 生成token（这里简化处理，实际应使用JWT等）
    const token = 'generated_token_' + Date.now();

    res.json({
      message: '登录成功',
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;