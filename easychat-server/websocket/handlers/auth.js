function handleAuthMessage(ws, data, clients) {
  // 这里应该验证token并关联用户ID到连接
  // 简化示例中直接使用userId
  const userId = data.userId;
  if (userId) {
    // 如果该用户已经有连接，先断开旧连接
    if (clients.has(userId)) {
      const oldWs = clients.get(userId);
      if (oldWs !== ws) {
        oldWs.close();
      }
    }

    clients.set(userId, ws);
    ws.userId = userId;

    // 发送连接成功的消息
    ws.send(JSON.stringify({
      type: 'connection_success',
      message: '成功连接到WebSocket服务器'
    }));

    console.log(`用户 ${userId} 已连接`);
  }
}

module.exports = handleAuthMessage;