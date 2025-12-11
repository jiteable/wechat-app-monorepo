<template>
  <div class="chat-contant-container">
    <WindowControls />
    <div class="chat-contant">
      <div v-if="route.params.id" class="chat-id">
        <el-splitter layout="vertical">
          <el-splitter-panel size="60%">
            <div class="chat-messages-container">
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
                <div v-else class="message-bubble"
                  :class="message.senderId === userStore.userId ? 'sent-message' : 'received-message'">
                  <!-- 接收的消息显示发送者 -->
                  <div v-if="message.senderId !== userStore.userId" class="message-sender">
                    {{ message.senderName }}
                  </div>
                  <!-- 消息内容 -->
                  <div class="message-content">
                    {{ message.content }}
                  </div>
                </div>
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
import { ref, nextTick, watch } from 'vue'
import { sendMessage } from '@/api/chat'

const route = useRoute()
const contactStore = userContactStore()
const userStore = useUserStore()

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
    }
  },
  { immediate: true }
)

console.log(route.params.id) // 当前用户ID

// 输入框数据
const message = ref('')

// 消息数据（假数据）
const messages = ref([
  {
    id: 1,
    type: 'timestamp',
    content: '今天 10:30'
  },
  {
    id: 2,
    type: 'system',
    content: '你已添加了好友，现在可以开始聊天了'
  },
  {
    id: 3,
    type: 'message',
    senderId: 'other-user-id', // 不是当前用户ID，显示在左侧
    senderName: '张三',
    content: '你好！这个聊天应用看起来不错'
  },
  {
    id: 4,
    type: 'message',
    senderId: userStore.userId, // 当前用户ID，显示在右侧
    senderName: '我',
    content: '是的，我也觉得很好用！'
  },
  {
    id: 5,
    type: 'message',
    senderId: 'other-user-id', // 不是当前用户ID，显示在左侧
    senderName: '张三',
    content: '我们可以一起开发更多功能'
  }
])

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
</script>

<style scoped>
.chat-contant-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgb(236, 237, 237);
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
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  padding: 15px;
  overflow-y: scroll;
  /* 始终显示滚动条 */
}

.message-item {
  display: flex;
  flex-direction: column;
}

/* 消息气泡基础样式 */
.message-bubble {
  max-width: 70%;
  padding: 10px 15px;
  margin-bottom: 15px;
  border-radius: 10px;
  position: relative;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  /* 防止内容被压缩 */
}

/* 接收的消息样式 */
.received-message {
  align-self: flex-start;
  background-color: white;
  border-top-left-radius: 0;
}

/* 发送的消息样式 */
.sent-message {
  align-self: flex-end;
  background-color: #409eff;
  color: white;
  border-top-right-radius: 0;
}

/* 消息发送者信息 */
.message-sender {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

/* 消息内容 */
.message-content {
  font-size: 14px;
  line-height: 1.4;
}

/* 时间戳样式 */
.message-timestamp {
  font-size: 12px;
  color: #909399;
  text-align: center;
  margin: 10px 0;
  flex-shrink: 0;
  /* 防止时间戳被压缩 */
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
  /* 防止系统消息被压缩 */
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
