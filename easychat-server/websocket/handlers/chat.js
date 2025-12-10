const WebSocket = require('ws');

function handleChatMessage(ws, data, clients) {
  // 这里可以添加具体的消息处理逻辑
  // 比如保存到数据库、转发给其他用户等

  // 示例：如果消息有目标用户，则转发给该用户
  if (data.targetUserId) {
    const targetClient = clients.get(data.targetUserId);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      targetClient.send(JSON.stringify({
        type: 'new_message',
        from: data.fromUserId,
        message: data.message,
        timestamp: Date.now()
      }));
    }
  }
}

module.exports = handleChatMessage;