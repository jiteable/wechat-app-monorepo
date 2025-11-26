const jwt = require('jsonwebtoken');
const config = require('../config');

// 生成JWT令牌
function generateToken(payload) {
  // 设置令牌过期时间为24小时
  const expiresIn = '24h';

  // 使用AES_KEY作为JWT密钥
  const token = jwt.sign(payload, config.AES_KEY, { expiresIn });
  return token;
}

// 验证JWT令牌
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, config.AES_KEY);
    return { success: true, data: decoded };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  generateToken,
  verifyToken
};