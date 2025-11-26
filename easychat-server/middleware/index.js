const { db } = require('../db/db');
const { verifyToken } = require('../utils/JWT');

// 验证JWT令牌中间件
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: '访问令牌缺失' });
    }

    // 首先验证JWT令牌的签名和有效期
    const verificationResult = verifyToken(token);
    if (!verificationResult.success) {
      return res.status(403).json({ error: '无效的访问令牌' });
    }

    // 然后检查令牌是否存在于数据库中
    const session = await db.session.findUnique({
      where: { sessionToken: token }
    });

    if (!session) {
      return res.status(403).json({ error: '访问令牌不存在' });
    }

    // 检查令牌是否过期
    if (session.expires < new Date()) {
      // 删除过期的令牌
      await db.session.delete({
        where: { sessionToken: token }
      });

      // 生成新的令牌
      const payload = {
        id: session.userId,
        email: verificationResult.data.email,
        username: verificationResult.data.username
      };

      const newToken = generateToken(payload);

      // 将新的JWT令牌存储到数据库中
      const expires = new Date();
      expires.setDate(expires.getDate() + 1); // 24小时后过期

      await db.session.create({
        data: {
          sessionToken: newToken,
          userId: session.userId,
          expires: expires
        }
      });

      // 返回新的令牌给前端
      return res.status(403).json({
        error: '访问令牌已过期',
        newToken: newToken
      });
    }

    // 将用户信息添加到请求对象中
    req.user = verificationResult.data;
    req.session = session;

    next();
  } catch (error) {
    console.error('验证令牌时出错:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
}

module.exports = { authenticateToken };