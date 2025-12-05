const handleAuth = require('./auth');
const handleChatMessage = require('./chat');

/**
 * 处理不同类型的消息
 * @param {import('ws').WebSocket} ws WebSocket连接
 * @param {string} message 消息字符串
 * @param {import('ws').WebSocketServer} wss WebSocket服务器实例
 */
function handleMessage(ws, message, wss) {
  try {
    const parsedMessage = JSON.parse(message);

    switch (parsedMessage.type) {
      case 'auth':
        handleAuth(ws, parsedMessage);
        break;

      case 'chat_message':
        handleChatMessage(ws, parsedMessage, wss);
        break;

      case 'ping':
        // 回复 pong 消息
        ws.send(JSON.stringify({
          type: 'pong'
        }));
        break;

      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: '未知的消息类型'
        }));
    }
  } catch (error) {
    console.error('处理消息出错:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: '消息格式错误'
    }));
  }
}

module.exports = handleMessage;