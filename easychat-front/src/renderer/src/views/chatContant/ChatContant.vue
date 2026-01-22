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
                  @contextmenu.prevent="showMessageContextMenu($event, message)"
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
                  @contextmenu.prevent="showMessageContextMenu($event, message)"
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
                  @contextmenu.prevent="showMessageContextMenu($event, message)"
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
                  @contextmenu.prevent="showMessageContextMenu($event, message)"
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
                  <el-button @click="AudioCall">
                    <el-icon>
                      <Phone />
                    </el-icon>
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

      <!-- 使用新创建的 GroupDrawer 组件 -->
      <GroupDrawer
        :visible="drawer"
        :is-group-chat="isGroupChat"
        :group="contactStore.selectedContact?.group"
        :remark="contactStore.selectedContact?.remark"
        :nickname="contactStore.selectedContact?.nickname"
        :displayed-users="displayedUsers"
        :should-show-add-button="shouldShowAddButton"
        :is-group-owner-or-admin="isGroupOwnerOrAdmin"
        :is-pinned="contactStore.selectedContact?.isPinned"
        :session-id="contactStore.selectedContact?.id"
        @update:visible="drawer = $event"
        @search-messages="searchMessages"
        @clear-chat-history="clearChatHistory"
        @leave-group="leaveGroup"
        @update-group-name="handleUpdateGroupName"
        @update-announcement="handleUpdateAnnouncement"
        @update-remark="handleUpdateRemark"
        @update-nickname="handleUpdateNickname"
        @add-member="addMember"
        @send-system-message="handleSendSystemMessage"
        @update:pin-chat="handlePinChatChange"
      />
    </div>

    <!-- 添加聊天输入区域 -->
    <PreviewImage :image-url="previewImageUrl" :visible="isPreviewVisible" @close="closePreview" />

    <!-- 右键菜单 -->
    <div
      v-show="contextMenuVisible"
      class="context-menu"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
    >
      <div class="context-menu-item" @click="copyMessage">
        {{
          contextMenuMessage &&
          (contextMenuMessage.type === 'file' ||
            contextMenuMessage.type === 'video' ||
            contextMenuMessage.type === 'image')
            ? '复制下载链接'
            : '复制'
        }}
      </div>
      <div class="context-menu-item" @click="forwardMessage">转发</div>
      <div class="context-menu-item" @click="multiSelectMessage">多选</div>
      <div class="context-menu-item" @click="quoteMessage">引用</div>
      <div
        v-if="
          contextMenuMessage &&
          (contextMenuMessage.type === 'file' || contextMenuMessage.type === 'video')
        "
        class="context-menu-item"
        @click="downloadMessage"
      >
        下载
      </div>
      <div class="context-menu-item danger" @click="deleteMessage">删除</div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { userContactStore } from '@/store/userContactStore'
import { useUserStore } from '@/store/userStore'
import { useUserSetStore } from '@/store/userSetStore'
import { Message } from '@element-plus/icons-vue'
import { ref, nextTick, watch, computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { sendMessage, markAsRead } from '@/api/chat'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { uploadImage, uploadFile } from '@/api/upload'
import WindowControls from '@/components/WindowControls.vue'
import PreviewImage from '@/components/previewImage.vue'
import GroupDrawer from '@/components/GroupDrawer.vue'
import { uploadVideo } from '@/api/upload'
import { getSessions } from '@/api/chatSession'
import emojiData from '@/utils/emojiData'
import { formatDate } from '@/utils/formatDate'
import { formatFileSize } from '@/utils/formatFileSize'

const route = useRoute()
const contactStore = userContactStore()
const userStore = useUserStore()
const userSetStore = useUserSetStore()

const drawer = ref(false)
const richInputObserver = ref(null)

// 添加当前选中会话ID变量
const selectedSessionId = ref(null)

// 图片预览相关
const isPreviewVisible = ref(false)
const previewImageUrl = ref('')

// 右键菜单相关
const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuMessage = ref(null)

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

const showMessageContextMenu = (event, message) => {
  // 只对非时间戳和非系统消息显示右键菜单
  if (message.type !== 'timestamp' && message.type !== 'system') {
    event.preventDefault()

    // 记录当前消息
    contextMenuMessage.value = message

    // 设置菜单位置
    contextMenuX.value = event.clientX
    contextMenuY.value = event.clientY

    // 显示菜单
    contextMenuVisible.value = true

    // 监听页面点击事件以关闭菜单
    document.addEventListener('click', closeContextMenu)
  }
}

// 关闭右键菜单
const closeContextMenu = () => {
  contextMenuVisible.value = false
  document.removeEventListener('click', closeContextMenu)
}

// 复制消息
const copyMessage = () => {
  if (!contextMenuMessage.value) return
  console.log('contextMenuMessage: ', contextMenuMessage.value)

  let content = ''
  if (contextMenuMessage.value.type === 'text') {
    content = contextMenuMessage.value.content
  } else if (contextMenuMessage.value.type === 'image') {
    content = `[图片] ${contextMenuMessage.value.fileName || ''}`
  } else if (contextMenuMessage.value.type === 'file') {
    // 对于文件消息，复制其下载链接
    let fileUrl = contextMenuMessage.value.mediaUrl

    // 检查是否有多种可能的URL字段
    if (!fileUrl && contextMenuMessage.value.imageUrl) {
      fileUrl = contextMenuMessage.value.imageUrl
    }

    if (!fileUrl && contextMenuMessage.value.url) {
      fileUrl = contextMenuMessage.value.url
    }
    content = fileUrl
  } else if (contextMenuMessage.value.type === 'video') {
    // 对于视频消息，优先复制其下载链接
    content =
      contextMenuMessage.value.videoInfo.downloadUrl ||
      contextMenuMessage.value.mediaUrl ||
      contextMenuMessage.value.content
  } else {
    content = contextMenuMessage.value.content
  }

  navigator.clipboard
    .writeText(content)
    .then(() => {
      ElMessage.success('已复制到剪贴板')
    })
    .catch((err) => {
      console.error('复制失败:', err)
      ElMessage.error('复制失败')
    })

  closeContextMenu()
}

// 转发消息
const forwardMessage = () => {
  console.log('转发消息:', contextMenuMessage.value)
  ElMessage.info('转发功能待实现')
  closeContextMenu()
}

// 多选消息
const multiSelectMessage = () => {
  console.log('多选消息:', contextMenuMessage.value)
  ElMessage.info('多选功能待实现')
  closeContextMenu()
}

// 引用消息
const quoteMessage = () => {
  if (!contextMenuMessage.value) return

  // 获取当前输入框内容
  const currentContent = messageInputRef.value ? messageInputRef.value.innerText : ''

  // 创建引用文本
  const senderName = contextMenuMessage.value.senderName || '未知用户'
  const quoteText = `[引用] ${senderName}: ${contextMenuMessage.value.content}`

  // 将引用文本添加到输入框
  if (messageInputRef.value) {
    // 如果输入框为空，直接设置内容；否则在前面添加换行
    if (currentContent.trim() === '') {
      messageInputRef.value.innerText = quoteText
    } else {
      messageInputRef.value.innerText = quoteText + '\n' + currentContent
    }

    // 将焦点设置到输入框
    messageInputRef.value.focus()

    // 将光标移到输入框末尾
    const range = document.createRange()
    range.selectNodeContents(messageInputRef.value)
    range.collapse(false)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
  }

  ElMessage.info('已引用该消息')
  closeContextMenu()
}

// 删除消息
const deleteMessage = () => {
  console.log('删除消息:', contextMenuMessage.value)

  // 计算消息创建时间与当前时间的时间差（以分钟为单位）
  const messageCreateTime = new Date(contextMenuMessage.value.createdAt).getTime()
  const currentTime = new Date().getTime()
  const timeDiffInMinutes = (currentTime - messageCreateTime) / (1000 * 60)

  // 如果时间差超过2分钟，只删除本地数据库中的消息
  if (timeDiffInMinutes > 2) {
    ElMessageBox.confirm('消息发送已超过2分钟，只能删除本地记录，是否继续？', '删除消息', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          console.log('timeDiffInMinutes: ', timeDiffInMinutes)
          // 从本地消息列表中移除
          const index = messages.value.findIndex((msg) => msg.id === contextMenuMessage.value.id)
          if (index !== -1) {
            messages.value.splice(index, 1)
          }

          // 从数据库中删除消息
          await window.api.deleteUnifiedMessage(contextMenuMessage.value.id)

          ElMessage.success('本地消息已删除')
        } catch (error) {
          console.error('删除消息失败:', error)
          ElMessage.error('删除消息失败')

          // 如果删除失败，将消息重新添加到列表中
          if (index !== -1) {
            messages.value.splice(index, 0, contextMenuMessage.value)
          }
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }
  // 如果时间差不超过2分钟，执行完整删除流程（这里可以根据实际需求调整处理方式）
  else {
    ElMessageBox.confirm('确定要删除这条消息吗？', '删除消息', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          // 从本地消息列表中移除
          const index = messages.value.findIndex((msg) => msg.id === contextMenuMessage.value.id)
          if (index !== -1) {
            messages.value.splice(index, 1)
          }

          // 从数据库中删除消息
          await window.api.deleteUnifiedMessage(contextMenuMessage.value.id)

          ElMessage.success('消息已删除')
        } catch (error) {
          console.error('删除消息失败:', error)
          ElMessage.error('删除消息失败')

          // 如果删除失败，将消息重新添加到列表中
          if (index !== -1) {
            messages.value.splice(index, 0, contextMenuMessage.value)
          }
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  closeContextMenu()
}

//下载消息功能
const downloadMessage = () => {
  if (!contextMenuMessage.value) return

  // 检查是否为文件或视频类型
  if (contextMenuMessage.value.type !== 'file' && contextMenuMessage.value.type !== 'video') {
    ElMessage.warning('该类型消息不支持下载')
    return
  }

  // 调用选择下载路径并下载的函数
  selectDownloadPathAndDownload(contextMenuMessage.value)

  closeContextMenu()
}

// 选择下载路径并下载文件
const selectDownloadPathAndDownload = async (fileMessage) => {
  try {
    // 使用 IPC 调用主进程来打开文件选择对话框
    const result = await window.api.showSaveDialog({
      title: '选择保存位置',
      defaultPath: fileMessage.content || fileMessage.fileName || 'download',
      filters: [{ name: 'All Files', extensions: ['*'] }]
    })

    if (result.canceled) {
      // 用户取消了选择
      console.log('用户取消了下载')
      return
    }

    const selectedPath = result.filePath
    if (!selectedPath) {
      console.error('未选择有效的保存路径')
      ElMessage.error('未选择有效的保存路径')
      return
    }

    // 获取文件名
    let fileName = fileMessage.content || fileMessage.fileName
    if (!fileName) {
      // 尝试从URL中提取文件名
      try {
        const urlObj = new URL(fileMessage.mediaUrl || fileMessage.imageUrl)
        fileName = urlObj.pathname.split('/').pop() || 'downloaded_file'
      } catch (urlError) {
        fileName = 'downloaded_file'
      }
    }

    // 显示正在下载提示
    const loading = ElLoading.service({
      text: '正在下载文件...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    // 获取文件URL
    let fileUrl = fileMessage.mediaUrl
    if (!fileUrl && fileMessage.imageUrl) {
      fileUrl = fileMessage.imageUrl
    }

    if (!fileUrl && fileMessage.url) {
      fileUrl = fileMessage.url
    }

    if (!fileUrl) {
      loading.close()
      ElMessage.error('文件链接无效')
      console.error('无法找到有效的文件链接:', fileMessage)
      return
    }

    // 确保URL是完整的
    if (fileUrl.startsWith('//')) {
      fileUrl = 'http:' + fileUrl
    } else if (fileUrl.startsWith('/')) {
      fileUrl = window.location.origin + fileUrl
    }

    // 通过IPC发送下载文件请求到主进程，指定下载路径
    if (window.api && typeof window.api.downloadFileToPath === 'function') {
      const downloadResult = await window.api.downloadFileToPath(fileUrl, fileName, selectedPath)

      loading.close()

      if (downloadResult.success) {
        ElMessage.success(`文件已保存到: ${selectedPath}`)
      } else {
        ElMessage.error(`文件下载失败: ${downloadResult.error}`)
      }
    } else {
      // 如果没有downloadFileToPath方法，则使用原来的下载方式
      loading.close()
      ElMessage.info('正在使用默认下载路径...')
      handleFileDownload(fileMessage)
    }
  } catch (error) {
    console.error('下载过程中出错:', error)
    ElMessage.error('下载过程中出错: ' + (error.message || '未知错误'))
  }
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

  addDeleteMessageListener()

  // 添加对 contactStoreUpdated 事件的监听
  window.addEventListener('contactStoreUpdated', handleContactStoreUpdate)

  window.addEventListener('chatHistoryCleared', handleChatHistoryCleared)

  document.addEventListener('click', closeContextMenu)

  if (contactStore.selectedContact) {
    loadMessages(contactStore.selectedContact.id).then(() => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      })
    })
  }
})

// 清理 MutationObserver
onBeforeUnmount(() => {
  if (richInputObserver.value) {
    richInputObserver.value.disconnect()
  }
})

// 加载消息数据（带分页）
const loadMessages = async (sessionId, page = 1, prepend = false) => {
  console.log('sessionId: ', sessionId)
  console.log('page: ', page)
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
            fileExtension: msg.fileExtension || msg.file_extension, // 从消息对象或文件对象获取扩展名
            size: msg.fileSize ? formatFileSize(msg.fileSize) : '未知大小' // 使用正确的属性名
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

const handleGroupRenameMessage = (content) => {
  // 解析系统消息内容，提取新的群名称
  const regex = /.*? 修改群聊名称为 (.*)/
  const match = content.match(regex)
  if (match && match[1]) {
    const newGroupName = match[1]
    // 更新本地存储的群名称
    if (contactStore.selectedContact && contactStore.selectedContact.group) {
      contactStore.selectedContact.group.name = newGroupName
      // 更新会话名称
      contactStore.selectedContact.name = newGroupName
    }
  }
}

const handlePinChatChange = async (isPinned) => {
  console.log('isPinned: ', isPinned)
  const currentSession = contactStore.selectedContact
  if (!currentSession) return

  try {
    if (
      window.api &&
      typeof window.api.updateChatSessionUser === 'function' &&
      currentSession.userSessionId
    ) {
      await window.api.updateChatSessionUser(currentSession.userSessionId, {
        isPinned: isPinned
      })
    }

    // 更新本地会话的置顶状态
    const updatedSession = {
      ...currentSession,
      isPinned: isPinned
    }

    // 更新 contactStore 中的会话信息
    contactStore.setSelectedContact(updatedSession)

    // 更新 ChatList 中的会话列表
    // 触发全局事件，通知 ChatList 更新会话的置顶状态
    window.dispatchEvent(
      new CustomEvent('sessionPinnedChanged', {
        detail: {
          sessionId: currentSession.id,
          isPinned: isPinned
        }
      })
    )

    // 发送自定义事件更新ChatList中的lastMessage
    const lastMessageData = {
      sessionId: currentSession.id,
      lastMessage: {
        content: currentSession.lastMessage?.content,
        messageType: currentSession.lastMessage?.messageType,
        fileName: currentSession.lastMessage?.fileName,
        senderName: currentSession.lastMessage?.senderName,
        senderId: currentSession.lastMessage?.senderId,
        isRecalled: currentSession.lastMessage?.isRecalled,
        isDeleted: currentSession.lastMessage?.isDeleted
      },
      timestamp: currentSession.updatedAt
    }
    window.dispatchEvent(new CustomEvent('newMessageSent', { detail: lastMessageData }))
  } catch (error) {
    console.error('更新会话置顶状态失败:', error)
    ElMessage.error('更新会话置顶状态失败')

    // 如果更新失败，恢复之前的置顶状态
    // 这需要获取更新前的状态，可能需要在方法开始时保存
  }
}

const addMessageListener = () => {
  if (!isMessageListenerAdded) {
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
          newMessage.thumbnailUrl = data.data.thumbnailUrl || data.data.file_thumbnailUrl // 使用正确的缩略图字段
          newMessage.fileName = data.data.fileName
          newMessage.size = data.data.fileSize ? formatFileSize(data.data.fileSize) : '未知大小'
          newMessage.fileExtension = data.data.fileExtension
          newMessage.videoInfo = data.data.videoInfo || {
            duration: data.data.duration,
            width: data.data.width,
            height: data.data.height,
            thumbnailUrl: data.data.thumbnailUrl, // 包含视频缩略图信息
            downloadUrl: data.data.downloadUrl
          }
        }

        // 如果是系统消息，特殊处理
        if (newMessage.type === 'system') {
          // 检查是否是群名称修改消息
          if (newMessage.content.includes('修改群聊名称为')) {
            handleGroupRenameMessage(newMessage.content)
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

            // 添加缺失的 senderName 和 senderAvatar 属性
            messageData.senderName = data.data.sender?.username || '未知用户'
            messageData.senderAvatar = data.data.sender?.avatar || ''

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

// 添加删除消息监听器
const addDeleteMessageListener = () => {
  window.api.onDeleteMessage(async (data) => {
    console.log('收到删除消息:', data)
    // 从消息列表中移除被删除的消息
    if (data && data.messageId) {
      const index = messages.value.findIndex((msg) => msg.id === data.messageId)
      if (index !== -1) {
        messages.value.splice(index, 1)
        ElMessage.info('消息已被删除')
      }

      // 同时从本地数据库中删除消息
      if (window.api && typeof window.api.deleteUnifiedMessage === 'function') {
        try {
          const result = await window.api.deleteUnifiedMessage(data.messageId)
          if (result.success) {
            console.log('消息已从本地数据库删除:', data.messageId)
          } else {
            console.error('删除本地数据库中的消息失败:', result.error)
          }
        } catch (error) {
          console.error('删除本地数据库中的消息时发生错误:', error)
        }
      }
    }
  })
}

const handleSendSystemMessage = (data) => {
  sendSystemMessage(data.content, data.sessionId)
}

// 添加发送系统消息的函数
const sendSystemMessage = async (contents) => {
  const content = `${userStore.username || '我'} ${contents}`

  // 创建本地系统消息对象（用于立即显示）
  const localSystemMessage = {
    id: Date.now() + Math.random(), // 临时ID
    type: 'system',
    senderId: userStore.userId,
    senderName: userStore.username || '我',
    senderAvatar: userStore.avatar || '',
    content: `${content}`
  }

  console.log('localSystemMessage: ', localSystemMessage)

  // 立即显示系统消息（优化用户体验）
  messages.value.unshift(localSystemMessage)

  const sessionId = contactStore.selectedContact.id

  try {
    // 构造系统消息对象
    const messageData = {
      sessionId: sessionId,
      senderId: userStore.userId,
      messageType: 'system',
      content: content
    }

    console.log('messageData: ', messageData)

    // 确保 contactStore.selectedContact 存在并设置正确的接收方信息
    if (contactStore.selectedContact) {
      // 如果是私聊
      if (contactStore.selectedContact.sessionType === 'private') {
        messageData.receiverId = contactStore.selectedContact.contactId
      }
      // 如果是群聊
      else if (contactStore.selectedContact.sessionType === 'group') {
        messageData.groupId = contactStore.selectedContact.group?.id
      }
    } else {
      console.warn('没有选中的联系人，尝试从会话ID获取会话类型信息')
      // 如果没有选中的联系人，可能需要从其他途径获取会话类型信息
      // 这里可以尝试通过 sessionId 获取会话信息
      try {
        const sessionInfo = await window.api.getChatSessionById(sessionId)
        if (sessionInfo) {
          if (sessionInfo.sessionType === 'private') {
            messageData.receiverId = sessionInfo.contactId
          } else if (sessionInfo.sessionType === 'group') {
            messageData.groupId = sessionInfo.groupId
          }
        }
      } catch (sessionError) {
        console.error('获取会话信息失败:', sessionError)
      }
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
    console.log('系统消息发送成功:', response)

    // 保存消息到本地数据库
    try {
      if (window.api && typeof window.api.addUnifiedMessage === 'function') {
        const messageSaveData = {
          id: response.data.messageId,
          sessionId: sessionId,
          senderId: userStore.userId,
          senderName: userStore.username || '我',
          senderAvatar: userStore.avatar || '',
          receiverId:
            contactStore.selectedContact && contactStore.selectedContact.sessionType === 'private'
              ? contactStore.selectedContact.contactId
              : null,
          groupId:
            contactStore.selectedContact && contactStore.selectedContact.sessionType === 'group'
              ? contactStore.selectedContact.group?.id
              : null,
          content: content,
          messageType: 'system',
          status: 'SENT',
          readStatus: true,
          createdAt: response.data.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        const result = await window.api.addUnifiedMessage(messageSaveData)
        if (result.success) {
          console.log('系统消息已保存到本地数据库:', result.data)

          const localMessageIndex = messages.value.findIndex(
            (msg) => msg.id === localSystemMessage.id
          )
          if (localMessageIndex !== -1) {
            messages.value[localMessageIndex].id = response.data.messageId
          }
        } else {
          console.error('保存系统消息到本地数据库失败:', result.error)
        }
      }
    } catch (error) {
      console.error('调用addUnifiedMessage时发生错误:', error)
    }

    // 发送自定义事件更新ChatList中的lastMessage
    const lastMessageData = {
      sessionId: sessionId,
      lastMessage: {
        content: content,
        messageType: 'system',
        isRecalled: false,
        isDeleted: false
      },
      timestamp: new Date().toISOString()
    }
    window.dispatchEvent(new CustomEvent('newMessageSent', { detail: lastMessageData }))
  } catch (error) {
    console.error('发送系统消息失败:', error)
    // 从消息列表中移除本地消息，因为发送失败
    const index = messages.value.findIndex((msg) => msg.id === localSystemMessage.id)
    if (index !== -1) {
      messages.value.splice(index, 1)
    }

    // 可以在这里添加错误处理，比如显示错误消息给用户
    if (error.response) {
      // 服务器响应了错误状态码
      console.error('服务器错误:', error.response.status, error.response.data)
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络错误:', error.request)
    } else {
      // 其他错误
      console.error('请求错误:', error.message)
    }
  }

  // 自动滚动到底部
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 监听选中会话的变化并打印信息
// watch(
//   () => contactStore.selectedContact,
//   async (newSession) => {
//     if (newSession) {
//       // 检查是否是当前已选中的会话，避免重复加载
//       if (selectedSessionId.value === newSession.id) {
//         console.log('selectedSessionId.value: ', selectedSessionId.value)
//         console.log('newSession.id: ', newSession.id)
//         console.log('当前会话已选中，跳过重复加载')
//         return
//       }

//       // 更新当前选中的会话ID
//       selectedSessionId.value = newSession.id

//       // 当选中会话变化时，获取该会话的消息
//       await loadMessages(newSession.id).then(() => {
//         // 在消息加载完成后，将滚动条重置到底部
//         nextTick(() => {
//           if (messagesContainer.value) {
//             messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
//           }
//         })
//       })

//       // 标记会话中的消息为已读
//       if (newSession.unreadCount > 0) {
//         try {
//           await markAsRead(newSession.id)
//           console.log('会话消息已标记为已读')

//           // 更新本地会话的未读计数
//           contactStore.setSelectedContact({
//             ...newSession,
//             unreadCount: 0
//           })
//         } catch (error) {
//           console.error('标记消息为已读失败:', error)
//         }
//       }
//     }
//   },
//   { immediate: false }
// )

watch(
  () => route.params.id,
  async (newSessionId, oldSessionId) => {
    if (newSessionId && newSessionId !== oldSessionId) {
      console.log('路由参数变化:', newSessionId)
      // 当路由参数变化时，获取会话信息并设置到 store 中
      try {
        // 首先检查 contactStore 中是否已经有选中的联系人，且 ID 匹配
        if (contactStore.selectedContact && contactStore.selectedContact.id === newSessionId) {
          console.log('会话数据已在 store 中，直接使用本地数据')
          // 直接使用已有的会话数据，避免重复请求服务器导致数据被覆盖
          const session = contactStore.selectedContact

          // 检查是否是当前已选中的会话，避免重复加载
          if (selectedSessionId.value === session.id) {
            console.log('路由参数变化，但会话已加载，跳过重复加载')
            return
          }

          // 更新当前选中的会话ID
          selectedSessionId.value = session.id
          console.log('设置新的selectedSessionId:', session.id)

          // 检查是否需要获取完整的群组信息
          if (session.sessionType === 'group' && (!session.group || !session.group.members)) {
            console.log('群聊信息不完整，尝试获取完整信息')
            // 从服务器获取完整的会话信息
            const sessionResponse = await getSessions()
            if (sessionResponse && sessionResponse.success) {
              const completeSession = sessionResponse.data.find((s) => s.id === newSessionId)
              if (completeSession) {
                // 更新 store 中的会话信息
                contactStore.setSelectedContact(completeSession)
              }
            }
          }

          // 触发全局事件，更新ChatList中的选中状态
          window.dispatchEvent(
            new CustomEvent('sessionSelected', {
              detail: { sessionId: session.id }
            })
          )

          // 加载消息
          await loadMessages(session.id).then(() => {
            // 在消息加载完成后，将滚动条重置到底部
            nextTick(() => {
              if (messagesContainer.value) {
                messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
              }
            })
          })
        } else {
          // 如果 contactStore 中没有该会话数据，则从服务器获取
          const sessionResponse = await getSessions()
          if (sessionResponse && sessionResponse.success) {
            const session = sessionResponse.data.find((s) => s.id === newSessionId)
            if (session) {
              // 检查是否是当前已选中的会话，避免重复加载
              if (selectedSessionId.value === session.id) {
                console.log('路由参数变化，但会话已加载，跳过重复加载')
                return
              }

              // 更新当前选中的会话ID
              selectedSessionId.value = session.id
              console.log('设置新的selectedSessionId:', session.id)

              // 设置选中的联系人
              contactStore.setSelectedContact(session)

              // 触发全局事件，更新ChatList中的选中状态
              window.dispatchEvent(
                new CustomEvent('sessionSelected', {
                  detail: { sessionId: session.id }
                })
              )

              // 加载消息
              await loadMessages(session.id).then(() => {
                // 在消息加载完成后，将滚动条重置到底部
                nextTick(() => {
                  if (messagesContainer.value) {
                    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
                  }
                })
              })
            }
          }
        }
      } catch (error) {
        console.error('获取会话信息失败:', error)
      }
    }
  }
)

// 计算属性：根据会话类型显示不同的名称
const getDisplayName = computed(() => {
  const session = contactStore.selectedContact
  console.log('getDisplayNameSession: ', session)
  if (!session) {
    // 如果store中没有选中的联系人，尝试从路由参数获取
    const sessionId = route.params.id
    if (sessionId && messages.value.length > 0) {
      // 如果有消息，说明这是有效的会话，但可能store未更新
      const sessionFromMessages = messages.value.find((msg) => msg.sessionId === sessionId)
      if (sessionFromMessages) {
        return sessionFromMessages.sessionName || '聊天'
      }
    }
    return ''
  }

  // 如果是群聊，显示群名称和成员数
  if (session.sessionType === 'group' && session.group) {
    const groupName =
      contactStore.selectedContact.customRemark ||
      contactStore.selectedContact.remark ||
      session.group.name ||
      session.name ||
      '群聊'
    const memberCount = session.group.members ? session.group.members.length : 0
    return `${groupName}(${memberCount})`
  }

  // 如果是私聊，显示对方用户名
  if (session.sessionType === 'private' && session.name) {
    return session.name
  }

  return session.name || '聊天'
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

const handleUpdateGroupName = (newName) => {
  console.log('新群名称:', newName)

  if (contactStore.selectedContact && contactStore.selectedContact.group) {
    contactStore.selectedContact.group.name = newName

    // 更新会话名称并同步到全局状态
    if (contactStore.selectedContact) {
      contactStore.selectedContact.name = newName
      // 触发全局事件，通知其他组件更新
      window.dispatchEvent(
        new CustomEvent('groupInfoUpdated', {
          detail: {
            sessionId: contactStore.selectedContact.id,
            newName: newName
          }
        })
      )
    }
  }
}

const handleUpdateAnnouncement = (newAnnouncement) => {
  console.log('新群公告:', newAnnouncement)
  // 更新联系人存储中的群公告
  if (contactStore.selectedContact && contactStore.selectedContact.group) {
    contactStore.selectedContact.group.announcement = newAnnouncement
  }
}

const handleUpdateRemark = (newRemark) => {
  console.log('新备注:', newRemark)
  console.log('contactStore.selectedContact: ', contactStore.selectedContact)
  // 更新联系人存储中的备注
  if (contactStore.selectedContact) {
    // 同时更新remark和customRemark字段以确保兼容性
    contactStore.selectedContact.remark = newRemark
    contactStore.selectedContact.customRemark = newRemark

    // 更新本地数据库中的备注信息
    if (window.api && typeof window.api.updateChatSessionRemark === 'function') {
      window.api
        .updateChatSessionRemark(contactStore.selectedContact.id, newRemark)
        .catch((err) => console.error('更新本地数据库中的会话备注失败:', err))
    }

    // 触发全局事件，通知ChatList组件更新会话列表中的备注
    window.dispatchEvent(
      new CustomEvent('sessionRemarkUpdated', {
        detail: {
          sessionId: contactStore.selectedContact.id,
          newRemark: newRemark
        }
      })
    )
  }
}

const handleUpdateNickname = (newNickname) => {
  console.log('新昵称:', newNickname)
  // 更新联系人存储中的昵称
  if (contactStore.selectedContact && contactStore.selectedContact.group) {
    // 查找当前用户并更新其昵称
    const members = contactStore.selectedContact.group.members
    if (members && Array.isArray(members)) {
      const currentUser = members.find((member) => member.id === userStore.userId)
      if (currentUser) {
        currentUser.name = newNickname
      }
    }

    // 更新当前用户在会话中的昵称
    const currentSessionUser = contactStore.selectedContact.ChatSessionUsers?.find(
      (user) => user.userId === userStore.userId
    )
    if (currentSessionUser) {
      currentSessionUser.nickname = newNickname
    }

    // 更新contactStore.selectedContact中的nickname字段
    contactStore.selectedContact.nickname = newNickname
  }

  // 更新全局用户状态中的昵称
  userStore.updateSetting('username', newNickname)

  // 触发全局事件，通知其他组件更新
  window.dispatchEvent(
    new CustomEvent('userNicknameUpdated', {
      detail: {
        sessionId: contactStore.selectedContact?.id,
        newNickname: newNickname,
        userId: userStore.userId
      }
    })
  )

  // 更新本地数据库中的昵称信息
  if (window.api && typeof window.api.updateChatSessionUserBySessionAndUserId === 'function') {
    const userId = userStore.userId
    window.api
      .updateChatSessionUserBySessionAndUserId(contactStore.selectedContact.id, userId, {
        nickname: newNickname
      })
      .catch((err) => console.error('更新本地数据库中的群昵称失败:', err))
  }

  // 更新contactStore以确保数据同步
  contactStore.setSelectedContact({ ...contactStore.selectedContact })
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

  console.log('contactStore.selectedContact.nickname: ', contactStore.selectedContact.nickname)

  // 检查是否需要添加时间戳
  const currentTime = new Date()
  let shouldAddTimestamp = false

  // 查找最后一条普通消息的时间
  for (let i = 0; i < messages.value.length; i++) {
    const lastMessage = messages.value[i]
    if (lastMessage.type !== 'timestamp' && lastMessage.type !== 'system') {
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

      // 保存时间戳消息到本地数据库
      try {
        if (window.api && typeof window.api.addUnifiedMessage === 'function') {
          const timestampMessageSaveData = {
            id: response1.data.messageId,
            sessionId: selectedContact.id,
            senderId: userStore.userId,
            senderName: userStore.username || '我',
            senderAvatar: userStore.avatar || '',
            receiverId:
              selectedContact.sessionType === 'private' ? selectedContact.contactId : null,
            groupId: selectedContact.sessionType === 'group' ? selectedContact.group?.id : null,
            content: currentTime.toISOString(),
            messageType: 'timestamp',
            status: 'SENT',
            readStatus: true,
            createdAt: response1.data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          const result = await window.api.addUnifiedMessage(timestampMessageSaveData)
          if (result.success) {
            console.log('时间戳消息已保存到本地数据库:', result.data)
          } else {
            console.error('保存时间戳消息到本地数据库失败:', result.error)
          }
        }
      } catch (localError) {
        console.error('调用addUnifiedMessage时发生错误:', localError)
      }
    } catch (error) {
      console.error('发送消息失败:', error)
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
            data: {
              ...imageMessageData,
              senderName: contactStore.selectedContact.nickname || userStore.username || '我'
            }
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

              // 更新本地消息的ID为服务器返回的真实ID
              const localMessageIndex = messages.value.findIndex(
                (msg) => msg.id === localImageMessage.id
              )
              if (localMessageIndex !== -1) {
                messages.value[localMessageIndex].id = response.data.messageId
              }
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
            data: {
              ...messageData,
              senderName: contactStore.selectedContact.nickname || userStore.username
            }
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
              const localMessageIndex = messages.value.findIndex(
                (msg) => msg.id === localMessage.id
              )
              if (localMessageIndex !== -1) {
                messages.value[localMessageIndex].id = response.data.messageId
              }
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
  // 移除WebSocket消息监听器
  if (window.api && typeof window.api.removeNewMessageListener === 'function') {
    window.api.removeNewMessageListener()
    isMessageListenerAdded = false
  }

  // 移除删除消息监听器
  if (window.api && typeof window.api.removeDeleteMessageListener === 'function') {
    window.api.removeDeleteMessageListener()
  }

  window.removeEventListener('contactStoreUpdated', handleContactStoreUpdate)

  // 移除右键菜单的事件监听
  document.removeEventListener('click', closeContextMenu)

  window.removeEventListener('chatHistoryCleared', handleChatHistoryCleared)
})

const handleContactStoreUpdate = async (event) => {
  const session = event.detail?.selectedContact
  if (session && session.id !== contactStore.selectedContact?.id) {
    contactStore.setSelectedContact(session)
    await loadMessages(session.id).then(() => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      })
    })
  }
}

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
  const contactData = contactStore.selectedContact
    ? JSON.parse(JSON.stringify(contactStore.selectedContact))
    : null
  window.api.openChatMessageWindow(contactData)
}

const sessionUsers = computed(() => {
  console.log('SessionUsers: ContactStore.selectedContacts: ', contactStore.selectedContact)
  const session = contactStore.selectedContact
  if (!session) return []

  // 检查 session 是否为群聊
  if (session.sessionType === 'group') {
    // 优先检查 session.group.members
    if (session.group && session.group.members) {
      return session.group.members
    }
    // 如果没有 group 信息，尝试从其他可能的属性获取
    else if (session.members) {
      return session.members
    }
    // 如果是 ChatSessionUser 类型，检查其关联的用户信息
    else if (session.ChatSessionUsers && Array.isArray(session.ChatSessionUsers)) {
      // 尝试从 ChatSessionUsers 中提取成员信息
      return session.ChatSessionUsers.map((user) => ({
        id: user.userId,
        name: user.nickname || user.user?.username || '未知用户',
        avatar: user.user?.avatar || user.avatar || ''
      }))
    }
    // 检查是否直接在顶层对象中包含成员信息
    else {
      console.log('session object:', session)
      // 如果没有找到成员信息，返回空数组
      return []
    }
  }
  // 如果不是群聊，返回空数组
  return []
})

const displayedUsers = computed(() => {
  // 最多显示15个成员
  return sessionUsers.value ? sessionUsers.value.slice(0, 15) : []
})

// 是否显示添加按钮
const shouldShowAddButton = computed(() => {
  const session = contactStore.selectedContact
  // 只有在群聊中才显示添加按钮
  return (
    session &&
    session.sessionType === 'group' &&
    sessionUsers.value &&
    sessionUsers.value.length > 0
  )
})

// 添加成员方法
const addMember = () => {
  console.log('添加成员')
  // 这里可以实现添加成员的逻辑
}

// 添加新的方法
const searchMessages = () => {
  console.log('查找聊天内容')
  // 发送消息到主进程打开聊天消息窗口
  const contactData = contactStore.selectedContact
    ? JSON.parse(JSON.stringify(contactStore.selectedContact))
    : null
  window.api.openChatMessageWindow(contactData)
}

// 计算是否为群主或管理员
const isGroupOwnerOrAdmin = computed(() => {
  const session = contactStore.selectedContact
  if (!session) return false

  const userId = userStore.userId

  // 如果是群聊
  if (session.sessionType === 'group') {
    // 如果有完整的 group 信息
    if (session.group) {
      const group = session.group
      // 检查是否为群主
      if (group.ownerId === userId) return true
      // 检查是否为管理员
      if (group.adminIds && group.adminIds.includes(userId)) return true
    }
    // 否则直接检查 session 对象的顶层属性
    else {
      // 检查是否为群主
      if (session.ownerId === userId) return true
      // 检查身份是否为 owner 或 admin
      if (session.identity === 'owner' || session.identity === 'admin') return true
    }
  }

  return false
})

// 添加清空聊天记录和退出群聊的方法
const clearChatHistory = () => {
  ElMessageBox.confirm('确定要清空聊天记录吗？此操作不可恢复！', '清空聊天记录', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      // 执行清空聊天记录的逻辑
      try {
        const sessionId = contactStore.selectedContact?.id
        if (sessionId) {
          // 调用API删除该会话的所有消息记录
          const result = await window.api.deleteUnifiedMessagesBySessionId(sessionId)

          if (result.success) {
            // 清空当前消息列表
            messages.value = []

            // 显示成功消息
            ElMessage.success('聊天记录已清空')

            console.log('聊天记录已清空，会话ID:', sessionId)
          } else {
            ElMessage.error('清空聊天记录失败: ' + result.error)
            console.error('清空聊天记录失败:', result.error)
          }
        } else {
          ElMessage.warning('未找到有效的会话信息')
        }
      } catch (error) {
        ElMessage.error('清空聊天记录时发生错误')
        console.error('清空聊天记录时发生错误:', error)
      }
    })
    .catch(() => {
      // 用户取消操作
    })
}

// 添加清空聊天记录事件处理
const handleChatHistoryCleared = (event) => {
  const { sessionId } = event.detail

  // 检查是否是当前会话
  if (contactStore.selectedContact?.id === sessionId) {
    // 清空当前消息列表
    messages.value = []

    // 重新加载消息
    if (contactStore.selectedContact?.id) {
      loadMessages(contactStore.selectedContact.id)
    }
  }
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

  // 检查文件大小
  if (file.size === 0) {
    ElMessage.error('不能上传大小为0的文件')
    return
  }

  // 显示上传状态
  const loading = ElLoading.service({
    text: '正在上传文件...',
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
          downloadUrl: response.videoInfo?.downloadUrl,
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
            downloadUrl: response.videoInfo?.downloadUrl,
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
              data: {
                ...videoMessageData,
                senderName: contactStore.selectedContact.nickname || userStore.username || '我'
              }
            })
          }

          // 通过HTTP API发送消息到后端（用于持久化存储）
          const sendResponse = await sendMessage(videoMessageData)
          console.log('视频消息发送成功:', sendResponse)

          // 保存消息到本地数据库
          try {
            if (window.api && typeof window.api.addUnifiedMessage === 'function') {
              const messageSaveData = {
                id: sendResponse.data.data.messageId,
                sessionId: sendResponse.data.data.sessionId,
                senderId: sendResponse.data.data.senderId,
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
                downloadUrl: response.videoInfo?.downloadUrl,
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
          size: response.fileSize ? formatFileSize(response.fileSize) : '未知大小', // 使用正确的属性名
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
              data: {
                ...fileMessageData,
                senderName: contactStore.selectedContact.nickname || userStore.username || '我'
              }
            })
          }

          // 通过HTTP API发送消息到后端（用于持久化存储）
          const sendResponse = await sendMessage(fileMessageData)
          console.log('文件消息发送成功:', sendResponse)

          // 保存消息到本地数据库
          try {
            if (window.api && typeof window.api.addUnifiedMessage === 'function') {
              const messageSaveData = {
                id: sendResponse.data.data.messageId,
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
                createdAt: sendResponse.data.data.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }

              console.log('messageSaveData: ', messageSaveData)

              const result = await window.api.addUnifiedMessage(messageSaveData)
              if (result.success) {
                console.log('文件消息已保存到本地数据库:', result.data)

                // 更新本地消息的ID为服务器返回的真实ID
                const localMessageIndex = messages.value.findIndex(
                  (msg) => msg.id === localFileMessage.id
                )
                if (localMessageIndex !== -1) {
                  messages.value[localMessageIndex].id = sendResponse.data.messageId
                }
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

  const knownExtensions = [
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'txt',
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'webp',
    'svg',
    'mp3',
    'wav',
    'flac',
    'aac',
    'ogg',
    'mp4',
    'avi',
    'mkv',
    'mov',
    'wmv',
    'flv',
    'webm',
    'zip',
    'rar',
    '7z',
    'tar',
    'gz',
    'bz2',
    'exe',
    'msi',
    'deb',
    'rpm',
    'app',
    'dmg',
    'js',
    'ts',
    'vue',
    'html',
    'css',
    'scss',
    'json',
    'xml',
    'py',
    'java',
    'cpp',
    'c',
    'h',
    'php',
    'rb',
    'go',
    'swift',
    'kt',
    'ai',
    'psd',
    'xd',
    'sketch',
    'fig',
    'eps',
    'sql',
    'csv',
    'md',
    'rtf',
    'odt',
    'ods',
    'odp',
    // 添加更多常见的扩展名
    'less',
    'sass',
    'jsx',
    'tsx',
    'woff',
    'woff2',
    'ttf',
    'eot',
    'ico',
    'tex',
    'epub',
    'mobi',
    'azw3',
    'djvu',
    'xlsb',
    'xlsm',
    'tsv',
    'pps',
    'ppsx',
    'pot',
    'potx',
    'vsd',
    'vsdx',
    'pub',
    'msg',
    'eml',
    'dwg',
    'dxf',
    'stl',
    'obj',
    'fbx',
    'dae',
    'max',
    'blend',
    'indd',
    'psb',
    'xcf',
    'cr2',
    'nef',
    'arw',
    'orf',
    'raw',
    'fla',
    'swf',
    'prproj',
    'aep',
    'cdr',
    'pl',
    'r',
    'mat',
    'm',
    'asm',
    's',
    'rs',
    'dart',
    'jl',
    'lua',
    'sh',
    'bat',
    'cmd',
    'ps1',
    'vbs',
    'jar',
    'war',
    'apk',
    'ipa',
    'pkg',
    'iso',
    'bin',
    'dat',
    'log',
    'tmp',
    'bak',
    'cfg',
    'ini',
    'reg',
    'url',
    'lnk',
    'dwf',
    'plt',
    'pcx',
    'tga',
    'tif',
    'tiff',
    'eps',
    'wmf',
    'emf',
    'cdr',
    'wmz',
    'appx',
    'deb',
    'rpm',
    'msi',
    'pkg',
    'dmg',
    'iso'
  ]

  if (knownExtensions.includes(newNormalizedExtension)) {
    return `${import.meta.env.BASE_URL}src/assets/filetypeicon/${newNormalizedExtension}.png`
  } else {
    return `${import.meta.env.BASE_URL}src/assets/filetypeicon/txt.png`
  }
}

const AudioCall = () => {
  // 获取当前会话的信息
  const contactData = contactStore.selectedContact
  if (contactData) {
    // 发送IPC消息打开音频通话窗口
    window.api.openAudioCallWindow({
      contactName: contactData.name || contactData.remark || '联系人',
      avatar: contactData.avatar || '',
      sessionId: contactData.id
    })
  } else {
    ElMessage.warning('请选择一个聊天会话进行通话')
  }
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
  const imageMessages = messages.value.filter((msg) => msg.type === 'image')
  const clickedImageIndex = imageMessages.findIndex((msg) => msg.imageUrl === imageUrl)
  console.log(clickedImageIndex)

  // 获取当前会话的sessionId
  const sessionId = contactStore.selectedContact?.id || ''

  // 通过IPC调用主进程打开新的图片查看窗口，并传递参数
  if (window.api && typeof window.api.openImageViewWindow === 'function') {
    window.api.openImageViewWindow(imageUrl, sessionId, clickedImageIndex)
  } else {
    // 如果没有IPC接口，则回退到原来的预览方式
    previewImageUrl.value = imageUrl
    isPreviewVisible.value = true
  }
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

    // 显示正在处理提示
    const loading = ElLoading.service({
      text: '正在检查文件...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    try {
      // 通过IPC发送检查文件请求到主进程
      if (window.api && typeof window.api.checkAndOpenFile === 'function') {
        // 从消息中提取日期信息
        let messageDate = null
        if (fileMessage.createdAt) {
          const date = new Date(fileMessage.createdAt)
          messageDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        }

        const result = await window.api.checkAndOpenFile(fileName, storageLocation, messageDate)

        loading.close()

        if (result.exists) {
          // 文件已存在，根据是否能打开显示不同提示
          if (result.canOpen) {
            // 文件成功打开
            ElMessage.success(result.message)
          } else {
            // 文件无法打开，已打开所在文件夹
            ElMessage.warning(result.message)
          }
        } else {
          // 文件不存在，执行下载流程
          await downloadNewFile(fileUrl, fileName, storageLocation, fileMessage)
        }
      } else {
        loading.close()
        // 如果没有checkAndOpenFile方法，则使用原来的下载方式
        ElMessage.info('正在使用浏览器下载...')
        attemptBrowserDownload(fileUrl, fileName)
      }
    } catch (ipcError) {
      loading.close()
      console.error('IPC通信错误:', ipcError)
      ElMessage.error('文件检查服务暂时不可用，正在尝试浏览器下载...')
      // IPC通信失败时使用浏览器默认下载
      attemptBrowserDownload(fileUrl, fileName)
    }
  } catch (error) {
    console.error('文件处理出错:', error)
    ElMessage.error('文件处理出错: ' + (error.message || '未知错误'))
  }
}

const downloadNewFile = async (fileUrl, fileName, storageLocation, fileMessage) => {
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
        if (result.error.includes('网络请求失败') || result.error.includes('CONNECTION_REFUSED')) {
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
  border-bottom: 1px solid rgb(213, 213, 213);
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
  min-width: 120px;
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
