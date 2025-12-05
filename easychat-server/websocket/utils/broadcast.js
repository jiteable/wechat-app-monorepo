/**
 * 广播消息给所有连接的客户端
 * @param {import('ws').WebSocketServer} wss WebSocket服务器实例
 * @param {*} data 要发送的数据
 */
function broadcast(wss, data) {
  const message = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}

module.exports = broadcast;