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
              <div v-for="message in messages" :key="message.id" class="message-item">
                <!-- 时间戳 -->
                <div v-if="message.type === 'timestamp'" class="message-timestamp">
                  {{ formatDate(message.content) }}
                </div>

                <!-- 系统消息 -->
                <div v-else-if="message.type === 'system'" class="system-message">
                  {{ message.content }}
                </div>

                <!-- 图片消息 -->
                <div
                  v-else-if="message.type === 'image'"
                  :class="
                    message.senderId === userStore.userId ? 'sent-message' : 'received-message'
                  "
                >
                  <el-avatar shape="square" :size="35" :src="message.senderAvatar" class="avatar" />
                  <div class="box">
                    <div v-if="shouldShowSenderName(message)" class="message-sender">
                      {{ message.senderName }}
                    </div>
                    <!-- 移除消息气泡容器，直接显示图片 -->
                    <div
                      :class="
                        message.senderId === userStore.userId
                          ? 'sender-image-container'
                          : 'receive-image-container'
                      "
                    >
                      <img
                        :src="message.imageUrl"
                        :alt="message.fileName || '图片'"
                        class="image-preview"
                        @click="previewImage(message.imageUrl)"
                      />
                    </div>
                  </div>
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
                    <div
                      class="message-bubble file-message-bubble"
                      @click="handleFileDownload(message)"
                    >
                      <div class="file-container">
                        <div class="file-icon">
                          <img
                            :src="getFileIconPath(message.fileExtension)"
                            :alt="message.fileExtension + ' file icon'"
                            class="file-extension-icon"
                          />
                        </div>
                        <div class="file-info">
                          <div class="file-name">{{ message.content }}</div>
                          <div class="file-size">{{ message.size || '未知大小' }}</div>
                        </div>
                        <div class="file-extension-overlay">
                          {{ message.fileExtension }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!--视频消息-->
                <div
                  v-else-if="message.type === 'video'"
                  :class="
                    message.senderId === userStore.userId ? 'sent-message' : 'received-message'
                  "
                >
                  <el-avatar shape="square" :size="35" :src="message.senderAvatar" class="avatar" />
                  <div class="box">
                    <div v-if="shouldShowSenderName(message)" class="message-sender">
                      {{ message.senderName }}
                    </div>
                    <div class="message-bubble video-message-bubble">
                      <div class="video-container" @click="playVideo(message.mediaUrl)">
                        <img
                          v-if="message.thumbnailUrl"
                          :src="message.thumbnailUrl"
                          :alt="message.content"
                          class="video-thumbnail"
                        />
                        <div class="video-overlay">
                          <span class="icon iconfont icon-play"></span>
                        </div>
                        <!-- 添加视频时长显示 -->
                        <div
                          v-if="message.videoInfo && message.videoInfo.duration"
                          class="video-duration-overlay"
                        >
                          {{ formatDuration(message.videoInfo.duration) }}
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
                  <div
                    ref="messageInputRef"
                    class="rich-input"
                    contenteditable="true"
                    placeholder="输入消息..."
                    @keydown="handleInputKeydown"
                    @input="debouncedUpdateInputEmptyState"
                    @paste="handlePaste"
                  ></div>
                </div>

                <div class="input-actions">
                  <el-button type="primary" :disabled="isInputEmpty" @click="sendMessageHandler">
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
    <PreviewImage :image-url="previewImageUrl" :visible="isPreviewVisible" @close="closePreview" />
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { userContactStore } from '@/store/userContactStore'
import { useUserStore } from '@/store/userStore'
import { useUserSetStore } from '@/store/userSetStore'
import { Message } from '@element-plus/icons-vue'
import { ref, nextTick, watch, computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { sendMessage, getMessages } from '@/api/chat'
import { ElMessage, ElLoading } from 'element-plus'
import { uploadImage, uploadFile } from '@/api/upload'
import WindowControls from '@/components/WindowControls.vue'
import PreviewImage from '@/components/previewImage.vue'
import { uploadVideo } from '@/api/upload'

const route = useRoute()
const contactStore = userContactStore()
const userStore = useUserStore()
const userSetStore = useUserSetStore()

const drawer = ref(false)
const richInputObserver = ref(null)

// 图片预览相关
const isPreviewVisible = ref(false)
const previewImageUrl = ref('')

// 在组件外定义消息监听器，确保不会因为组件重新渲染而丢失
let isMessageListenerAdded = false

// 创建一个响应式变量来跟踪输入框是否为空
const isInputEmpty = ref(true)

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

// 更新 isInputEmpty 的值
const updateInputEmptyState = () => {
  if (!messageInputRef.value) {
    isInputEmpty.value = true
    return
  }

  // 获取输入框的文本内容
  const textContent = messageInputRef.value.innerText || messageInputRef.value.textContent || ''

  // 检查是否有图片元素
  const hasImages = messageInputRef.value.querySelectorAll('img').length > 0

  // 检查是否只有空白字符
  isInputEmpty.value = (!textContent || textContent.trim().length === 0) && !hasImages
}

// 初始化 MutationObserver
onMounted(() => {
  if (messageInputRef.value) {
    richInputObserver.value = new MutationObserver(() => {
      updateInputEmptyState()
    })

    richInputObserver.value.observe(messageInputRef.value, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    })

    // 初始状态检查
    updateInputEmptyState()
  }
})

const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 创建防抖版本的更新函数
const debouncedUpdateInputEmptyState = debounce(updateInputEmptyState, 100)

onMounted(() => {
  addMessageListener()
})

// 清理 MutationObserver
onBeforeUnmount(() => {
  if (richInputObserver.value) {
    richInputObserver.value.disconnect()
  }
})
// 加载消息数据（带分页）
const loadMessages = async (sessionId, page = 1, prepend = false) => {
  try {
    // 使用 window.api.getMessagesBySessionId 替代 getMessages API 调用
    const response = await window.api.getMessagesBySessionId(sessionId, page, 20)
    console.log('responseaw: ', response)
    if (response.success) {
      // 更新分页信息
      pagination.value = response.data.pagination

      // 将获取到的消息转换为组件所需格式
      const newMessages = response.data.messages.map((msg) => {
        const baseMessage = {
          id: msg.id,
          type: msg.messageType,
          senderId: msg.senderId,
          senderName: msg.senderName || '未知用户',
          senderAvatar: msg.senderAvatar,
          content: msg.content,
          createdAt: msg.createdAt,
          imageUrl: msg.mediaUrl,
          fileName: msg.fileName
        }

        // 如果是文件类型消息，添加文件扩展名属性
        if (msg.messageType === 'file') {
          return {
            ...baseMessage,
            fileExtension: msg.file_extension, // 从文件对象或直接从消息获取扩展名
            size: formatFileSize(msg.file_size) // 格式化文件大小
          }
        }

        // 如果是视频类型消息，添加视频相关信息
        if (msg.messageType === 'video') {
          return {
            ...baseMessage,
            mediaUrl: msg.mediaUrl,
            thumbnailUrl: msg.file_thumbnailUrl,
            size: formatFileSize(msg.file_size),
            fileExtension: msg.file_extension,
            videoInfo: msg.videoInfo ||
              msg.video || {
                duration: msg.videoInfo?.duration || msg.video?.duration,
                width: msg.videoInfo?.width || msg.video?.width,
                height: msg.videoInfo?.height || msg.video?.height
              }
          }
        }

        return baseMessage
      })

      console.log('newMessages: ', newMessages)

      if (prepend) {
        // 在顶部添加旧消息（加载历史消息）
        messages.value = [...messages.value, ...newMessages]
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
    window.api.onNewMessage(async (data) => {
      console.log('getuserMessage:', data)

      if (contactStore.selectedContact && data.data.sessionId === contactStore.selectedContact.id) {
        // 将新消息添加到消息列表头部（因为我们按时间倒序排列）
        const newMessage = {
          id: data.data.id || Date.now(), // 如果没有id则使用时间戳
          type: data.data.messageType || data.data.type || 'message', // 使用messageType或type作为消息类型
          senderId: data.data.sender?.id || data.data.senderId, // 从sender对象或直接获取senderId
          senderName: data.data.sender?.username || '未知用户',
          senderAvatar: data.data.sender?.avatar || '',
          content: data.data.content,
          createdAt: data.data.timestamp || data.data.createdAt || new Date().toISOString()
        }

        // 处理文件消息特有的属性
        if ((data.data.messageType || data.data.type) === 'file') {
          newMessage.fileExtension = data.data.fileExtension
          newMessage.size = data.data.fileSize ? formatFileSize(data.data.fileSize) : '未知大小'
          newMessage.fileName = data.data.fileName
        }

        // 处理图片消息
        if ((data.data.messageType || data.data.type) === 'image') {
          newMessage.imageUrl = data.data.mediaUrl || data.data.imageUrl
          newMessage.fileName = data.data.fileName
        }

        // 处理视频消息
        if ((data.data.messageType || data.data.type) === 'video') {
          newMessage.mediaUrl = data.data.mediaUrl
          newMessage.thumbnailUrl = data.data.thumbnailUrl
          newMessage.fileName = data.data.fileName
          newMessage.size = data.data.fileSize ? formatFileSize(data.data.fileSize) : '未知大小'
          newMessage.fileExtension = data.data.fileExtension
          newMessage.videoInfo = data.data.videoInfo || {
            duration: data.data.duration,
            width: data.data.width,
            height: data.data.height
          }
        }

        // 将新消息添加到消息列表头部（因为我们按时间倒序排列）
        messages.value.unshift(newMessage)

        // 保存消息到本地数据库
        try {
          console.log('保存消息到本地数据库 ')
          if (window.api && typeof window.api.addUnifiedMessage === 'function') {
            const messageData = {
              id: data.data.id,
              sessionId: data.data.sessionId,
              senderId: data.data.sender?.id || data.data.senderId,
              receiverId: data.data.receiverId,
              groupId: data.data.groupId,
              content: data.data.content,
              messageType: data.data.messageType || data.data.type,
              mediaUrl: data.data.mediaUrl || data.data.imageUrl,
              fileName: data.data.fileName,
              fileSize: data.data.fileSize,
              fileExtension: data.data.fileExtension,
              mimeType: data.data.mimeType,
              isRecalled: false,
              isDeleted: false,
              status: 'RECEIVED',
              readStatus: true,
              createdAt: data.data.timestamp || data.data.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              videoInfo: data.data.videoInfo
            }

            const result = await window.api.addUnifiedMessage(messageData)
            console.log('消息保存到本地数据库result: ', result)
            if (result.success) {
              console.log('消息已保存到本地数据库:', result.data)
            } else {
              console.error('保存消息到本地数据库失败:', result.error)
            }
          }
        } catch (error) {
          console.error('调用addUnifiedMessage时发生错误:', error)
        }

        // 保存当前滚动位置
        const container = messagesContainer.value
        const previousScrollTop = container ? container.scrollTop : 0

        // 在DOM更新后处理滚动
        nextTick(() => {
          if (container) {
            // 如果用户原来就在顶部附近，保持滚动位置不变（这样会自动显示新消息）
            // 如果用户在其他位置浏览历史消息，则保持当前位置
            if (Math.abs(previousScrollTop) <= 50) {
              // 用户在顶部附近，滚动到顶部以显示新消息
              container.scrollTop = 0
            } else {
              // 用户在浏览历史消息，保持当前位置
              // 由于添加了新消息，需要调整滚动位置以保持视觉稳定
              const newScrollHeight = container.scrollHeight
              const oldScrollHeight = newScrollHeight - (messages.value[0]?.elementHeight || 0)
              const scrollOffset = newScrollHeight - oldScrollHeight
              container.scrollTop = previousScrollTop - scrollOffset
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

  if (!container) {
    console.log('没有容器元素，返回')
    return
  }

  if (loadingMore.value) {
    console.log('正在加载更多，返回')
    return
  }

  const scrollTop = Math.abs(container.scrollTop)
  const scrollHeight = container.scrollHeight
  const clientHeight = container.clientHeight
  const threshold = 5 // 距离底部5像素时触发加载

  // 当接近底部时加载更多历史消息
  if (scrollTop + clientHeight >= scrollHeight - threshold) {
    // 检查是否有下一页（更旧的历史消息）
    if (pagination.value && pagination.value.hasNextPage) {
      console.log('有下一页数据，加载更多历史消息')
      loadMoreMessages()
    } else {
      console.log('没有更多历史消息可加载')
    }
  }
}

// 加载更多消息（向上翻页）
const loadMoreMessages = async () => {
  if (loadingMore.value || !pagination.value.hasNextPage) return

  loadingMore.value = true
  const sessionId = contactStore.selectedContact?.id
  if (sessionId) {
    console.log('awdawdwa')
    await loadMessages(sessionId, pagination.value.currentPage + 1, true)
  }
  loadingMore.value = false
}

const messageInputRef = ref(null)

// 修改发送消息的方法，从富文本输入框获取内容
const getMessageContent = () => {
  if (!messageInputRef.value) return ''

  // 获取纯文本内容，排除图片等元素
  let textContent = ''
  const childNodes = messageInputRef.value.childNodes

  for (const node of childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      textContent += node.textContent
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'IMG') {
      textContent += node.textContent || node.innerText
    }
    // 忽略 IMG 元素（图片）
  }

  return textContent
}

// 获取富文本输入框中的内容（包括图片）
const getOrderedRichContent = () => {
  if (!messageInputRef.value) return []

  const contentItems = []
  const childNodes = messageInputRef.value.childNodes

  for (const node of childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      // 处理文本节点，按行分割
      const textParts = node.textContent.split('\n')
      for (let i = 0; i < textParts.length; i++) {
        if (textParts[i].trim() !== '') {
          contentItems.push({
            type: 'text',
            content: textParts[i]
          })
        }
        // 如果不是最后一部分，添加换行符
        if (i < textParts.length - 1) {
          contentItems.push({
            type: 'text',
            content: '\n'
          })
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'IMG' && node.hasAttribute('data-input-image')) {
        // 处理图片节点，只处理输入框中的图片
        contentItems.push({
          type: 'image',
          imageUrl: node.src,
          fileName: node.src.split('/').pop()
        })
      } else {
        // 处理其他元素节点中的文本
        const text = node.textContent || node.innerText
        if (text.trim() !== '') {
          contentItems.push({
            type: 'text',
            content: text
          })
        }
      }
    }
  }

  // 合并相邻的文本节点
  const mergedContentItems = []
  let currentTextItem = null

  for (const item of contentItems) {
    if (item.type === 'text') {
      if (currentTextItem) {
        // 合并到当前文本项
        currentTextItem.content += item.content
      } else {
        // 开始一个新的文本项
        currentTextItem = { ...item }
      }
    } else {
      // 遇到非文本项，先保存当前文本项（如果存在）
      if (currentTextItem) {
        // 只有当文本不为空时才添加
        if (currentTextItem.content.trim() !== '' || currentTextItem.content === '\n') {
          mergedContentItems.push(currentTextItem)
        }
        currentTextItem = null
      }
      // 添加非文本项
      mergedContentItems.push(item)
    }
  }

  // 添加最后一个文本项（如果存在）
  if (currentTextItem) {
    if (currentTextItem.content.trim() !== '' || currentTextItem.content === '\n') {
      mergedContentItems.push(currentTextItem)
    }
  }

  return mergedContentItems
}
// 发送消息
const sendMessageHandler = async () => {
  const orderedContent = getOrderedRichContent()

  // 如果内容为空或者没有选中联系人，则不发送消息
  if (orderedContent.length === 0 || !contactStore.selectedContact) {
    return
  }

  const selectedContact = contactStore.selectedContact

  // 检查是否需要添加时间戳
  const currentTime = new Date()
  let shouldAddTimestamp = false

  // 查找最后一条普通消息的时间
  for (let i = messages.value.length - 1; i >= 0; i--) {
    const lastMessage = messages.value[i]
    if (lastMessage.type === 'message') {
      const lastMessageTime = new Date(lastMessage.createdAt)
      const timeDiff = (currentTime - lastMessageTime) / (1000 * 60) // 转换为分钟
      if (timeDiff > 10) {
        shouldAddTimestamp = true
      }
      break
    }
  }

  // 如果是第一条消息也添加时间戳
  if (messages.value.length === 0) {
    shouldAddTimestamp = true
  }

  // 添加时间戳消息
  if (shouldAddTimestamp) {
    const timestampMessage = {
      id: 'timestamp-' + Date.now(),
      type: 'timestamp',
      content: currentTime.toISOString()
    }

    try {
      const timeData = {
        sessionId: selectedContact.id,
        senderId: userStore.userId,
        messageType: 'timestamp',
        content: currentTime.toISOString()
      }

      if (selectedContact.sessionType === 'private') {
        timeData.receiverId = selectedContact.contactId
      }
      // 如果是群聊
      else if (selectedContact.sessionType === 'group') {
        timeData.groupId = selectedContact.group?.id
      }

      if (window.api && typeof window.api.sendMessage === 'function') {
        window.api.sendMessage({
          type: 'send_message',
          data: timeData
        })
      }

      // 通过HTTP API发送消息到后端（用于持久化存储）
      const response1 = await sendMessage(timeData)
      console.log('消息发送成功:', response1)
    } catch (error) {
      console.error('发送消息失败:', error)
      // 可以在这里添加错误处理，比如显示错误消息给用户
    }
    messages.value.unshift(timestampMessage)
  }

  // 按顺序发送消息项
  for (const item of orderedContent) {
    console.log('item.name: ', item.fileName)
    if (item.type === 'image') {
      // 处理图片消息
      // 创建本地图片消息对象（用于立即显示）
      const localImageMessage = {
        id: Date.now() + Math.random(), // 临时ID
        type: 'image',
        senderId: userStore.userId,
        senderName: userStore.username || '我',
        senderAvatar: userStore.avatar || '',
        imageUrl: item.imageUrl,
        fileName: item.fileName,
        createdAt: new Date().toISOString()
      }

      // 立即显示图片消息（优化用户体验）
      messages.value.unshift(localImageMessage)

      try {
        // 构造图片消息对象
        const imageMessageData = {
          sessionId: selectedContact.id,
          senderId: userStore.userId,
          messageType: 'image',
          contant: `[图片]:${item.fileName}`,
          mediaUrl: item.imageUrl
        }

        // 如果是私聊
        if (selectedContact.sessionType === 'private') {
          imageMessageData.receiverId = selectedContact.contactId
        }
        // 如果是群聊
        else if (selectedContact.sessionType === 'group') {
          imageMessageData.groupId = selectedContact.group?.id
        }

        // 通过WebSocket发送实时消息
        if (window.api && typeof window.api.sendMessage === 'function') {
          window.api.sendMessage({
            type: 'send_message',
            data: imageMessageData
          })
        }

        // 通过HTTP API发送消息到后端（用于持久化存储）
        const response = await sendMessage(imageMessageData)
        console.log('图片消息发送成功:', response)

        // 保存消息到本地数据库
        try {
          if (window.api && typeof window.api.addUnifiedMessage === 'function') {
            const messageSaveData = {
              id: response.data.messageId,
              sessionId: selectedContact.id,
              senderId: userStore.userId,
              senderName: userStore.username || '我',
              senderAvatar: userStore.avatar || '',
              receiverId:
                selectedContact.sessionType === 'private' ? selectedContact.contactId : null,
              groupId: selectedContact.sessionType === 'group' ? selectedContact.group?.id : null,
              content: response.data.content,
              messageType: 'image',
              mediaUrl: item.imageUrl,
              fileName: item.fileName,
              status: 'SENT',
              readStatus: true,
              createdAt: response.data.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }

            const result = await window.api.addUnifiedMessage(messageSaveData)
            if (result.success) {
              console.log('图片消息已保存到本地数据库:', result.data)
            } else {
              console.error('保存图片消息到本地数据库失败:', result.error)
            }
          }
        } catch (error) {
          console.error('调用addUnifiedMessage时发生错误:', error)
        }

        // 发送自定义事件更新ChatList中的lastMessage
        const lastMessageData = {
          sessionId: selectedContact.id,
          lastMessage: {
            content: `[图片]`,
            messageType: 'image',
            fileName: item.fileName,
            senderName: userStore.username || '我',
            isRecalled: false,
            isDeleted: false
          },
          timestamp: new Date().toISOString()
        }
        console.log('lastMessageData: ', lastMessageData)
        window.dispatchEvent(new CustomEvent('newMessageSent', { detail: lastMessageData }))
      } catch (error) {
        console.error('发送图片消息失败:', error)
        // 可以在这里添加错误处理，比如显示错误消息给用户
      }
    } else if (item.type === 'text' && (item.content.trim() !== '' || item.content === '\n')) {
      // 处理文本消息
      // 创建本地消息对象（用于立即显示）
      const localMessage = {
        id: Date.now() + Math.random(), // 临时ID
        type: 'text',
        senderId: userStore.userId,
        senderName: userStore.username || '我',
        senderAvatar: userStore.avatar || '',
        content: item.content
      }

      // 立即显示消息（优化用户体验）
      messages.value.unshift(localMessage)

      try {
        // 构造消息对象
        const messageData = {
          sessionId: selectedContact.id,
          senderId: userStore.userId,
          messageType: 'text',
          content: item.content
        }

        // 如果是私聊
        if (selectedContact.sessionType === 'private') {
          messageData.receiverId = selectedContact.contactId
        }
        // 如果是群聊
        else if (selectedContact.sessionType === 'group') {
          messageData.groupId = selectedContact.group?.id
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
        console.log('文本消息发送成功:', response)

        // 保存消息到本地数据库
        try {
          if (window.api && typeof window.api.addUnifiedMessage === 'function') {
            const messageSaveData = {
              id: response.data.messageId,
              sessionId: selectedContact.id,
              senderId: userStore.userId,
              senderName: userStore.username || '我',
              senderAvatar: userStore.avatar || '',
              receiverId:
                selectedContact.sessionType === 'private' ? selectedContact.contactId : null,
              groupId: selectedContact.sessionType === 'group' ? selectedContact.group?.id : null,
              content: item.content,
              messageType: 'text',
              status: 'SENT',
              readStatus: true,
              createdAt: response.data.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }

            const result = await window.api.addUnifiedMessage(messageSaveData)
            if (result.success) {
              console.log('文本消息已保存到本地数据库:', result.data)
            } else {
              console.error('保存文本消息到本地数据库失败:', result.error)
            }
          }
        } catch (error) {
          console.error('调用addUnifiedMessage时发生错误:', error)
        }

        // 发送自定义事件更新ChatList中的lastMessage
        const lastMessageData = {
          sessionId: selectedContact.id,
          lastMessage: {
            content: item.content,
            messageType: 'text',
            isRecalled: false,
            isDeleted: false
          },
          timestamp: new Date().toISOString()
        }
        window.dispatchEvent(new CustomEvent('newMessageSent', { detail: lastMessageData }))
      } catch (error) {
        console.error('发送文本消息失败:', error)
        // 可以在这里添加错误处理，比如显示错误消息给用户
      }
    }
  }

  // 自动滚动到底部
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })

  // 清空输入框
  if (messageInputRef.value) {
    messageInputRef.value.innerHTML = ''
  }

  // 更新输入框状态
  updateInputEmptyState()
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
const handleInputKeydown = (event) => {
  // 如果按下的是 Ctrl+Enter 或 Shift+Enter，则换行
  if (event.key === 'Enter' && (event.ctrlKey || event.shiftKey)) {
    // 允许默认换行行为
    return
  } else if (event.key === 'Enter' && !event.ctrlKey && !event.shiftKey) {
    // 单独按 Enter 键发送消息
    event.preventDefault()

    // 获取输入框内容并检查是否为空
    const content = getMessageContent()
    if (content.trim()) {
      sendMessageHandler()
    }
  }
}

// 处理粘贴事件
const handlePaste = (event) => {
  event.preventDefault()
  const text = (event.clipboardData || window.clipboardData).getData('text')
  const selection = window.getSelection()
  if (selection.rangeCount) {
    const range = selection.getRangeAt(0)
    range.deleteContents()
    range.insertNode(document.createTextNode(text))
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  // 粘贴后更新状态
  setTimeout(() => {
    updateInputEmptyState()
  }, 0)
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
  if (!messageInputRef.value) return

  // 确保输入框获得焦点
  messageInputRef.value.focus()

  const selection = window.getSelection()

  // 检查选区是否在输入框内，如果不在则创建一个新的选区
  if (!messageInputRef.value.contains(selection.anchorNode)) {
    // 创建一个新的范围并将其设置在输入框的末尾
    const range = document.createRange()
    range.selectNodeContents(messageInputRef.value)
    range.collapse(false) // 将光标移到末尾

    selection.removeAllRanges()
    selection.addRange(range)
  }

  // 执行插入操作
  const range = selection.getRangeAt(0)
  range.deleteContents()
  range.insertNode(document.createTextNode(char))
  range.collapse(false)

  // 清除现有选区并应用新的选区
  selection.removeAllRanges()
  selection.addRange(range)

  // 插入表情后聚焦到输入框并更新状态
  nextTick(() => {
    messageInputRef.value?.focus()
    updateInputEmptyState()
  })
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
    uploadFiles(file)
  }
  // 清空文件输入框，以便下次选择相同文件也能触发change事件
  event.target.value = ''
}

// 上传文件
const uploadFiles = async (file) => {
  console.log('准备上传文件:', file)

  // 显示上传状态
  const loading = ElLoading.service({
    text: '正在下载文件...',
    background: 'rgba(0, 0, 0, 0.7)',
    fullscreen: true, // 确保这是全屏模式
    customClass: 'file-download-loading' // 添加自定义类名便于调试
  })

  // 获取文件扩展名并转换为小写
  const fileName = file.name.toLowerCase()
  const fileExtension = fileName.substring(fileName.lastIndexOf('.'))

  // 定义图片文件扩展名列表
  const imageExtensions = ['.jpg', '.jpeg', '.jpe', '.jfif', '.png', '.gif']

  // 定义视频文件扩展名列表
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv']

  // 判断是否为图片文件
  if (imageExtensions.includes(fileExtension)) {
    // 如果是图片文件，限制不能超过5MB
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      loading.close()
      ElMessage.error(
        `图片大小不能超过5MB，当前图片大小为 ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      )
      return
    }

    // 如果是图片文件
    try {
      const response = await uploadImage(file)
      loading.close()
      if (response.success) {
        ElMessage.success(`图片上传成功: ${file.name}`)
        console.log('图片上传成功，URL:', response.imageUrl)

        // 清除错误位置的图片（保险措施）
        const wrongImages = document.querySelectorAll(
          'img[data-input-image="true"]:not(.rich-input img)'
        )
        wrongImages.forEach((img) => img.remove())

        // 将图片插入到富文本输入框中
        // 解码URL中的特殊字符（包括中文）
        const decodedImageUrl = decodeURIComponent(response.imageUrl)
        insertImageToRichInput(decodedImageUrl)
      } else {
        ElMessage.error(`图片上传失败: ${response.error || '未知错误'}`)
      }
    } catch (error) {
      loading.close()
      console.error('图片上传异常:', error)
      ElMessage.error(`图片上传异常: ${error.message || '网络错误'}`)
    }
  }
  // 判断是否为视频文件
  else if (videoExtensions.includes(fileExtension)) {
    // 如果是视频文件，上传视频
    try {
      console.log('选择了视频文件:', file)
      const response = await uploadVideo(file, contactStore.selectedContact.id, file.name)
      loading.close()
      console.log('videoInfo: ', response)

      if (response.success) {
        ElMessage.success(`视频上传成功: ${file.name}`)
        console.log('视频上传成功，URL:', response.mediaUrl)

        // 视频上传成功后，构造视频消息并发送
        const selectedContact = contactStore.selectedContact

        // 创建本地视频消息对象（用于立即显示）
        const localVideoMessage = {
          id: Date.now() + Math.random(), // 临时ID
          type: 'video',
          senderId: userStore.userId,
          senderName: userStore.username || '我',
          senderAvatar: userStore.avatar || '',
          content: response.originalName, // 视频名
          mediaUrl: response.mediaUrl, // 视频URL
          thumbnailUrl: response.videoInfo?.thumbnailUrl, // 缩略图URL
          size: formatFileSize(response.fileSize), // 视频大小
          mimeType: response.mimeType, // MIME类型
          fileExtension: response.fileExtension, // 文件扩展名
          videoInfo: response.videoInfo, // 视频信息
          createdAt: new Date().toISOString()
        }

        // 立即显示视频消息（优化用户体验）
        messages.value.unshift(localVideoMessage)

        try {
          // 构造视频消息对象
          const videoMessageData = {
            sessionId: selectedContact.id,
            senderId: userStore.userId,
            messageType: 'video',
            content: response.originalName,
            mediaUrl: response.mediaUrl,
            thumbnailUrl: response.videoInfo?.thumbnailUrl,
            fileName: response.originalName,
            fileSize: response.fileSize,
            mimeType: response.mimeType,
            fileExtension: response.fileExtension,
            videoInfo: response.videoInfo
          }
          // 如果是私聊
          if (selectedContact.sessionType === 'private') {
            videoMessageData.receiverId = selectedContact.contactId
          }
          // 如果是群聊
          else if (selectedContact.sessionType === 'group') {
            videoMessageData.groupId = selectedContact.group?.id
          }

          // 通过WebSocket发送实时消息
          if (window.api && typeof window.api.sendMessage === 'function') {
            window.api.sendMessage({
              type: 'send_message',
              data: videoMessageData
            })
          }

          // 通过HTTP API发送消息到后端（用于持久化存储）
          const sendResponse = await sendMessage(videoMessageData)
          console.log('视频消息发送成功:', sendResponse)

          // 保存消息到本地数据库
          try {
            if (window.api && typeof window.api.addUnifiedMessage === 'function') {
              const messageSaveData = {
                id: sendResponse.data.messageId,
                sessionId: selectedContact.id,
                senderId: userStore.userId,
                senderName: userStore.username || '我',
                senderAvatar: userStore.avatar || '',
                receiverId:
                  selectedContact.sessionType === 'private' ? selectedContact.contactId : null,
                groupId: selectedContact.sessionType === 'group' ? selectedContact.group?.id : null,
                content: response.originalName,
                messageType: 'video',
                mediaUrl: response.mediaUrl,
                fileName: response.originalName,
                fileSize: response.fileSize,
                mimeType: response.mimeType,
                fileExtension: response.fileExtension,
                videoInfo: response.videoInfo,
                status: 'SENT',
                readStatus: true,
                createdAt: sendResponse.data.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }

              const result = await window.api.addUnifiedMessage(messageSaveData)
              if (result.success) {
                console.log('视频消息已保存到本地数据库:', result.data)
              } else {
                console.error('保存视频消息到本地数据库失败:', result.error)
              }
            }
          } catch (error) {
            console.error('调用addUnifiedMessage时发生错误:', error)
          }

          // 发送自定义事件更新ChatList中的lastMessage
          const lastMessageData = {
            sessionId: selectedContact.id,
            lastMessage: {
              content: `[视频]${response.originalName}`,
              messageType: 'video',
              fileName: response.originalName,
              fileSize: response.fileSize,
              senderName: userStore.username || '我',
              mediaUrl: response.mediaUrl,
              isRecalled: false,
              isDeleted: false
            },
            timestamp: new Date().toISOString()
          }
          window.dispatchEvent(new CustomEvent('newMessageSent', { detail: lastMessageData }))

          // 自动滚动到底部
          nextTick(() => {
            if (messagesContainer.value) {
              messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
            }
          })
        } catch (sendError) {
          console.error('发送视频消息失败:', sendError)
          ElMessage.error(`发送视频消息失败: ${sendError.message || '未知错误'}`)
        }
      } else {
        ElMessage.error(`视频上传失败: ${response.error || '未知错误'}`)
      }
    } catch (error) {
      loading.close()
      console.error('视频上传异常:', error)
      ElMessage.error(`视频上传异常: ${error.message || '网络错误'}`)
    }
  } else {
    // 如果是其他类型文件，限制不能超过1GB
    const maxSize = 1 * 1024 * 1024 * 1024 // 1GB in bytes
    if (file.size > maxSize) {
      loading.close()
      ElMessage.error(
        `文件大小不能超过1GB，当前文件大小为 ${(file.size / (1024 * 1024 * 1024)).toFixed(2)}GB`
      )
      return
    }

    // 如果是其他类型文件
    try {
      console.log('file: ', file)
      const response = await uploadFile({
        file,
        fileName: file.name,
        sessionId: contactStore.selectedContact.id,
        fileType: 'file'
      })
      loading.close()
      if (response.success) {
        ElMessage.success(`文件上传成功: ${file.name}`)
        console.log('文件上传成功，URL:', response.mediaUrl)

        // 文件上传成功后，构造文件消息并发送
        const selectedContact = contactStore.selectedContact

        // 创建本地文件消息对象（用于立即显示）
        const localFileMessage = {
          id: Date.now() + Math.random(), // 临时ID
          type: 'file',
          senderId: userStore.userId,
          senderName: userStore.username || '我',
          senderAvatar: userStore.avatar || '',
          content: response.originalName, // 文件名
          size: formatFileSize(response.fileSize), // 文件大小
          mimeType: response.mimeType, // MIME类型
          fileExtension: response.fileExtension, // 文件扩展名
          createdAt: new Date().toISOString()
        }

        // 立即显示文件消息（优化用户体验）
        messages.value.unshift(localFileMessage)

        try {
          // 构造文件消息对象
          const fileMessageData = {
            sessionId: selectedContact.id,
            senderId: userStore.userId,
            messageType: 'file',
            content: response.originalName,
            mediaUrl: response.mediaUrl,
            fileName: response.originalName,
            fileSize: response.fileSize,
            mimeType: response.mimeType,
            fileExtension: response.fileExtension
          }
          // 如果是私聊
          if (selectedContact.sessionType === 'private') {
            fileMessageData.receiverId = selectedContact.contactId
          }
          // 如果是群聊
          else if (selectedContact.sessionType === 'group') {
            fileMessageData.groupId = selectedContact.group?.id
          }

          // 通过WebSocket发送实时消息
          if (window.api && typeof window.api.sendMessage === 'function') {
            window.api.sendMessage({
              type: 'send_message',
              data: fileMessageData
            })
          }

          // 通过HTTP API发送消息到后端（用于持久化存储）
          const sendResponse = await sendMessage(fileMessageData)
          console.log('文件消息发送成功:', sendResponse)

          // 保存消息到本地数据库
          try {
            if (window.api && typeof window.api.addUnifiedMessage === 'function') {
              const messageSaveData = {
                id: sendResponse.data.messageId,
                sessionId: selectedContact.id,
                senderId: userStore.userId,
                senderName: userStore.username || '我',
                senderAvatar: userStore.avatar || '',
                receiverId:
                  selectedContact.sessionType === 'private' ? selectedContact.contactId : null,
                groupId: selectedContact.sessionType === 'group' ? selectedContact.group?.id : null,
                content: response.originalName,
                messageType: 'file',
                mediaUrl: response.mediaUrl,
                fileName: response.originalName,
                fileSize: response.fileSize,
                mimeType: response.mimeType,
                fileExtension: response.fileExtension,
                status: 'SENT',
                readStatus: true,
                createdAt: sendResponse.data.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }

              const result = await window.api.addUnifiedMessage(messageSaveData)
              if (result.success) {
                console.log('文件消息已保存到本地数据库:', result.data)
              } else {
                console.error('保存文件消息到本地数据库失败:', result.error)
              }
            }
          } catch (error) {
            console.error('调用addUnifiedMessage时发生错误:', error)
          }

          // 发送自定义事件更新ChatList中的lastMessage
          const lastMessageData = {
            sessionId: selectedContact.id,
            lastMessage: {
              content: `[文件]${response.originalName}`,
              messageType: 'file',
              fileName: response.originalName,
              fileSize: response.fileSize,
              senderName: userStore.username || '我',
              isRecalled: false,
              isDeleted: false
            },
            timestamp: new Date().toISOString()
          }
          window.dispatchEvent(new CustomEvent('newMessageSent', { detail: lastMessageData }))

          // 自动滚动到底部
          nextTick(() => {
            if (messagesContainer.value) {
              messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
            }
          })
        } catch (sendError) {
          console.error('发送文件消息失败:', sendError)
          ElMessage.error(`发送文件消息失败: ${sendError.message || '未知错误'}`)
        }
      } else {
        ElMessage.error(`文件上传失败: ${response.error || '未知错误'}`)
      }
    } catch (error) {
      loading.close()
      console.error('文件上传异常:', error)
      ElMessage.error(`文件上传异常: ${error.message || '网络错误'}`)
    }
  }
}

const getFileIconPath = (fileExtension) => {
  // 如果没有文件扩展名，使用默认的文件图标
  if (!fileExtension) {
    return new URL('@/assets/filetypeicon/unknown.png', import.meta.url).href
  }

  // 确保扩展名以点号开头并且是小写
  const normalizedExtension = fileExtension.startsWith('.')
    ? fileExtension.toLowerCase()
    : `.${fileExtension.toLowerCase()}`

  const newNormalizedExtension = normalizedExtension.split('.').join('')

  console.log('newNormalizedExtension: ', newNormalizedExtension)

  // 返回图标的路径
  return `${import.meta.env.BASE_URL}src/assets/filetypeicon/${newNormalizedExtension}.png`
}

// 在富文本输入框中插入图片
const insertImageToRichInput = (imageUrl) => {
  if (!messageInputRef.value) return

  // 确保我们操作的是正确的输入框元素
  const inputElement = messageInputRef.value
  if (!inputElement.classList.contains('rich-input')) {
    console.error('Rich input element not found or incorrect element targeted')
    return
  }

  const imgElement = document.createElement('img')
  imgElement.src = imageUrl
  imgElement.style.maxWidth = '100px'
  imgElement.style.maxHeight = '100px'
  imgElement.style.margin = '2px'
  imgElement.style.verticalAlign = 'bottom'
  imgElement.setAttribute('data-input-image', 'true')

  const selection = window.getSelection()
  if (selection.rangeCount) {
    const range = selection.getRangeAt(0)
    // 确保选区在正确的输入框内
    if (inputElement.contains(range.commonAncestorContainer)) {
      range.deleteContents()
      range.insertNode(imgElement)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
    } else {
      // 如果选区不在输入框内，则直接添加到输入框末尾
      inputElement.appendChild(imgElement)
    }
  } else {
    inputElement.appendChild(imgElement)
  }

  // 插入图片后聚焦到输入框并更新状态
  nextTick(() => {
    inputElement.focus()
    updateInputEmptyState()
  })
}

// 使用PreviewImage组件替换原来的previewImage函数
const previewImage = (imageUrl) => {
  previewImageUrl.value = imageUrl
  isPreviewVisible.value = true
}

const closePreview = () => {
  isPreviewVisible.value = false
  previewImageUrl.value = ''
}

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

// 添加格式化文件大小的函数
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleFileDownload = async (fileMessage) => {
  try {
    console.log('文件消息数据:', fileMessage) // 调试信息

    // 获取用户设置中的存储路径
    const storageLocation = userSetStore.StorageLocation || 'D:\\EasyChat\\files\\'

    // 验证文件URL
    let fileUrl = fileMessage.mediaUrl

    // 检查是否有多种可能的URL字段
    if (!fileUrl && fileMessage.imageUrl) {
      fileUrl = fileMessage.imageUrl
    }

    if (!fileUrl && fileMessage.url) {
      fileUrl = fileMessage.url
    }

    // 如果仍然没有有效的URL
    if (!fileUrl) {
      ElMessage.error('文件链接无效')
      console.error('无法找到有效的文件链接:', fileMessage)
      return
    }

    // 确保URL是完整的
    if (fileUrl.startsWith('//')) {
      fileUrl = 'http:' + fileUrl
    } else if (fileUrl.startsWith('/')) {
      // 如果是相对路径，尝试补全为完整URL
      fileUrl = window.location.origin + fileUrl
    }

    // 获取文件名
    let fileName = fileMessage.content || fileMessage.fileName
    if (!fileName) {
      // 尝试从URL中提取文件名
      try {
        const urlObj = new URL(fileUrl)
        const pathname = urlObj.pathname
        fileName = pathname.split('/').pop() || 'downloaded_file'
      } catch (urlError) {
        fileName = 'downloaded_file'
      }
    }

    // 显示正在下载提示
    const loading = ElLoading.service({
      text: '正在下载文件...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    try {
      // 通过IPC发送下载文件请求到主进程
      if (window.api && typeof window.api.downloadFile === 'function') {
        const result = await window.api.downloadFile(fileUrl, fileName, storageLocation)

        loading.close()

        if (result.success) {
          ElMessage.success(`文件已保存到: ${result.filePath}`)
        } else {
          ElMessage.error(`文件下载失败: ${result.error}`)

          // 如果是网络错误，提供备选方案
          if (
            result.error.includes('网络请求失败') ||
            result.error.includes('CONNECTION_REFUSED')
          ) {
            ElMessage.info('正在尝试浏览器下载...')
            // 尝试使用浏览器默认下载
            attemptBrowserDownload(fileUrl, fileName)
          }
        }
      } else {
        loading.close()
        // 如果没有downloadFile方法，则使用浏览器默认下载
        ElMessage.info('正在使用浏览器下载...')
        attemptBrowserDownload(fileUrl, fileName)
      }
    } catch (ipcError) {
      loading.close()
      console.error('IPC通信错误:', ipcError)
      ElMessage.error('下载服务暂时不可用，正在尝试浏览器下载...')
      // IPC通信失败时使用浏览器默认下载
      attemptBrowserDownload(fileUrl, fileName)
    }
  } catch (error) {
    console.error('文件下载出错:', error)
    ElMessage.error('文件下载出错: ' + (error.message || '未知错误'))
  }
}

/**
 * 尝试使用浏览器默认下载
 * @param url 文件URL
 * @param filename 文件名
 */
const attemptBrowserDownload = (url, filename) => {
  try {
    // 创建一个隐藏的链接元素来触发下载
    const link = document.createElement('a')
    link.style.display = 'none'
    link.href = url
    link.download = filename // 设置下载文件名
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('已启动浏览器下载')
  } catch (error) {
    console.error('浏览器下载失败:', error)
    try {
      // 备选方案：在新窗口中打开
      window.open(url, '_blank')
      ElMessage.info('已在新窗口中打开文件链接')
    } catch (openError) {
      console.error('打开新窗口也失败:', openError)
      ElMessage.error('无法下载文件，请检查网络连接或稍后再试')
    }
  }
}

const playVideo = (videoUrl) => {
  // 在新窗口中播放视频或者使用模态框播放
  window.open(videoUrl, '_blank')
}

const formatDuration = (seconds) => {
  if (!seconds) return ''

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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
  margin-bottom: 20px;
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
  width: calc(100% - 43px);
  /* 减去头像宽度和间距 */
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
  width: calc(100% - 43px);
  /* 减去头像宽度和间距 */
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

.rich-input {
  width: 100%;
  height: 100%;
  min-height: 80px;
  max-height: 150px;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background-color: rgb(237, 237, 237);
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  overflow-y: auto;
  box-sizing: border-box;
  word-wrap: break-word;
  word-break: break-word;
}

.rich-input:empty:before {
  content: attr(placeholder);
  color: #ccc;
  pointer-events: none;
}

.rich-input img {
  max-width: 100px;
  max-height: 100px;
  margin: 2px;
  vertical-align: bottom;
  border-radius: 4px;
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
  margin-right: 15px;
  margin-bottom: 15px;
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
  position: relative;
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
  text-overflow: elipsis;
  white-space: nowrap;
  max-width: 250px;
  min-width: 90px;
}

.file-size {
  font-size: 12px;
  color: #999;
}

.file-extension-overlay {
  position: absolute;
  bottom: 0;
  right: 0;
  color: rgb(8, 12, 246);
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 3px;
  text-transform: uppercase;
}

.image-message-bubble {
  background-color: white;
  border-radius: 7px;
  padding: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  max-width: 300px;
  word-wrap: break-word;
}

.sender-image-container {
  float: right;
  margin-left: 8px;
  margin-right: 8px;
}

.receive-image-container {
  float: left;
  margin-left: 8px;
  margin-right: 8px;
}

.image-preview {
  max-width: 200px;
  width: 100%;
  height: auto;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.image-preview:hover {
  transform: scale(1.02);
}

.image-name {
  font-size: 12px;
  color: #606266;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-extension-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

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

.video-message-bubble {
  background: transparent;
  padding: 0;
  box-shadow: none;
  border: none;
  max-width: 250px;
}

.video-container {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f0f0f0;
  border: 1px solid #e0e0e0;
  width: 100%;
  max-width: 250px;
  aspect-ratio: 16 / 9;
}

.video-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.video-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #f5f5f5;
}

.video-placeholder .icon-video {
  font-size: 32px;
  color: #666;
  margin-bottom: 8px;
}

.video-placeholder p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.video-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-overlay .icon-play {
  font-size: 20px;
  color: white;
}

.video-duration-overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  z-index: 2;
}

.video-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}
</style>
