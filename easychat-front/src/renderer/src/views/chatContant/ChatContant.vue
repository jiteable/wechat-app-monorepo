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
          <el-button class="el-button no-drag" type="text" @click="drawer = true">
            <span class="icon iconfont icon-more"></span>
          </el-button>
        </div>
      </div>
    </WindowControls>
    <div class="chat-contant">
      <div v-if="route.params.id" class="chat-id">
        <el-splitter layout="vertical">
          <el-splitter-panel size="60%">
            <div ref="messagesContainer" class="chat-messages-container" @scroll="handleScroll">
              <!-- 使用 v-for 渲染消息列表 -->
              <div
                v-for="message in [...messages].reverse()"
                :key="message.id"
                class="message-item"
              >
                <!-- 时间戳 -->
                <div v-if="message.type === 'timestamp'" class="message-timestamp">
                  {{ message.content }}
                </div>

                <!-- 系统消息 -->
                <div v-else-if="message.type === 'system'" class="system-message">
                  {{ message.content }}
                </div>

                <!-- 文件消息 -->
                <div
                  v-else-if="message.type === 'file'"
                  :class="
                    message.senderId === userStore.userId ? 'sent-message' : 'received-message'
                  "
                >
                  <el-avatar shape="square" :size="35" :src="message.senderAvatar" class="avatar" />
                  <div class="box">
                    <div v-if="shouldShowSenderName(message)" class="message-sender">
                      {{ message.senderName }}
                    </div>
                    <div class="message-bubble file-message-bubble">
                      <div class="file-container">
                        <div class="file-icon">
                          <!-- 使用通用文件图标 -->
                          <span class="icon iconfont icon-wenjian"></span>
                        </div>
                        <div class="file-info">
                          <div class="file-name">{{ message.content }}</div>
                          <div class="file-size">{{ message.size || '未知大小' }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 普通消息 -->
                <div
                  v-else
                  :class="
                    message.senderId === userStore.userId ? 'sent-message' : 'received-message'
                  "
                >
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
                  <el-popover
                    placement="top"
                    :width="300"
                    trigger="click"
                    popper-class="emoji-popover"
                  >
                    <template #reference>
                      <el-button type="text">
                        <span class="icon iconfont icon-xiaolian"></span>
                      </el-button>
                    </template>

                    <div class="emoji-container">
                      <!-- 表情分类 -->
                      <div
                        v-for="(category, categoryName) in emojiData"
                        :key="categoryName"
                        class="emoji-category"
                      >
                        <h4>{{ categoryName === 'recent' ? '最近使用' : categoryName }}</h4>
                        <div class="emoji-grid">
                          <el-tooltip
                            v-for="emoji in category"
                            :key="emoji.id"
                            :content="emoji.desc"
                            placement="top"
                            :show-after="500"
                          >
                            <div class="emoji-item" @click="insertEmoji(emoji.char)">
                              {{ emoji.char }}
                            </div>
                          </el-tooltip>
                        </div>
                      </div>

                      <!-- 底部快捷栏 -->
                      <div class="emoji-footer">
                        <div class="emoji-search">
                          <el-input
                            v-model="searchQuery"
                            placeholder="搜索表情..."
                            size="small"
                            prefix-icon="Search"
                            @input="filterEmojis"
                          />
                        </div>
                        <div class="emoji-shortcuts">
                          <div
                            v-for="shortcut in shortcuts"
                            :key="shortcut.name"
                            class="shortcut-item"
                            @click="showCategory(shortcut.category)"
                          >
                            {{ shortcut.icon }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </el-popover>
                  <el-button type="text" @click="triggerFileSelect">
                    <span class="icon iconfont icon-wenjian"></span>
                  </el-button>
                  <!-- 隐藏的文件输入框 -->
                  <input
                    ref="fileInput"
                    type="file"
                    style="display: none"
                    @change="handleFileUpload"
                  />
                </div>

                <div class="input-content">
                  <el-input
                    v-model="message"
                    type="textarea"
                    placeholder="输入消息..."
                    maxlength="2000"
                    resize="none"
                    @keydown.enter="handleEnterKey"
                  />
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
      <el-drawer
        v-model="drawer"
        title="更多选项"
        modal-penetrable
        :width="300"
        @close="onDrawerClose"
      >
        <div class="drawer-content">
          <div class="session-users-section">
            <div class="section-title">群成员</div>
            <div class="users-grid">
              <div v-for="(user, index) in displayedUsers" :key="user.id" class="user-item">
                <el-avatar
                  shape="square"
                  :size="40"
                  :src="user.avatar"
                  @error="handleAvatarError"
                />
                <div class="user-name">{{ getUserDisplayName(user) }}</div>
              </div>
              <div v-if="shouldShowAddButton" class="user-item add-member-item" @click="addMember">
                <div class="add-avatar">
                  <span class="icon iconfont icon-add"></span>
                </div>
                <div class="user-name">添加</div>
              </div>
            </div>
          </div>
          <div v-if="isGroupChat" class="group-info-section">
            <!-- 群聊名称 -->
            <div class="info-item">
              <span class="label">群聊名称:</span>
              <div
                class="editable-value"
                @mouseover="showEditIcon('groupName')"
                @mouseleave="hideEditIcon('groupName')"
              >
                <input
                  v-if="editingField === 'groupName'"
                  ref="groupNameInput"
                  v-model="groupEditForm.name"
                  class="edit-input"
                  @blur="saveGroupName"
                  @keyup.enter="saveGroupName"
                />
                <span v-else class="value">{{
                  contactStore.selectedContact?.group?.name || '未知群聊'
                }}</span>
                <el-icon
                  v-if="
                    isGroupOwnerOrAdmin &&
                    showEditIconFlags.groupName &&
                    editingField !== 'groupName'
                  "
                  class="edit-icon"
                  @click="startEditGroupName"
                >
                  <EditPen />
                </el-icon>
              </div>
            </div>

            <!-- 群公告 -->
            <div class="info-item">
              <span class="label">群公告:</span>
              <span class="value">{{
                contactStore.selectedContact?.group?.announcement || '暂无公告'
              }}</span>
            </div>

            <!-- 备注 -->
            <div class="info-item">
              <span class="label">备注:</span>
              <span class="value">{{ contactStore.selectedContact?.remark || '暂无备注' }}</span>
            </div>

            <!-- 我在本群的昵称 -->
            <div class="info-item">
              <span class="label">我在本群的昵称:</span>
              <span class="value">{{ contactStore.selectedContact?.nickname || '未设置' }}</span>
            </div>
          </div>

          <!-- 查找聊天内容 -->
          <div class="drawer-item" @click="searchMessages">
            <span>查找聊天内容</span>
          </div>

          <!-- 消息免打扰 -->
          <div class="drawer-item">
            <span>消息免打扰</span>
            <el-switch v-model="muteNotifications" />
          </div>

          <!-- 置顶聊天 -->
          <div class="drawer-item">
            <span>置顶聊天</span>
            <el-switch v-model="pinChat" />
          </div>

          <div class="drawer-item">
            <span>显示成员名称</span>
            <el-switch v-model="muteNotifications" />
          </div>

          <!--清空聊天记录-->
          <div class="drawer-item danger-item" @click="clearChatHistory">
            <span class="icon iconfont icon-delete"></span>
            <span>清空聊天记录</span>
          </div>

          <!--退出群聊-->
          <div v-if="isGroupChat" class="drawer-item danger-item" @click="leaveGroup">
            <span class="icon iconfont icon-exit"></span>
            <span>退出群聊</span>
          </div>
        </div>
      </el-drawer>
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
import { ref, nextTick, watch, computed, onMounted, onUnmounted } from 'vue'
import { sendMessage, getMessages } from '@/api/chat'

const route = useRoute()
const contactStore = userContactStore()
const userStore = useUserStore()

const drawer = ref(false)

// 在组件外定义消息监听器，确保不会因为组件重新渲染而丢失
let isMessageListenerAdded = false

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
      const newMessages = response.data.data.messages.map((msg) => ({
        id: msg.id,
        type: 'message',
        senderId: msg.senderId,
        senderName: msg.sender?.username || '未知用户',
        senderAvatar: msg.sender?.avatar,
        content: msg.content,
        timestamp: msg.timestamp
      }))

      // 添加一条测试文件消息（仅用于演示）
      newMessages.push({
        id: 'fake-file-1',
        type: 'file',
        senderId: userStore.userId,
        senderName: userStore.username,
        senderAvatar: userStore.avatar,
        content: 'example.pdf', // 文件名
        size: '2.1 MB', // 文件大小
        timestamp: new Date().toISOString()
      })

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

const addMessageListener = () => {
  if (!isMessageListenerAdded) {
    console.log('添加消息监听器')
    window.api.onNewMessage((data) => {
      console.log('getuserMessage:', data)

      if (contactStore.selectedContact && data.data.sessionId === contactStore.selectedContact.id) {
        // 将新消息添加到消息列表
        const newMessage = {
          id: data.data.id || Date.now(), // 如果没有id则使用时间戳
          type: 'message',
          senderId: data.data.sender.id, // 从sender对象中获取senderId
          senderName: data.data.sender?.username || '未知用户',
          senderAvatar: data.data.sender?.avatar || '',
          content: data.data.content,
          timestamp: data.data.timestamp || new Date().toISOString()
        }

        messages.value.push(newMessage)

        // 只有在滚动条接近底部时才自动滚动
        nextTick(() => {
          if (messagesContainer.value) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
            // 如果用户接近底部（距离底部小于50像素），则自动滚动
            if (scrollTop + clientHeight >= scrollHeight - 50) {
              messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
            }
          }
        })
      }
    })
    isMessageListenerAdded = true
  }
}

// 监听选中会话的变化并打印信息
watch(
  () => contactStore.selectedContact,
  async (newSession) => {
    if (newSession) {
      console.log('ChatContant中获取到的会话信息:', newSession)
      console.log('会话ID:', newSession.id)
      console.log('会话名称:', newSession.name)
      console.log('会话类型:', newSession.sessionType)
      console.log('会话头像:', newSession.avatar)
      console.log('未读消息数:', newSession.unreadCount)
      console.log('更新时间:', newSession.updatedAt)

      // 当选中会话变化时，获取该会话的消息
      await loadMessages(newSession.id).then(() => {
        // 在消息加载完成后，将滚动条重置到底部
        nextTick(() => {
          if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
          }
        })
      })

      // 标记会话中的消息为已读
      if (newSession.unreadCount > 0) {
        try {
          await markAsRead(newSession.id)
          console.log('会话消息已标记为已读')

          // 更新本地会话的未读计数
          contactStore.setSelectedContact({
            ...newSession,
            unreadCount: 0
          })
        } catch (error) {
          console.error('标记消息为已读失败:', error)
        }
      }
    }
  },
  { immediate: true }
)

console.log(route.params.id) // 当前会话ID

onMounted(() => {
  console.log('ChatContant组件已挂载')
  // 组件挂载后添加消息监听器
  addMessageListener()
})

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

const isGroupChat = computed(() => {
  const session = contactStore.selectedContact
  return session && session.sessionType === 'group'
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
      const currentUserSession = session.ChatSessionUsers.find(
        (user) => user.userId === userStore.userId
      )
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

    // 创建本地消息对象（用于立即显示）
    const localMessage = {
      id: Date.now(), // 临时ID
      type: 'message',
      senderId: userStore.userId,
      senderName: userStore.username || '我',
      senderAvatar: userStore.avatar || '',
      content: message.value.trim(),
      timestamp: new Date().toISOString()
    }

    // 立即显示消息（优化用户体验）
    messages.value.push(localMessage)

    // 自动滚动到底部
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })

    try {
      // 构造消息对象
      const messageData = {
        sessionId: selectedContact.id,
        senderId: userStore.userId,
        messageType: 'text',
        content: message.value.trim()
      }

      // 如果是私聊
      if (selectedContact.sessionType === 'private') {
        messageData.receiverId = selectedContact.contactId
      }
      // 如果是群聊
      else if (selectedContact.sessionType === 'group') {
        messageData.groupId = selectedContact.groupId
      }

      // 通过WebSocket发送实时消息
      if (window.api && typeof window.api.sendMessage === 'function') {
        window.api.sendMessage({
          type: 'send_message',
          data: messageData
        })
      }

      // 通过HTTP API发送消息到后端（用于持久化存储）
      const response = await sendMessage(messageData)
      console.log('消息发送成功:', response)

      // 清空输入框
      message.value = ''
    } catch (error) {
      console.error('发送消息失败:', error)
      // 可以在这里添加错误处理，比如显示错误消息给用户
    }
  }
}

onUnmounted(() => {
  console.log('ChatContant组件将要卸载')
  // 移除WebSocket消息监听器
  if (window.api && typeof window.api.removeNewMessageListener === 'function') {
    console.log('移除WebSocket消息监听器')
    window.api.removeNewMessageListener()
    isMessageListenerAdded = false
  }
})
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

// 切换聊天状态
const toggleChat = () => {
  window.api.openChatMessageWindow()
  window.api.openChatMessageWindow(selectedContact)
}

const sessionUsers = computed(() => {
  const session = contactStore.selectedContact
  console.log('sessionaaaaaaaa: ', session.group.members)
  // 注意：目前前端的 ChatSession 类型定义中缺少 ChatSessionUsers 属性
  // 需要确认后端是否返回了这部分数据
  return session && session.group.members ? session.group.members : []
})

const displayedUsers = computed(() => {
  console.log('sessionUsers....', sessionUsers.value)
  // 最多显示15个成员
  return sessionUsers.value.slice(0, 15)
})

// 是否显示添加按钮
const shouldShowAddButton = computed(() => {
  const session = contactStore.selectedContact
  // 只有在群聊中才显示添加按钮
  return session && session.sessionType === 'group' && sessionUsers.value.length > 0
})

// 添加成员方法
const addMember = () => {
  console.log('添加成员')
  // 这里可以实现添加成员的逻辑
}

const getUserDisplayName = (userSession) => {
  // 根据会话用户信息获取显示名称
  // 针对 member 类型（群成员基本数据结构）
  if (userSession.name) {
    return userSession.name
  }

  // 针对 ChatSessionUser 类型（如果有 user 对象）
  if (userSession.user && userSession.user.username) {
    return userSession.user.username
  }

  // 针对 ChatSessionUser 类型（如果有 nickname）
  if (userSession.nickname) {
    return userSession.nickname
  }

  return '未知用户'
}

const handleAvatarError = () => {
  // 头像加载错误处理
  console.log('头像加载失败')
}

// 添加新的数据属性
const muteNotifications = ref(false)
const pinChat = ref(false)

// 添加新的方法
const searchMessages = () => {
  console.log('查找聊天内容')
  // 发送消息到主进程打开聊天消息窗口
  window.api.openChatMessageWindow()
  window.api.openChatMessageWindow(selectedContact)
}

// 添加响应式数据
const showEditIconFlags = ref({
  groupName: false,
  announcement: false
})

const editingField = ref('') // 当前正在编辑的字段
const groupEditForm = ref({
  name: '',
  announcement: ''
})

const groupNameInput = ref(null)

// 计算是否为群主或管理员
const isGroupOwnerOrAdmin = computed(() => {
  const session = contactStore.selectedContact
  if (!session || !session.group) return false

  const userId = userStore.userId
  const group = session.group

  // 检查是否为群主
  if (group.ownerId === userId) return true

  // 检查是否为管理员
  if (group.adminIds && group.adminIds.includes(userId)) return true

  return false
})

// 控制编辑图标显示的方法
const showEditIcon = (field) => {
  if (isGroupOwnerOrAdmin.value) {
    showEditIconFlags.value[field] = true
  }
}

const hideEditIcon = (field) => {
  showEditIconFlags.value[field] = false
}

// 开始编辑群名称
const startEditGroupName = () => {
  editingField.value = 'groupName'
  groupEditForm.value.name = contactStore.selectedContact?.group?.name || ''
  nextTick(() => {
    groupNameInput.value?.focus()
  })
}

// 保存群名称
const saveGroupName = () => {
  if (editingField.value === 'groupName') {
    // 这里可以调用API更新群名称
    console.log('新群名称:', groupEditForm.value.name)

    // 重置编辑状态
    editingField.value = ''

    // 显示成功消息
    ElMessage.success('群名称修改成功')
  }
}

// 添加清空聊天记录和退出群聊的方法
const clearChatHistory = () => {
  ElMessageBox.confirm('确定要清空聊天记录吗？此操作不可恢复！', '清空聊天记录', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      // 执行清空聊天记录的逻辑
      console.log('清空聊天记录')
      ElMessage.success('聊天记录已清空')
    })
    .catch(() => {
      // 用户取消操作
    })
}

const leaveGroup = () => {
  ElMessageBox.confirm('确定要退出群聊吗？', '退出群聊', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      // 执行退出群聊的逻辑
      console.log('退出群聊')
      ElMessage.success('已退出群聊')
    })
    .catch(() => {
      // 用户取消操作
    })
}

const emojiData = {
  recent: [], // 最近使用
  smileys: [
    // 笑脸与情感
    { id: 'smile', char: '😊', desc: '羞涩微笑' },
    { id: 'laughing', char: '😆', desc: '大笑' },
    { id: 'wink', char: '😉', desc: '眨眼' },
    { id: 'innocent', char: '😇', desc: '微笑天使' },
    { id: 'heart_eyes', char: '😍', desc: '花痴' },
    { id: 'kissing', char: '😗', desc: '亲亲' },
    { id: 'kissing_smiling_eyes', char: '😙', desc: '微笑亲亲' },
    { id: 'kissing_closed_eyes', char: '😚', desc: '闭眼亲亲' },
    { id: 'yum', char: '😋', desc: '好吃' },
    { id: 'stuck_out_tongue', char: '😛', desc: '吐舌' },
    { id: 'stuck_out_tongue_winking_eye', char: '😜', desc: '眨眼吐舌' },
    { id: 'money_mouth', char: '🤑', desc: '金钱嘴' },
    { id: 'hugging', char: '🤗', desc: '抱抱' },
    { id: 'sunglasses', char: '😎', desc: '酷' },
    { id: 'clown', char: '🤡', desc: '小丑脸' },
    { id: 'cowboy', char: '🤠', desc: '牛仔' },
    { id: 'imp', char: '👿', desc: '生气的恶魔' }
  ],
  gestures: [
    // 手势
    { id: 'wave', char: '👋', desc: '挥手' },
    { id: 'raised_back_of_hand', char: '🤚', desc: '立起的手背' },
    { id: 'raised_hand', char: '✋', desc: '举起手' },
    { id: 'vulcan_salute', char: '🖖', desc: '瓦肯举手礼' },
    { id: 'ok_hand', char: '👌', desc: 'ok' },
    { id: 'thumbs_down', char: '👎', desc: '拇指向下' },
    { id: 'middle_finger', char: '🖕', desc: '中指' },
    { id: 'victory', char: '✌️', desc: '胜利' },
    { id: 'crossed_fingers', char: '🤞', desc: '交叉手指' },
    { id: 'love_you_gesture', char: '🤟', desc: '爱你手势' },
    { id: 'metal', char: '🤘', desc: '摇滚' },
    { id: 'call_me', char: '🤙', desc: '打电话' },
    { id: 'point_left', char: '👈', desc: '指向左' },
    { id: 'point_right', char: '👉', desc: '指向右' },
    { id: 'point_up_2', char: '👆', desc: '指向上' },
    { id: 'middle_finger', char: '🖕', desc: '中指' },
    { id: 'point_down', char: '👇', desc: '指向下' },
    { id: 'point_up', char: '☝️', desc: '向上指' }
  ],
  animals: [
    // 动物与自然
    { id: 'dog', char: '🐶', desc: '狗' },
    { id: 'cat', char: '🐱', desc: '猫' },
    { id: 'monkey_face', char: '🐵', desc: '猴脸' },
    { id: 'see_no_evil', char: '🙈', desc: '非礼勿视' },
    { id: 'hear_no_evil', char: '🙉', desc: '非礼勿听' },
    { id: 'speak_no_evil', char: '🙊', desc: '非礼勿言' }
  ],
  emotions: [
    // 情感表达
    { id: 'confused', char: '😕', desc: '困扰' },
    { id: 'thinking', char: '🤔', desc: '思考' },
    { id: 'frowning_face', char: '☹️', desc: '不满' },
    { id: 'confounded', char: '😖', desc: '困惑' },
    { id: 'weary', char: '😩', desc: '累死了' },
    { id: 'pleading_face', char: '🥺', desc: '恳求' },
    { id: 'cry', char: '😢', desc: '哭' },
    { id: 'sob', char: '😭', desc: '大哭' },
    { id: 'triumph', char: '😤', desc: '傲慢' },
    { id: 'angry', char: '😠', desc: '生气' },
    { id: 'face_with_symbols_on_mouth', char: '🤬', desc: '嘴上有符号的脸' },
    { id: 'flushed', char: '😳', desc: '脸红' },
    { id: 'disappointed', char: '😞', desc: '失望' },
    { id: 'worried', char: '😟', desc: '担心' },
    { id: 'expressionless', char: '😑', desc: '面无表情' },
    { id: 'no_mouth', char: '😶', desc: '没有嘴' },
    { id: 'grimacing', char: '😬', desc: '龇牙咧嘴' },
    { id: 'rolling_eyes', char: '🙄', desc: '翻白眼' },
    { id: 'hushed', char: '😯', desc: '缄默' },
    { id: 'frowning', char: '😦', desc: '皱眉' },
    { id: 'anguished', char: '😧', desc: '痛苦' },
    { id: 'open_mouth', char: '😮', desc: '吃惊' },
    { id: 'sleeping', char: '😴', desc: '睡觉' },
    { id: 'drooling_face', char: '🤤', desc: '流口水' },
    { id: 'sleepy', char: '😪', desc: '困' },
    { id: 'dizzy_face', char: '😵', desc: '晕' },
    { id: 'zipper_mouth', char: '🤐', desc: '拉链嘴' },
    { id: 'nauseated_face', char: '🤢', desc: '恶心' },
    { id: 'sneezing_face', char: '🤧', desc: '打喷嚏' },
    { id: 'mask', char: '😷', desc: '戴口罩' },
    { id: 'face_with_thermometer', char: '🤒', desc: '发烧' },
    { id: 'face_with_head_bandage', char: '🤕', desc: '受伤' },
    { id: 'woozy_face', char: '🥴', desc: '眩晕' },
    { id: 'lying_face', char: '🤥', desc: '说谎' },
    { id: 'sunglasses', char: '😎', desc: '戴墨镜' },
    { id: 'star_struck', char: '🤩', desc: '星星眼' },
    { id: 'partying_face', char: '🥳', desc: '派对脸' },
    { id: 'shushing_face', char: '🤫', desc: '嘘' },
    { id: 'face_with_hand_over_mouth', char: '🤭', desc: '捂嘴' },
    { id: 'face_vomiting', char: '🤮', desc: '呕吐' },
    { id: 'exploding_head', char: '🤯', desc: '爆炸头' },
    { id: 'hot_face', char: '🥵', desc: '脸发烧' },
    { id: 'cold_face', char: '🥶', desc: '冷脸' },
    { id: 'zany_face', char: '🤪', desc: '搞怪' },
    { id: 'money_mouth_face', char: '🤑', desc: '钱嘴' },
    { id: 'smiling_imp', char: '😈', desc: '恶魔微笑' },
    { id: 'imp', char: '👿', desc: '愤怒的小鬼' },
    { id: 'skull', char: '💀', desc: '头骨' },
    { id: 'skull_and_crossbones', char: '☠️', desc: '骷髅' },
    { id: 'hankey', char: '💩', desc: '大便' }
  ]
}

// 搜索关键词
const searchQuery = ref('')

// 过滤表情
const filteredEmojiData = computed(() => {
  if (!searchQuery.value) return emojiData

  const result = {}
  Object.keys(emojiData).forEach((categoryName) => {
    result[categoryName] = emojiData[categoryName].filter(
      (emoji) => emoji.desc.includes(searchQuery.value) || emoji.char.includes(searchQuery.value)
    )
  })
  return result
})

// 快捷按钮配置
const shortcuts = [
  { name: '笑脸', category: 'smileys', icon: '😊' },
  { name: '手势', category: 'gestures', icon: '👋' },
  { name: '动物', category: 'animals', icon: '🐶' },
  { name: '情感', category: 'emotions', icon: '😢' }
]

// 显示指定分类
const showCategory = (categoryName) => {
  // 可以在这里滚动到对应分类
  console.log('切换到:', categoryName)
}

const insertEmoji = (char) => {
  const inputElement = document.querySelector('.el-textarea__inner')
  if (inputElement) {
    const startPos = inputElement.selectionStart
    const endPos = inputElement.selectionEnd
    const beforeText = message.value.substring(0, startPos)
    const afterText = message.value.substring(endPos)

    // 在光标位置插入emoji
    message.value = beforeText + char + afterText

    // 更新光标位置到插入的emoji之后
    nextTick(() => {
      inputElement.selectionStart = startPos + char.length
      inputElement.selectionEnd = startPos + char.length
      inputElement.focus()
    })
  } else {
    // 如果无法获取到输入框元素，直接在末尾添加
    message.value += char
    nextTick(() => {
      const textarea = document.querySelector('.el-textarea__inner')
      if (textarea) {
        textarea.focus()
      }
    })
  }
}

const fileInput = ref(null)

// 触发文件选择
const triggerFileSelect = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

// 处理文件上传
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    console.log('选择的文件:', file)
    // 这里可以添加文件上传的逻辑
    // 例如显示预览、上传到服务器等
    uploadFile(file)
  }
  // 清空文件输入框，以便下次选择相同文件也能触发change事件
  event.target.value = ''
}

// 上传文件
const uploadFile = (file) => {
  console.log('准备上传文件:', file)

  // 临时提醒
  ElMessage.info(`选择了文件: ${file.name}`)
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

.chat-actions .el-button--text {
  width: 30px;
  height: 30px;
}

.chat-actions .el-button:hover {
  background: #e1e1e1;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.chat-actions .iconfont {
  font-size: 20px;
  color: #606266;
  opacity: 1;
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
  flex-direction: column-reverse;
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
  padding-left: 5px;
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
  padding-right: 5px;
}

.sent-message .box {
  width: 100%;
}

.sent-message .avatar {
  margin-left: 8px;
  border-radius: 3px;
  order: 2;
  min-width: 35px;
  min-height: 35px;
}

.sent-message .message-bubble {
  background-color: #a6e860;
  position: relative;
  float: right;
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

.group-info-section {
  margin-bottom: 10px;
  padding: 5px;
  border-bottom: 1px solid rgb(242, 242, 242);
}

.info-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-item .label {
  color: #606266;
  font-weight: 500;
  margin-bottom: 8px;
  font-size: 13px;
}

.info-item .value {
  color: rgb(158, 158, 158);
  word-break: break-word;
  font-size: 12px;
}

.edit-input {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
  width: 100%;
}

.edit-input:focus {
  border-color: #409eff;
}

.editable-value {
  position: relative;
  display: flex;
  align-items: center;
}

.editable-value {
  position: relative;
  display: flex;
  align-items: center;
}

.edit-icon {
  margin-left: 8px;
  color: #409eff;
  cursor: pointer;
  font-size: 14px;
}

.drawer-content {
  height: 100%;
}

.drawer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.drawer-item:hover {
  background-color: #f5f5f5;
}

.drawer-item .iconfont {
  font-size: 18px;
  color: #606266;
}

.drawer-item .el-switch {
  margin-left: auto;
  margin-right: 10px;
}

.session-users-section {
  padding-bottom: 20px;
  border-bottom: 1px solid rgb(242, 242, 242);
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.user-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-item .el-avatar {
  margin-bottom: 5px;
}

.user-name {
  font-size: 12px;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-member-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.add-avatar {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 5px;
}

.add-avatar .icon-add {
  font-size: 24px;
  color: #999;
}

.add-member-item:hover .add-avatar {
  background-color: #e0e0e0;
}

.add-member-item:hover .user-name {
  color: #409eff;
}

.drawer-item.danger-item {
  color: #f56c6c;
}

.drawer-item.danger-item:hover {
  background-color: #fef0f0;
}

.drawer-item.danger-item .iconfont {
  color: #f56c6c;
}

/* 弹窗整体样式 */
.emoji-popover {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background-color: white;
  width: 300px;
  /* 设置固定宽度 */
  max-width: 300px;
}

/* 表情容器 */
.emoji-container {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
}

/* 分类标题 */
.emoji-category h4 {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: normal;
}

/* 表情网格 */
.emoji-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

.emoji-item {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  transition: transform 0.2s ease;
  border-radius: 4px;
}

.emoji-item:hover {
  transform: scale(1.1);
  background-color: #f5f5f5;
}

/* 底部快捷栏 */
.emoji-footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  border-top: 1px solid #e0e0e0;
  background-color: #f9f9f9;
}

.emoji-search {
  display: flex;
  align-items: center;
  gap: 8px;
}

.emoji-shortcuts {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0;
}

.shortcut-item {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  border-radius: 4px;
  background-color: #f0f0f0;
  transition: all 0.2s ease;
}

.shortcut-item:hover {
  background-color: #e0e0e0;
  transform: scale(1.05);
}

/* 文件消息气泡 */
.file-message-bubble {
  background-color: white;
  border-radius: 7px;
  padding: 8px 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  word-wrap: break-word;
}

/* 文件容器 */
.file-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 文件图标 */
.file-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 16px;
  color: #606266;
}

/* 文件信息 */
.file-info {
  flex: 1;
}

.file-name {
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #999;
}
</style>
