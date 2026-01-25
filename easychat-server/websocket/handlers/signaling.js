const WebSocket = require('ws');
const { broadcastToUser } = require('../utils/broadcast');

// 存储正在进行的通话
const activeCalls = new Map();

/**
 * 处理WebRTC信令消息
 * @param {WebSocket} ws WebSocket连接
 * @param {Object} data 信令数据
 * @param {Map} clients 所有客户端映射
 */
function handleSignalingMessage(ws, data, clients) {
  const { type, targetUserId, sessionId, payload } = data;

  // 确保用户已认证
  if (!ws.userId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'User not authenticated'
    }));
    return;
  }

  switch (type) {
    // 发起通话请求
    case 'call_initiate':
      handleCallInitiate(ws, data, clients);
      break;

    // 接受通话请求
    case 'call_accept':
      handleCallAccept(ws, data, clients);
      break;

    // 拒绝通话请求
    case 'call_reject':
      handleCallReject(ws, data, clients);
      break;

    // 结束通话
    case 'call_end':
      handleCallEnd(ws, data, clients);
      break;

    // 交换SDP
    case 'offer':
      handleOffer(ws, data, clients);
      break;

    case 'answer':
      handleAnswer(ws, data, clients);
      break;

    // 传输ICE候选
    case 'ice_candidate':
      handleIceCandidate(ws, data, clients);
      break;

    default:
      console.log('Unknown signaling type:', type);
  }
}

/**
 * 发起通话请求
 */
function handleCallInitiate(ws, data, clients) {
  const { targetUserId, sessionId, callType, callerInfo } = data;

  if (!targetUserId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Target user ID is required'
    }));
    return;
  }

  // 打印接收到的通话信息
  console.log('收到通话发起请求:', {
    targetUserId,
    sessionId,
    callType,
    callerInfo,
    fromUserId: ws.userId
  });

  // 检查目标用户是否在线
  const targetWs = clients.get(targetUserId);
  if (!targetWs) {
    ws.send(JSON.stringify({
      type: 'call_failed',
      message: 'Target user is offline'
    }));
    return;
  }

  // 检查是否已经有通话
  const callKey = [ws.userId, targetUserId].sort().join('-');
  if (activeCalls.has(callKey)) {
    ws.send(JSON.stringify({
      type: 'call_failed',
      message: 'Already in a call with this user'
    }));
    return;
  }

  // 创建通话记录
  const callId = generateCallId();
  const callInfo = {
    id: callId,
    callerId: ws.userId,
    calleeId: targetUserId,
    sessionId,
    callType: callType || 'video', // 'audio' or 'video'
    status: 'ringing',
    initiatedAt: new Date(),
    participants: [ws.userId, targetUserId]
  };

  activeCalls.set(callKey, callInfo);

  // 构建发送给被叫方的消息
  const incomingCallMessage = {
    type: 'incoming_call',
    callId,
    callerId: ws.userId,
    callerName: callerInfo?.name || ws.userInfo?.username || 'Unknown',
    callerAvatar: callerInfo?.avatar || ws.userInfo?.avatar || '',
    callType: callInfo.callType,
    sessionId
  };

  // 打印将要发送给被叫方的消息内容
  console.log('发送给被叫方的消息:', incomingCallMessage);

  // 发送通话请求到被叫方
  broadcastToUser(clients, targetUserId, incomingCallMessage);

  // 构建发送给发起方的消息
  const callInitiatedMessage = {
    type: 'call_initiated',
    callId,
    targetUserId,
    status: 'ringing'
  };

  // 打印将要发送给发起方的消息内容
  console.log('发送给发起方的消息:', callInitiatedMessage);

  // 通知发起方通话已发送
  ws.send(JSON.stringify(callInitiatedMessage));
}

/**
 * 接受通话请求
 */
function handleCallAccept(ws, data, clients) {
  const { callId, targetUserId } = data;

  // 查找通话记录
  let callInfo = null;
  let callKey = null;

  for (const [key, call] of activeCalls.entries()) {
    if (call.id === callId) {
      callInfo = call;
      callKey = key;
      break;
    }
  }

  if (!callInfo) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Call not found'
    }));
    return;
  }

  // 检查是否是被叫方接受
  if (ws.userId !== callInfo.calleeId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Only callee can accept the call'
    }));
    return;
  }

  // 更新通话状态
  callInfo.status = 'connected';
  callInfo.acceptedAt = new Date();

  // 通知双方通话已建立
  broadcastToUser(clients, callInfo.callerId, {
    type: 'call_accepted',
    callId: callInfo.id,
    targetUserId: ws.userId
  });

  ws.send(JSON.stringify({
    type: 'call_accepted',
    callId: callInfo.id,
    targetUserId: callInfo.callerId
  }));
}

/**
 * 拒绝通话请求
 */
function handleCallReject(ws, data, clients) {
  const { callId, targetUserId } = data;

  // 查找通话记录
  let callInfo = null;
  let callKey = null;

  for (const [key, call] of activeCalls.entries()) {
    if (call.id === callId) {
      callInfo = call;
      callKey = key;
      break;
    }
  }

  if (!callInfo) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Call not found'
    }));
    return;
  }

  // 检查是否是被叫方拒绝
  if (ws.userId !== callInfo.calleeId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Only callee can reject the call'
    }));
    return;
  }

  // 通知发起方通话被拒绝
  broadcastToUser(clients, callInfo.callerId, {
    type: 'call_rejected',
    callId,
    rejectedBy: ws.userId
  });

  // 通知被叫方通话已拒绝
  ws.send(JSON.stringify({
    type: 'call_rejected',
    callId,
    reason: 'rejected_by_callee'
  }));

  // 从活动通话中移除
  if (callKey) {
    activeCalls.delete(callKey);
  }
}

/**
 * 结束通话
 */
function handleCallEnd(ws, data, clients) {
  const { callId } = data;

  // 查找通话记录
  let callInfo = null;
  let callKey = null;

  for (const [key, call] of activeCalls.entries()) {
    if (call.id === callId) {
      callInfo = call;
      callKey = key;
      break;
    }
  }

  if (!callInfo) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Call not found'
    }));
    return;
  }

  // 检查是否是通话参与者
  if (![callInfo.callerId, callInfo.calleeId].includes(ws.userId)) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Not participant of this call'
    }));
    return;
  }

  // 通知双方通话结束
  broadcastToUser(clients, callInfo.callerId, {
    type: 'call_ended',
    callId,
    endedBy: ws.userId,
    endedAt: new Date()
  });

  broadcastToUser(clients, callInfo.calleeId, {
    type: 'call_ended',
    callId,
    endedBy: ws.userId,
    endedAt: new Date()
  });

  // 从活动通话中移除
  if (callKey) {
    activeCalls.delete(callKey);
  }
}

/**
 * 处理SDP Offer
 */
function handleOffer(ws, data, clients) {
  const { targetUserId, sessionId, sdp, callId } = data;

  if (!targetUserId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Target user ID is required'
    }));
    return;
  }

  // 检查目标用户是否在线
  const targetWs = clients.get(targetUserId);
  if (!targetWs) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Target user is offline'
    }));
    return;
  }

  // 发送offer到目标用户
  broadcastToUser(clients, targetUserId, {
    type: 'offer',
    callId,
    sdp,
    senderId: ws.userId,
    sessionId
  });
}

/**
 * 处理SDP Answer
 */
function handleAnswer(ws, data, clients) {
  const { targetUserId, sessionId, sdp, callId } = data;

  if (!targetUserId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Target user ID is required'
    }));
    return;
  }

  // 检查目标用户是否在线
  const targetWs = clients.get(targetUserId);
  if (!targetWs) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Target user is offline'
    }));
    return;
  }

  // 发送answer到目标用户
  broadcastToUser(clients, targetUserId, {
    type: 'answer',
    callId,
    sdp,
    senderId: ws.userId,
    sessionId
  });
}

/**
 * 处理ICE候选
 */
function handleIceCandidate(ws, data, clients) {
  const { targetUserId, sessionId, candidate, callId } = data;

  if (!targetUserId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Target user ID is required'
    }));
    return;
  }

  // 检查目标用户是否在线
  const targetWs = clients.get(targetUserId);
  if (!targetWs) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Target user is offline'
    }));
    return;
  }

  // 发送candidate到目标用户
  broadcastToUser(clients, targetUserId, {
    type: 'ice_candidate',
    callId,
    candidate,
    senderId: ws.userId,
    sessionId
  });
}

/**
 * 生成唯一通话ID
 */
function generateCallId() {
  return 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

module.exports = handleSignalingMessage;