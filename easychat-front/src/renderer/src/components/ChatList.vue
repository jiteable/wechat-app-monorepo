<template>
  <div class="chat-list-container">
    <!-- 会话列表 -->
    <div class="chat-list no-drag">
      <div v-for="session in filteredSessions" :key="session.id" class="chat-item-wrapper">
        <button
          class="chat-item"
          :class="{ active: selectedSessionId === session.id }"
          @click="handleClickSession(session)"
          @contextmenu.prevent="showContextMenu($event, session)"
        >
          <!-- 头像 -->
          <div>
            <!-- 未读消息红点 -->
            <div v-if="session.unreadCount > 0" class="unread-badge">
              {{ session.unreadCount > 99 ? '~' : session.unreadCount }}
            </div>
            <div class="avatar-wrapper">
              <el-avatar :src="session.avatar" alt="avatar" class="avatar" shape="square" />
            </div>
          </div>

          <!-- 信息区域和时间 -->
          <div class="content-wrapper">
            <div class="info">
              <div class="title">{{ session.customRemark || session.name }}</div>
              <div class="last-message">
                {{ formatLastMessage(session.lastMessage, session.sessionType) }}
              </div>
            </div>

            <!-- 时间移到右上角 -->
            <div class="time">
              {{ formatDate(session.updatedAt) }}
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- 全局右键菜单 -->
    <div
      v-show="contextMenuVisible"
      class="context-menu no-drag"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
    >
      <div class="context-menu-item" @click="handleContextCommand('top')">
        {{ contextMenuSession?.isPinned ? '取消置顶' : '置顶' }}
      </div>
      <div class="context-menu-item" @click="handleContextCommand('mute')">消息免打扰</div>
      <div class="context-menu-item danger" @click="handleContextCommand('delete')">删除</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { userContactStore } from '@/store/userContactStore'
import { useUserStore } from '@/store/userStore'
import { getSessions } from '@/api/chatSession'
import { markAsRead } from '@/api/chat'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const contactStore = userContactStore()
const router = useRouter()
const route = useRoute() // 添加route

const updateSelectedSessionFromRoute = () => {
  const sessionId = route.params.id
  if (sessionId) {
    selectedSessionId.value = sessionId
  } else {
    selectedSessionId.value = null
  }
}
// 定义刷新函数
const refreshSessions = () => {
  fetchSessions()
}

// 搜索关键词
const searchText = ref('')

// 当前选中的会话ID
const selectedSessionId = ref(null)

// 右键菜单相关
const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuSession = ref(null)

// 从本地数据库获取会话
const fetchSessions = async () => {
  try {
    // 首先尝试从本地数据库获取会话
    if (window.api && typeof window.api.getAllChatSessions === 'function') {
      // 获取当前用户ID（从 userStore 中获取）
      const userStore = useUserStore()
      const userId = userStore.userId

      if (userId) {
        const localResult = await window.api.getAllChatSessions(userId)
        console.log('getlocalResult: ', localResult)

        if (localResult.success && localResult.data) {
          // 从本地数据库获取到了会话数据
          sessions.value = localResult.data
          return
        }
      } else {
        console.log('用户ID未找到，可能用户尚未登录')
      }
    }

    const response = await getSessions()

    console.log('getsession: ', response)
    if (response && response.success) {
      sessions.value = response.data

      // 将服务器获取到的会话同步到本地数据库
      if (
        window.api &&
        typeof window.api.syncChatSessions === 'function' &&
        response.data.length > 0
      ) {
        try {
          await window.api.syncChatSessions(response.data)
          console.log('会话数据已同步到本地数据库')

          // 同步 ChatSessionUser 数据
          // 这里需要获取当前用户的会话关系数据并同步
        } catch (syncError) {
          console.error('同步会话到本地数据库失败:', syncError)
        }
      }
    } else {
      ElMessage.error('获取会话失败')
    }
  } catch (error) {
    console.error('Error fetching sessions:', error)
    ElMessage.error('网络错误，请重试')
  }
}

// 会话数据
const sessions = ref([])

// 过滤后的会话（支持搜索）
const filteredSessions = computed(() => {
  if (!searchText.value) {
    // 对会话进行排序：置顶会话在前，非置顶会话在后，各自按更新时间排序
    const sortedSessions = [...sessions.value].sort((a, b) => {
      // 首先按置顶状态排序：置顶的在前
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      // 如果置顶状态相同，则按更新时间排序（最新的在前）
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })
    return sortedSessions
  }
  return sessions.value.filter((session) =>
    session.name.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

// 格式化最后一条消息
const formatLastMessage = (msg, sessionType) => {
  if (!msg) return ''
  if (msg.isRecalled) return '消息已撤回'
  if (msg.isDeleted) return '消息已删除'

  // 获取当前用户ID
  const userStore = useUserStore()
  const currentUserId = userStore.userId

  // 如果是群聊且消息有发送者信息，且发送者不是当前用户，则显示发送者用户名
  if (sessionType === 'group' && msg.senderName && msg.senderId !== currentUserId) {
    if (msg.messageType === 'image') return `${msg.senderName}: [图片]`
    if (msg.messageType === 'file') return `${msg.senderName}: [文件]: ${msg.fileName || ''}`
    if (msg.messageType === 'voice') return `${msg.senderName}: [语音]`
    if (msg.messageType === 'video') return `${msg.senderName}: [视频]`

    const content = msg.content || ''
    return `${msg.senderName}: ${content.length > 20 ? content.slice(0, 20) + '...' : content}`
  }

  // 单聊或其他情况保持原有逻辑
  if (msg.messageType === 'image') return '[图片]'
  if (msg.messageType === 'file') return `[文件]: ${msg.fileName || ''}`
  if (msg.messageType === 'voice') return '[语音]'
  if (msg.messageType === 'video') return '[视频]'

  return msg.content && msg.content.length > 20
    ? msg.content.slice(0, 20) + '...'
    : msg.content || ''
}

// 添加对群聊信息更新事件的处理
const handleGroupInfoUpdated = (event) => {
  const { sessionId, newName } = event.detail

  // 查找对应的会话并更新名称
  const sessionIndex = sessions.value.findIndex((session) => session.id === sessionId)
  if (sessionIndex !== -1) {
    sessions.value[sessionIndex].name = newName
    // 如果该会话在本地数据库中也存在，同步更新
    if (window.api && typeof window.api.updateChatSessionName === 'function') {
      window.api
        .updateChatSessionName(sessionId, newName)
        .catch((err) => console.error('更新本地会话名称失败:', err))
    }
  }
}

// 格式化时间
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()

  // 获取日期差（毫秒）
  const diffInMs = now - date
  const diffInHours = diffInMs / (1000 * 60 * 60)
  const diffInDays = diffInHours / 24

  // 获取具体时间（小时:分钟）
  const timeString = date.toTimeString().slice(0, 5)

  // 一天内显示具体时间
  if (diffInHours < 24) {
    return timeString
  }
  // 两天内显示昨天+具体时间
  else if (diffInDays < 2) {
    return `昨天 ${timeString}`
  }
  // 一周内显示对应的星期
  else if (diffInDays < 7) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.getDay()]
  }
  // 去年及以前显示 年/月/日
  else if (date.getFullYear() < now.getFullYear()) {
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`
  }
  // 其他情况显示 月/日
  else {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`
  }
}

// 点击会话跳转
const handleClickSession = async (session) => {
  // 隐藏右键菜单
  contextMenuVisible.value = false

  // 如果点击的是当前已选中的会话，则不执行重复操作，但仍需确保数据正确
  if (selectedSessionId.value === session.id) {
    // 确保会话数据仍然在store中
    console.log('重复会话')
    // 发送事件更新会话信息，但不重新加载
    window.dispatchEvent(
      new CustomEvent('contactStoreUpdated', {
        detail: { selectedContact: session }
      })
    )
    return
  }

  // 设置当前选中的会话ID
  selectedSessionId.value = session.id

  // 如果有未读消息，标记为已读
  if (session.unreadCount > 0) {
    try {
      await markAsRead(session.id)
      console.log('会话消息已标记为已读')

      // 更新本地会话的未读计数
      const updatedSessions = sessions.value.map((s) =>
        s.id === session.id ? { ...s, unreadCount: 0 } : s
      )
      sessions.value = updatedSessions

      // 更新store中的会话信息，以便ChatContant组件可以获取到正确的会话信息
      contactStore.setSelectedContact({
        ...session,
        unreadCount: 0
      })
    } catch (error) {
      console.error('标记消息为已读失败:', error)
    }
  } else {
    // 将当前会话保存到 Pinia 状态，以便ChatContant组件可以获取到正确的会话信息
    contactStore.setSelectedContact(session)
  }

  console.log('session: ', session)

  router.push(`/chat/${session.id}`)
}

// 显示右键菜单
const showContextMenu = (event, session) => {
  event.preventDefault()

  // 记录当前会话
  contextMenuSession.value = session

  // 设置菜单位置
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY

  // 显示菜单
  contextMenuVisible.value = true
}

// 处理右键菜单命令
const handleContextCommand = (command) => {
  // 隐藏菜单
  contextMenuVisible.value = false

  if (!contextMenuSession.value) return

  switch (command) {
    case 'top':
      handleTopSession(contextMenuSession.value)
      break
    case 'mute':
      handleMuteSession(contextMenuSession.value)
      break
    case 'delete':
      handleDeleteSession(contextMenuSession.value)
      break
  }
}

// 置顶会话
const handleTopSession = async (session) => {
  // 保存原始状态以备回滚
  const sessionIndex = sessions.value.findIndex((s) => s.id === session.id)
  let originalIsPinned = null
  let userSessionId = null

  if (sessionIndex !== -1) {
    originalIsPinned = sessions.value[sessionIndex].isPinned
    userSessionId = sessions.value[sessionIndex].userSessionId
  }

  try {
    if (sessionIndex !== -1) {
      // 更新会话的置顶状态
      sessions.value[sessionIndex].isPinned = !originalIsPinned
      const newIsPinned = sessions.value[sessionIndex].isPinned

      // 根据新的置顶状态重新排序会话列表
      const sortedSessions = [...sessions.value].sort((a, b) => {
        // 首先按置顶状态排序：置顶的在前
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        // 如果置顶状态相同，则按更新时间排序（最新的在前）
        return new Date(b.updatedAt) - new Date(a.updatedAt)
      })

      // 更新会话列表
      sessions.value = sortedSessions

      // 更新本地数据库中的isPinned值 - 使用之前保存的userSessionId
      if (window.api && typeof window.api.updateChatSessionUser === 'function' && userSessionId) {
        await window.api.updateChatSessionUser(userSessionId, {
          isPinned: newIsPinned // 使用新的置顶状态
        })
      } else if (!userSessionId) {
        console.error('无法获取userSessionId，无法更新置顶状态')
        // 如果没有userSessionId，恢复原始状态
        sessions.value[sessionIndex].isPinned = originalIsPinned
      }

      ElMessage.success(`${newIsPinned ? '已置顶' : '已取消置顶'}会话 "${session.name}"`)
    }
  } catch (error) {
    console.error('更新会话置顶状态失败:', error)
    ElMessage.error('更新会话置顶状态失败')

    // 如果更新失败，恢复原始状态
    if (sessionIndex !== -1 && originalIsPinned !== null) {
      sessions.value[sessionIndex].isPinned = originalIsPinned
      console.log('已恢复原始置顶状态:', originalIsPinned)
    }
  }
}
// 消息免打扰
const handleMuteSession = (session) => {
  ElMessage.info(`设置会话 "${session.name}" 消息免打扰`)
  // 实现免打扰逻辑
}

// 删除会话
const handleDeleteSession = (session) => {
  ElMessageBox.confirm(`确定要删除会话 "${session.name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        // 从本地数据库中删除会话及相关数据
        if (window.api && typeof window.api.deleteChatSession === 'function') {
          await window.api.deleteChatSession(session.id)
        }

        // 检查是否删除的是当前选中的会话
        const isCurrentSession = selectedSessionId.value === session.id

        // 从界面中移除会话
        sessions.value = sessions.value.filter((s) => s.id !== session.id)
        ElMessage.success('删除成功')

        // 如果删除的是当前选中的会话，则跳转到 /chat
        if (isCurrentSession) {
          router.push('/chat')
        }
      } catch (error) {
        console.error('删除会话失败:', error)
        ElMessage.error('删除会话失败')
      }
    })
    .catch(() => {
      // 用户取消删除
      ElMessage.info('已取消删除')
    })
}

// 获取当前选中的会话ID
const getSelectedSessionId = () => {
  return selectedSessionId.value
}

// 点击其他地方隐藏菜单
const handleClickOutside = (event) => {
  if (contextMenuVisible.value) {
    contextMenuVisible.value = false
  }
}

// 页面加载时获取会话
fetchSessions()

// 添加WebSocket消息监听器
const handleNewMessage = (data) => {
  console.log('收到新消息:', data)

  // 查找对应的会话
  const sessionIndex = sessions.value.findIndex((session) => session.id === data.data.sessionId)

  if (sessionIndex !== -1) {
    // 更新会话的最后消息和时间
    const updatedSession = {
      ...sessions.value[sessionIndex],
      lastMessage: {
        content: data.data.content,
        messageType: data.data.messageType,
        fileName: data.data.fileName,
        isRecalled: false,
        isDeleted: false
      },
      updatedAt: data.data.timestamp || new Date().toISOString()
    }

    // 如果消息来自非当前会话，增加未读计数
    if (selectedSessionId.value !== data.data.sessionId) {
      updatedSession.unreadCount = (updatedSession.unreadCount || 0) + 1
    }

    // 更新会话列表中的该项
    sessions.value.splice(sessionIndex, 1, updatedSession)

    // 对会话列表按更新时间重新排序（最新的在前面）
    sessions.value.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

    console.log('会话列表已更新:', updatedSession)
  } else {
    console.log('未找到对应会话，可能需要刷新会话列表')
    // 如果没找到对应会话，可能是新增的会话，需要刷新整个会话列表
    fetchSessions()
  }
}

const handleLocalNewMessage = (event) => {
  const { sessionId, lastMessage, timestamp } = event.detail

  // 查找对应的会话
  const sessionIndex = sessions.value.findIndex((session) => session.id === sessionId)

  if (sessionIndex !== -1) {
    // 更新会话的最后消息和时间
    const updatedSession = {
      ...sessions.value[sessionIndex],
      lastMessage: lastMessage,
      updatedAt: timestamp
    }

    // 更新会话列表中的该项
    sessions.value.splice(sessionIndex, 1, updatedSession)

    // 对会话列表按更新时间重新排序（最新的在前面）
    sessions.value.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

    console.log('会话列表已更新:', updatedSession)
  }
}

// 组件挂载时监听事件
onMounted(() => {
  window.addEventListener('sessionCreated', refreshSessions)
  // 添加WebSocket消息监听
  window.api.onNewMessage(handleNewMessage)
  // 添加本地消息监听
  window.addEventListener('newMessageSent', handleLocalNewMessage)
  // 添加全局点击事件监听器
  document.addEventListener('click', handleClickOutside)
  // 添加群聊信息更新事件监听
  window.addEventListener('groupInfoUpdated', handleGroupInfoUpdated)

  // 添加会话列表更新事件监听，用于备注更新等场景
  window.addEventListener('sessionListUpdated', refreshSessions)

  // 监听路由变化
  updateSelectedSessionFromRoute()
  router.afterEach(updateSelectedSessionFromRoute)
})

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('sessionCreated', refreshSessions)
  // 如果API提供了移除WebSocket监听的方法，也需要在这里调用
  // window.api.offNewMessage(handleNewMessage)
  window.removeEventListener('newMessageSent', handleLocalNewMessage)
  // 移除全局点击事件监听器
  document.removeEventListener('click', handleClickOutside)
  // 移除群聊信息更新事件监听
  window.removeEventListener('groupInfoUpdated', handleGroupInfoUpdated)

  // 移除会话列表更新事件监听
  window.removeEventListener('sessionListUpdated', refreshSessions)

  // 移除路由监听
  router.afterEach(() => {})
})

// 如果需要在父组件中访问选中ID，可以暴露这个方法
defineExpose({
  getSelectedSessionId
})
</script>

<style scoped>
.chat-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  position: relative;
}

.chat-list {
  display: flex;
  flex-direction: column;
}

.chat-item-wrapper {
  position: relative;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 10px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
}

.chat-item:hover {
  background-color: rgb(234, 234, 234);
  transform: translateY(-1px);
}

.chat-item.active {
  background-color: rgb(222, 222, 222);
}

.chat-item.active:hover {
  background-color: rgb(211, 211, 211);
}

.avatar-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
  overflow: hidden;
  margin-right: 8px;
  flex-shrink: 0;
}

.avatar {
  width: 40px;
  height: 40px;
  object-fit: cover;
  flex-shrink: 0;
}

.unread-badge {
  position: absolute;
  top: 5px;
  left: 35px;
  background-color: #f56c6c;
  color: white;
  border-radius: 8px;
  padding: 0 5px;
  font-size: 10px;
  min-width: 15px;
  height: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.content-wrapper {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
  /* 允许子元素正确溢出 */
}

.info {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
  /* 允许内部文本正确溢出 */
}

.title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.last-message {
  font-size: 12px;
  color: rgb(150, 150, 150);
  padding-top: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time {
  font-size: 10px;
  color: #999;
  padding-top: 5px;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 40px;
  text-align: right;
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 9999;
  min-width: 120px;
  padding: 5px 0;
}

.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
}

.context-menu-item:hover {
  background-color: #ecf5ff;
  color: #409eff;
}

.context-menu-item.danger {
  color: #f56c6c;
}

.context-menu-item.danger:hover {
  background-color: #fef0f0;
  color: #f56c6c;
}
</style>
