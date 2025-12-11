<template>
  <div class="chat-contant-container">
    <WindowControls>
      <div v-if="route.params.id" class="top">
        <div class="user-info">
          <span class="user-name">{{ getDisplayName }}</span>
        </div>
        <div class="chat-actions no-drag">
          <el-button type="text" @click="toggleChat">
            <span class="icon iconfont icon-chat"></span>
          </el-button>
        </div>
      </div>
    </WindowControls>
    <div class="chat-contant">
      <div v-if="route.params.id" class="chat-id">
        <el-splitter layout="vertical">
          <el-splitter-panel size="60%">
            <div class="chat-messages-container" ref="messagesContainer" @scroll="handleScroll">
              <!-- 使用 v-for 渲染消息列表 -->
              <div v-for="message in messages" :key="message.id" class="message-item">
                <!-- 时间戳 -->
                <div v-if="message.type === 'timestamp'" class="message-timestamp">
                  {{ message.content }}
                </div>

                <!-- 系统消息 -->
                <div v-else-if="message.type === 'system'" class="system-message">
                  {{ message.content }}
                </div>

                <!-- 普通消息 -->
                <div v-else :class="message.senderId === userStore.userId ? 'sent-message' : 'received-message'">
                  <el-avatar shape="square" :size="35" :src="message.senderAvatar" class="avatar" />
                  <div class="box">
                    <div v-if="shouldShowSenderName(message)" class="message-sender">
                      {{ message.senderName }}
                    </div>
                    <div class="message-bubble">
                      <div class="message-content">
                        {{ message.content }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 加载更多提示 -->
              <div v-if="loadingMore" class="loading-more">
                <el-spinner size="small" />
                <span>加载中...</span>
              </div>
            </div>
          </el-splitter-panel>
          <el-splitter-panel :min="185" :max="380">
            <div class="demo-panel">
              <div class="chat-input-area">
                <div class="input-icons">
                  <el-button type="text" @click="showEmojiPicker">
                    <span class="icon iconfont icon-xiaolian"></span>
                  </el-button>
                  <el-button type="text" @click="uploadFile">
                    <span class="icon iconfont icon-wenjian"></span>
                  </el-button>
                </div>

                <div class="input-content">
                  <el-input v-model="message" type="textarea" placeholder="输入消息..." maxlength="2000" resize="none"
                    @keydown.enter="handleEnterKey" />
                </div>

                <div class="input-actions">
                  <el-button type="primary" :disabled="!message" @click="sendMessageHandler">
                    发送(S)
                  </el-button>
                </div>
              </div>
            </div>
          </el-splitter-panel>
        </el-splitter>
      </div>
      <div v-else class="empty-chat">
        <el-icon :size="100" color="#c0c4cc">
          <Message />
        </el-icon>
        <p>请选择一个聊天</p>
      </div>
    </div>

    <!-- 添加聊天输入区域 -->
  </div>
</template>

<script setup>
import WindowControls from '@/components/WindowControls.vue'
import { useRoute } from 'vue-router'
import { userContactStore } from '@/store/userContactStore'
import { useUserStore } from '@/store/userStore'
import { Message } from '@element-plus/icons-vue'
import { ref, nextTick, watch, computed } from 'vue'
import { sendMessage, getMessages } from '@/api/chat'

const route = useRoute()
const contactStore = userContactStore()
const userStore = useUserStore()

// 输入框数据
const message = ref('')

// 消息数据（从API获取）
const messages = ref([])

// 分页相关数据
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  totalMessages: 0,
  hasNextPage: false,
  hasPrevPage: false
})
const loadingMore = ref(false)
const messagesContainer = ref(null)

// 加载消息数据（带分页）
const loadMessages = async (sessionId, page = 1, prepend = false) => {
  try {
    const response = await getMessages({ sessionId, page, limit: 20 })
    if (response.data.success) {
      // 更新分页信息
      pagination.value = response.data.data.pagination

      // 将获取到的消息转换为组件所需格式
      const newMessages = response.data.data.messages.map(msg => ({
        id: msg.id,
        type: 'message',
        senderId: msg.senderId,
        senderName: msg.sender?.username || '未知用户',
        senderAvatar: msg.sender?.avatar,
        content: msg.content,
        timestamp: msg.timestamp
      }))

      if (prepend) {
        // 在顶部添加旧消息（加载历史消息）
        messages.value = [...newMessages, ...messages.value]
      } else {
        // 替换所有消息（初始化或刷新）
        messages.value = newMessages
      }

      console.log('message.value: ', messages.value)
    }
  } catch (error) {
    console.error('获取消息失败:', error)
  }
}

// 监听选中会话的变化并打印信息
watch(
  () => contactStore.selectedContact,
  (newSession) => {
    if (newSession) {
      console.log('ChatContant中获取到的会话信息:', newSession)
      console.log('会话ID:', newSession.id)
      console.log('会话名称:', newSession.name)
      console.log('会话类型:', newSession.sessionType)
      console.log('会话头像:', newSession.avatar)
      console.log('未读消息数:', newSession.unreadCount)
      console.log('更新时间:', newSession.updatedAt)

      // 当选中会话变化时，获取该会话的消息
      loadMessages(newSession.id)
    }
  },
  { immediate: true }
)

console.log(route.params.id) // 当前会话ID

// 计算属性：根据会话类型显示不同的名称
const getDisplayName = computed(() => {
  const session = contactStore.selectedContact
  if (!session) return ''

  // 如果是群聊，显示群名称
  if (session.sessionType === 'group' && session.group) {
    return session.group.name || '群聊'
  }

  // 如果是私聊，显示对方用户名
  if (session.sessionType === 'private' && session.name) {
    return session.name
  }

  return '聊天'
})

// 判断是否应该显示发送者名称
const shouldShowSenderName = (message) => {
  const session = contactStore.selectedContact

  // 如果没有会话信息，不显示发送者名称
  if (!session) return false

  // 如果是私聊，不显示发送者名称
  if (session.sessionType === 'private') {
    return false
  }

  // 如果是群聊，检查showMemberNameCard设置
  if (session.sessionType === 'group') {
    // 如果showMemberNameCard为false，不显示发送者名称
    if (session.ChatSessionUsers && session.ChatSessionUsers.length > 0) {
      const currentUserSession = session.ChatSessionUsers.find(user => user.userId === userStore.userId)
      if (currentUserSession && currentUserSession.showMemberNameCard === false) {
        return false
      }
    }
    // 只有当消息不是自己发送时才显示发送者名称
    return message.senderId !== userStore.userId
  }

  return false
}

// 处理滚动事件，实现无限滚动加载
const handleScroll = () => {
  const container = messagesContainer.value
  if (!container || loadingMore.value || !pagination.value.hasPrevPage) return

  // 当滚动到顶部附近时加载更多消息
  if (container.scrollTop <= 20) {
    loadMoreMessages()
  }
}

// 加载更多消息（向上翻页）
const loadMoreMessages = async () => {
  if (loadingMore.value || !pagination.value.hasPrevPage) return

  loadingMore.value = true
  const sessionId = contactStore.selectedContact?.id
  if (sessionId) {
    await loadMessages(sessionId, pagination.value.currentPage + 1, true)
  }
  loadingMore.value = false
}

// 发送消息
const sendMessageHandler = async () => {
  if (message.value.trim() && contactStore.selectedContact) {
    const selectedContact = contactStore.selectedContact

    try {
      // 构造消息对象
      const messageData = {
        sessionId: selectedContact.id,
        senderId: userStore.userId,
        messageType: 'text',
        content: message.value.trim()
      }
      console.log('12132aw')
      // 如果是私聊
      if (selectedContact.sessionType === 'private') {
        console.log('selectedContact.contactId: ', selectedContact.contactId)
        messageData.receiverId = selectedContact.contactId
      }
      // 如果是群聊
      else if (selectedContact.sessionType === 'group') {
        messageData.groupId = selectedContact.groupId
      }

      // 通过HTTP API发送消息到后端
      const response = await sendMessage(messageData)
      console.log('消息发送成功:', response)

      // 清空输入框
      message.value = ''
    } catch (error) {
      console.error('发送消息失败:', error)
    }
  }
}

const handleEnterKey = (event) => {
  // 如果按下的是 Ctrl+Enter 或 Shift+Enter，则换行
  if (event.ctrlKey || event.shiftKey) {
    const startPos = event.target.selectionStart
    const endPos = event.target.selectionEnd
    message.value = message.value.substring(0, startPos) + '\n' + message.value.substring(endPos)
    // 等待 DOM 更新后再设置光标位置
    nextTick(() => {
      event.target.selectionStart = startPos + 1
      event.target.selectionEnd = startPos + 1
    })
  } else {
    // 单独按 Enter 键发送消息
    event.preventDefault()
    sendMessageHandler()
  }
}

// 显示表情选择器
const showEmojiPicker = () => {
  console.log('显示表情选择器')
}

// 上传文件
const uploadFile = () => {
  console.log('上传文件')
}

// 切换聊天状态
const toggleChat = () => {
  console.log('切换聊天状态')
}
</script>

<style scoped>
.top {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  margin-top: 27px;
  border-bottom: 1px solid #e0e0e0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.chat-actions {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-actions .el-button {
  padding: 0;
  min-width: auto;
  border: none;
  background: transparent;
}

.chat-actions .el-button:hover {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
}

.chat-actions .iconfont {
  font-size: 20px;
  color: #606266;
}

.chat-contant-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgb(237, 237, 237);
}

.chat-contant {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chat-id {
  width: 100%;
  height: 100%;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.empty-chat p {
  margin-top: 20px;
  font-size: 16px;
}

.chat-messages-container {
  height: 100%;
  background-color: rgb(237, 237, 237);
  display: flex;
  flex-direction: column;
  padding: 15px;
  overflow-y: scroll;
  /* 始终显示滚动条 */
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 0;
  color: #909399;
}

.message-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}

/* 消息气泡基础样式 */
.message-bubble {
  max-width: 100%;
  padding: 6px 10px 8px 10px;
  border-radius: 7px;
  position: relative;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  display: inline-block;
  width: fit-content;
  /* 让气泡框宽度适应内容 */
}

/* 接收的消息样式 */
.received-message {
  align-self: flex-start;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
  /* 确保容器占满宽度 */
}

.received-message .box {
  width: 60%;
}

.received-message .avatar {
  margin-right: 8px;
  border-radius: 3px;
  width: 35px !important;
  height: 35px !important;
  flex-shrink: 0;
}

.received-message .message-bubble {
  background-color: white;
  position: relative;
}

.received-message .message-bubble::before {
  content: '';
  display: block;
  width: 0;
  height: 0;
  border: 4px solid transparent;
  border-right: 4px solid white;
  position: absolute;
  top: 6px;
  left: -8px;
}

/* 发送的消息样式 */
.sent-message {
  align-self: flex-end;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  width: 60%;
  margin-left: auto;
}

.sent-message .box {
  width: 100%;
}

.sent-message .avatar {
  margin-left: 8px;
  border-radius: 3px;
  width: 35px !important;
  height: 35px !important;
  flex-shrink: 0;
  order: 2;
  min-width: 35px;
  min-height: 35px;
}

.sent-message .message-bubble {
  background-color: #a6e860;
  position: relative;
}

.sent-message .message-bubble::after {
  content: '';
  display: block;
  width: 0;
  height: 0;
  border: 4px solid transparent;
  border-left: 4px solid #a6e860;
  position: absolute;
  top: 6px;
  right: -8px;
}

/* 消息发送者信息 */
.message-sender {
  font-size: 12px;
  color: #999;
  /* 将发送者名称放在消息气泡外部 */
  position: relative;
  z-index: 1;
  background-color: rgb(237, 237, 237);
  /* 使用不同的背景颜色 */
  border-radius: 4px;
}

/* 消息内容 */
.message-content {
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
  white-space: pre-wrap;
}

/* 时间戳样式 */
.message-timestamp {
  font-size: 12px;
  color: #999;
  text-align: center;
  margin: 10px 0;
  flex-shrink: 0;
}

/* 系统消息样式 */
.system-message {
  align-self: center;
  background-color: #e0e0e0;
  color: #606266;
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 4px;
  margin: 10px 0;
  flex-shrink: 0;
}

/* 聊天输入区域样式 */
.chat-input-area {
  height: 100%;
  padding: 10px;
  background-color: rgb(237, 237, 237);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-icons {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-left: 5px;
}

.input-icons .el-button {
  padding: 0;
  min-width: auto;
  border: none;
  background: transparent;
}

.input-icons .el-icon {
  font-size: 24px;
  color: #606266;
}

.input-icons .iconfont {
  font-size: 24px;
  color: #606266;
}

.input-content {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
}

.input-content .el-textarea {
  flex: 1;
  height: 100%;
}

.input-content :deep(.el-textarea__inner) {
  height: 100%;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  resize: none;
  box-shadow: 0 0 0 0 transparent;
  box-sizing: border-box;
  background-color: rgb(237, 237, 237);
}

.input-content :deep(.el-textarea__inner:focus) {
  outline: none;
  border: none;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  align-items: center;
}

.input-actions .el-button {
  padding: 0;
  min-width: auto;
  border: none;
  background: transparent;
}

.input-actions .el-button--primary {
  background-color: #409eff;
  color: white;
  border-radius: 4px;
  padding: 6px 12px;
}

.input-actions .el-icon {
  font-size: 18px;
  color: #606266;
}

.demo-panel {
  height: 100%;
}
</style>
