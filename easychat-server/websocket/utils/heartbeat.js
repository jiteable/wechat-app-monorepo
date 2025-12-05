/**
 * 心跳检测机制
 * @param {import('ws').WebSocket} ws WebSocket连接实例
 */
function heartbeat(ws) {
  ws.isAlive = true;
}

module.exports = heartbeat;