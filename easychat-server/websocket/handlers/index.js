const handleAuthMessage = require('./auth');
const handleChatMessage = require('./chat');

function handleMessage(ws, data, clients) {
  switch (data.type) {
    case 'auth':
      handleAuthMessage(ws, data, clients);
      break;

    case 'ping':
      // 回复pong消息
      ws.send(JSON.stringify({
        type: 'pong'
      }));
      break;

    case 'chat_message':
      handleChatMessage(ws, data, clients);
      break;

    default:
      console.log('未知消息类型:', data.type);
      ws.send(JSON.stringify({
        type: 'error',
        message: '未知消息类型'
      }));
  }
}

module.exports = handleMessage;