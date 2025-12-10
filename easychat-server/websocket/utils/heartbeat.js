const WebSocket = require('ws');

/**
 * 初始化心跳检测机制
 * @param {WebSocket.Server} wss WebSocket服务器实例
 * @param {number} interval 心跳检测间隔（毫秒），默认30秒
 * @returns {NodeJS.Timeout} 定时器ID，可用于清除定时器
 */
function initHeartbeat(wss, interval = 30000) {
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      // 如果客户端没有响应上一次ping，则终止连接
      if (ws.isAlive === false) {
        return ws.terminate();
      }

      // 假设连接已断开，等待pong响应
      ws.isAlive = false;
      // 发送ping帧
      ws.ping(() => { });
    });
  }, interval);

  return heartbeatInterval;
}

/**
 * 设置WebSocket连接的心跳处理
 * @param {WebSocket} ws WebSocket连接
 */
function setupHeartbeatHandlers(ws) {
  // 初始设置为活跃状态
  ws.isAlive = true;

  // 当收到pong响应时，标记为活跃
  ws.on('pong', () => {
    ws.isAlive = true;
  });
}

module.exports = {
  initHeartbeat,
  setupHeartbeatHandlers
};