const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * 处理用户认证
 * @param {import('ws').WebSocket} ws WebSocket连接
 * @param {*} message 消息对象
 */
async function handleAuth(ws, message) {
  try {
    // 处理前端发送的认证格式 { type: 'auth', userId: 'xxx' }
    let userId;
    if (message.userId) {
      userId = message.userId;
    } else {
      // 如果是传统的token方式
      const { token } = message.data;
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
      userId = decoded.userId;
    }

    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      ws.send(JSON.stringify({
        type: 'auth_result',
        success: false,
        error: '用户不存在'
      }));
      return;
    }

    // 将用户信息附加到WebSocket连接上
    ws.userId = user.id;
    ws.user = user;

    // 发送认证成功消息
    ws.send(JSON.stringify({
      type: 'connection_success',
      message: '认证成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    }));

    console.log(`用户 ${user.username} 已通过WebSocket连接`);
  } catch (error) {
    console.error('认证失败:', error);
    ws.send(JSON.stringify({
      type: 'auth_result',
      success: false,
      error: '认证失败'
    }));
  }
}

module.exports = handleAuth;