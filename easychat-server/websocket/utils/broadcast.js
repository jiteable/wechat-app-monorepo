/**
 * 广播消息给所有连接的客户端
 * @param {WebSocket.Server} wss WebSocket服务器实例
 * @param {Object} messageData 要发送的消息对象
 */
function broadcastToAll(wss, messageData) {
  const message = JSON.stringify(messageData);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  console.log('已向所有连接的客户端发送消息');
}

/**
 * 广播消息给指定用户
 * @param {Map} clients 用户连接映射表
 * @param {string} userId 目标用户ID
 * @param {Object} messageData 要发送的消息对象
 */
function broadcastToUser(clients, userId, messageData) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(messageData));
    return true;
  }
  return false;
}

/**
 * 广播消息给除指定用户外的所有用户
 * @param {WebSocket.Server} wss WebSocket服务器实例
 * @param {Map} clients 用户连接映射表
 * @param {string} excludeUserId 要排除的用户ID
 * @param {Object} messageData 要发送的消息对象
 */
function broadcastToOthers(wss, clients, excludeUserId, messageData) {
  const message = JSON.stringify(messageData);
  let count = 0;

  clients.forEach((client, userId) => {
    if (userId !== excludeUserId && client.readyState === WebSocket.OPEN) {
      client.send(message);
      count++;
    }
  });

  console.log(`已向${count}个用户发送消息（排除用户${excludeUserId}）`);
  return count;
}

module.exports = {
  broadcastToAll,
  broadcastToUser,
  broadcastToOthers
};