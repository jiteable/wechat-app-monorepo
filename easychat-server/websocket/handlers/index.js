const handleAuthMessage = require('./auth');
const handleChatMessage = require('./chat');
const handleDeleteMessage = require('./deleteMessage');
const handleSignalingMessage = require('./signaling');

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

    case 'send_message':
      handleChatMessage(ws, data, clients);
      break;

    case 'delete_message':
      handleDeleteMessage(ws, data, clients);
      break;

    case 'offer':
    case 'answer':
    case 'ice_candidate':
    case 'call_initiate':
    case 'call_accept':
    case 'call_reject':
    case 'call_end':
      handleSignalingMessage(ws, data, clients);
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