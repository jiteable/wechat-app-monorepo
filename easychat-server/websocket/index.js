const WebSocket = require('ws');
const handleMessage = require('./handlers');
const heartbeat = require('./utils/heartbeat');
const broadcast = require('./utils/broadcast');

/**
 * 初始化WebSocket服务器
 * @param {import('http').Server} server HTTP服务器实例
 */
function initWebSocketServer(server) {
  // 创建WebSocket服务器，指定客户端连接路径为 /ws
  const wss = new WebSocket.Server({ server, path: '/ws' });

  // 定期进行心跳检测
  const interval = setInterval(() => {
    wss.clients.forEach(ws => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // 每30秒检测一次

  wss.on('connection', (ws, req) => {
    console.log('新的WebSocket连接建立');

    // 初始化连接状态
    ws.isAlive = true;

    // 设置事件监听器
    ws.on('message', message => {
      handleMessage(ws, message, wss);
    });

    ws.on('pong', () => {
      heartbeat(ws);
    });

    ws.on('close', () => {
      console.log('WebSocket连接关闭');
    });

    ws.on('error', error => {
      console.error('WebSocket错误:', error);
    });
  });

  wss.on('error', error => {
    console.error('WebSocket服务器错误:', error);
  });

  // 在服务器关闭时清理定时器
  server.on('close', () => {
    clearInterval(interval);
  });

  console.log('WebSocket服务器初始化完成');
  return wss;
}

module.exports = initWebSocketServer;