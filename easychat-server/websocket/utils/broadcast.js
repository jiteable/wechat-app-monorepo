const WebSocket = require('ws');

/**
 * 广播消息给指定用户
 * @param {Map} clients 用户连接映射表
 * @param {string} userId 目标用户ID
 * @param {Object} messageData 要发送的消息对象
 * @returns {boolean} 是否成功发送
 */
function broadcastToUser(clients, userId, messageData) {
  console.log('clients: ', clients)
  const client = clients.get(userId);
  console.log('client: ', client)
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(messageData));
    return true;
  }
  return false;
}

/**
 * 向会话中的所有参与者广播消息（适用于群聊和私聊）
 * @param {Map} clients 用户连接映射表
 * @param {Object} session 会话对象，包含参与者信息
 * @param {Object} messageData 要发送的消息对象
 * @param {string} excludeUserId 可选，要排除的用户ID
 * @returns {number} 成功发送的用户数量
 */
function broadcastToSession(clients, session, messageData, excludeUserId = null) {
  let count = 0;

  // 根据会话类型处理不同的广播逻辑
  if (session.sessionType === 'group' && session.groupId) {
    // 群聊会话 - 广播给群组所有成员
    // 注意：这里假设 session.group 包含了 memberIds 数组
    if (session.group && Array.isArray(session.group.memberIds)) {
      session.group.memberIds.forEach(userId => {
        // 排除指定用户（例如消息发送者）
        if (userId !== excludeUserId) {
          if (broadcastToUser(clients, userId, messageData)) {
            count++;
          }
        }
      });
    }
    // 如果群组没有memberIds，但有ChatSessionUsers，则使用它
    else if (session.ChatSessionUsers && Array.isArray(session.ChatSessionUsers)) {
      session.ChatSessionUsers.forEach(user => {
        // 排除指定用户（例如消息发送者）
        if (user.userId !== excludeUserId) {
          if (broadcastToUser(clients, user.userId, messageData)) {
            count++;
          }
        }
      });
    }
  } else if (session.sessionType === 'private' && session.ChatSessionUsers) {
    // 私聊会话 - 广播给所有参与者
    console.log('session.ChatSessionUsers: ', session.ChatSessionUsers)
    if (Array.isArray(session.ChatSessionUsers)) {
      session.ChatSessionUsers.forEach(user => {
        // 排除指定用户（例如消息发送者）
        if (user.userId !== excludeUserId) {
          console.log('user.userId: ', user.userId)
          if (broadcastToUser(clients, user.userId, messageData)) {
            count++;
          }
        }
      });
    }
  }

  console.log(`已向会话 ${session.id} 的 ${count} 个参与者发送消息`);
  return count;
}

/**
 * 向群组所有成员广播消息
 * @param {Map} clients 用户连接映射表
 * @param {Object} group 群组对象，应包含memberIds数组
 * @param {Object} messageData 要发送的消息对象
 * @param {string} excludeUserId 可选，要排除的用户ID
 * @returns {number} 成功发送的用户数量
 */
function broadcastToGroup(clients, group, messageData, excludeUserId = null) {
  let count = 0;

  if (Array.isArray(group.memberIds)) {
    group.memberIds.forEach(userId => {
      // 排除指定用户
      if (userId !== excludeUserId) {
        if (broadcastToUser(clients, userId, messageData)) {
          count++;
        }
      }
    });
  }

  console.log(`已向群组 ${group.id} 的 ${count} 个成员发送消息`);
  return count;
}

/**
 * 向私聊双方广播消息
 * @param {Map} clients 用户连接映射表
 * @param {string} user1Id 用户1 ID
 * @param {string} user2Id 用户2 ID
 * @param {Object} messageData 要发送的消息对象
 * @param {string} excludeUserId 可选，要排除的用户ID
 * @returns {number} 成功发送的用户数量
 */
function broadcastToPrivateChat(clients, user1Id, user2Id, messageData, excludeUserId = null) {
  let count = 0;
  const participants = [user1Id, user2Id];

  participants.forEach(userId => {
    // 排除指定用户
    if (userId !== excludeUserId) {
      if (broadcastToUser(clients, userId, messageData)) {
        count++;
      }
    }
  });

  console.log(`已向私聊双方 ${count} 人发送消息`);
  return count;
}

module.exports = {
  broadcastToUser,
  broadcastToSession,
  broadcastToGroup,
  broadcastToPrivateChat
};