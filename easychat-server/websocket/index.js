const WebSocket = require('ws');
const handleMessage = require('./handlers');
const { initHeartbeat, setupHeartbeatHandlers } = require('./utils/heartbeat');

// 存储连接的客户端 (userId -> websocket)
const clients = new Map();

function createWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', function connection(ws, req) {
    console.log('新的WebSocket连接已建立');

    // 设置心跳检测处理程序
    setupHeartbeatHandlers(ws);

    // 处理收到的消息
    ws.on('message', function incoming(message) {
      try {
        const data = JSON.parse(message);

        // 让处理器处理消息
        handleMessage(ws, data, clients);
      } catch (error) {
        console.error('解析消息错误:', error);
      }
    });

    // 处理连接关闭
    ws.on('close', function close() {
      console.log('WebSocket连接已关闭');
      if (ws.userId) {
        clients.delete(ws.userId);
        console.log(`用户 ${ws.userId} 已断开连接`);
      }
    });

    // 处理错误
    ws.on('error', function error(err) {
      console.error('WebSocket错误:', err);
      if (ws.userId) {
        clients.delete(ws.userId);
      }
    });
  });

  // 初始化心跳检测
  const heartbeatInterval = initHeartbeat(wss);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  return { wss, clients };
}

module.exports = createWebSocketServer;