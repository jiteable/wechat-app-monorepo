// 用于管理WebSocket客户端映射的模块

let clients = null;

/**
 * 设置WebSocket客户端映射
 * @param {Map} clientsMap 客户端映射
 */
function setWebSocketClients(clientsMap) {
  clients = clientsMap;
}

/**
 * 获取WebSocket客户端映射
 * @returns {Map|null} 客户端映射
 */
function getWebSocketClients() {
  return clients;
}

module.exports = {
  setWebSocketClients,
  getWebSocketClients
};