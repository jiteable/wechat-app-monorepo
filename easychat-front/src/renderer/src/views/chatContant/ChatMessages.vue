<template>
  <div class="chat-messages-container drag">
    <!-- 页面标题 -->
    <div class="page-title">
      <span class="title-text">"{{ chatTitle }}"的聊天记录({{ messageCount }})</span>
      <!-- 窗口控制按钮 -->
      <div class="window-controls no-drag">
        <button class="control-button minimize-button" @click="minimizeWindow">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M0 6h12v1H0z" fill="currentColor" />
          </svg>
        </button>
        <button class="control-button close-button" @click="closeWindow">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path
              d="M6 4.586L1.707.293.293 1.707 4.586 6 .293 10.293l1.414 1.414L6 7.414l4.293 4.293 1.414-1.414L7.414 6l4.293-4.293L10.293.293 6 4.586z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="search-box no-drag" :class="{ focused: isSearchFocused }">
      <!-- 搜索图标 -->
      <el-icon class="search-icon">
        <Search />
      </el-icon>

      <!-- 普通输入框 -->
      <input
        v-model="searchText"
        class="no-drag search-input"
        placeholder="搜索"
        @input="handleSearch"
        @focus="isSearchFocused = true"
        @blur="isSearchFocused = false"
      />

      <!-- 标签显示区域（在输入框内部） -->
      <div v-if="activeTab !== 'all'" slot="suffix" class="tag-container">
        <div class="tag-item">
          <span class="tag-text">{{ getActiveTabName() }}</span>
          <span class="tag-close" @click="clearTag">×</span>
        </div>
      </div>
    </div>

    <!-- 分类标签 -->
    <div class="category-tabs no-drag">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['category-tab', { active: activeTab === tab.id }]"
        @click="switchTab(tab.id)"
      >
        {{ tab.name }}
      </button>

      <!-- 日期标签 -->
      <button
        ref="dateButtonRef"
        :class="['category-tab', { active: activeTab === 'date' }]"
        @click="handleDateTabClick"
      >
        日期
      </button>

      <el-popover
        v-model="datePickerVisible"
        placement="bottom"
        width="200"
        trigger="click"
        popper-class="date-picker-popover"
        :virtual-ref="dateButtonRef"
        virtual-triggering
      >
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
          @change="handleDateChange"
        />
      </el-popover>
    </div>

    <!-- 聊天记录列表 -->
    <div class="messages-list-container no-drag">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="filteredMessages.length === 0" class="empty-state">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M24 4H12V8H24V4Z" fill="#E0E0E0" />
          <path d="M44 12H36V16H44V12Z" fill="#E0E0E0" />
          <path d="M44 20H36V24H44V20Z" fill="#E0E0E0" />
          <path d="M44 28H36V32H44V28Z" fill="#E0E0E0" />
          <path d="M44 36H36V40H44V36Z" fill="#E0E0E0" />
          <path d="M24 44H12V48H24V44Z" fill="#E0E0E0" />
          <path d="M4 12H12V16H4V12Z" fill="#E0E0E0" />
          <path d="M4 20H12V24H4V20Z" fill="#E0E0E0" />
          <path d="M4 28H12V32H4V28Z" fill="#E0E0E0" />
          <path d="M4 36H12V40H4V36Z" fill="#E0E0E0" />
          <path d="M24 12H36V16H24V12Z" fill="#E0E0E0" />
          <path d="M24 20H36V24H24V20Z" fill="#E0E0E0" />
          <path d="M24 28H36V32H24V28Z" fill="#E0E0E0" />
          <path d="M24 36H36V40H24V36Z" fill="#E0E0E0" />
        </svg>
        <p>暂无相关聊天记录</p>
      </div>

      <div v-else class="messages-list">
        <div v-for="message in sortedMessages" :key="message.id" class="message-item">
          <!-- 时间戳消息 -->
          <div v-if="message.type === 'timestamp'" class="message-timestamp">
            {{ formatDate(message.content) }}
          </div>

          <!-- 系统消息 -->
          <div v-else-if="message.type === 'system'" class="system-message">
            {{ message.content }}
          </div>

          <!-- 图片消息 -->
          <div v-else-if="message.type === 'image'" class="message-item-container">
            <div class="message-header">
              <el-avatar :size="32" :src="message.senderAvatar" class="message-avatar" />
              <div class="message-info">
                <div class="message-sender">{{ message.senderName }}</div>
              </div>
              <div class="message-time-wrapper">
                <div class="message-time">{{ message.time }}</div>
              </div>
            </div>
            <div class="message-content">
              <div class="image-container">
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
          <div v-else-if="message.type === 'file'" class="message-item-container">
            <div class="message-header">
              <el-avatar :size="32" :src="message.senderAvatar" class="message-avatar" />
              <div class="message-info">
                <div class="message-sender">{{ message.senderName }}</div>
              </div>
              <div class="message-time-wrapper">
                <div class="message-time">{{ message.time }}</div>
              </div>
            </div>
            <div class="message-content">
              <div class="file-message-bubble" @click="handleFileDownload(message)">
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

          <!-- 视频消息 -->
          <div v-else-if="message.type === 'video'" class="message-item-container">
            <div class="message-header">
              <el-avatar :size="32" :src="message.senderAvatar" class="message-avatar" />
              <div class="message-info">
                <div class="message-sender">{{ message.senderName }}</div>
              </div>
              <div class="message-time-wrapper">
                <div class="message-time">{{ message.time }}</div>
              </div>
            </div>
            <div class="message-content">
              <div class="video-message-bubble">
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

          <!-- 普通文本消息 -->
          <div v-else class="message-item-container">
            <div class="message-header">
              <el-avatar :size="32" :src="message.senderAvatar" class="message-avatar" />
              <div class="message-info">
                <div class="message-sender">{{ message.senderName }}</div>
              </div>
              <div class="message-time-wrapper">
                <div class="message-time">{{ message.time }}</div>
              </div>
            </div>
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElDatePicker, ElPopover, ElMessage } from 'element-plus'
import { userContactStore } from '@/store/userContactStore'
import { useUserStore } from '@/store/userStore'
import { useUserSetStore } from '@/store/userSetStore'
import { getMessages } from '@/api/chat'

interface Message {
  id: string | number
  content: string
  time: string
  type: string
  senderName: string
  senderAvatar: string
  imageUrl?: string
  fileName?: string
  fileExtension?: string
  size?: string
  mediaUrl?: string
  thumbnailUrl?: string
  videoInfo?: {
    duration?: number
    width?: number
    height?: number
  }
}

// 搜索相关
const searchText = ref('')
const loading = ref(false)
const isSearchFocused = ref(false)

// 日期选择器相关
const datePickerVisible = ref(false)
const dateButtonRef = ref<HTMLElement | null>(null)

// 分类标签
const tabs = ref([
  { id: 'all', name: '全部' },
  { id: 'file', name: '文件' },
  { id: 'image', name: '图片与视频' },
  { id: 'link', name: '链接' },
  { id: 'audio', name: '音乐与音频' },
  { id: 'member', name: '群成员' }
])

const activeTab = ref('all')

// 从Pinia存储中获取当前会话信息
const contactStore = userContactStore()
const userStore = useUserStore()
const userSetStore = useUserSetStore()

const chatTitle = ref('请选择聊天')
const messageCount = ref(0)

// 监听来自主进程的联系人数据
const handleContactData = (event, contactData) => {
  console.log('从主进程接收到联系人数据:', contactData)
  if (contactData) {
    contactStore.setSelectedContact(contactData)
    chatTitle.value = contactData.name || '聊天记录'
    loadMessages(contactData.id)
  }
}

// 监听来自其他窗口的store更新事件
const handleStoreUpdate = (event: CustomEvent) => {
  console.log('contactStore 状态已更新:', event.detail)
  // 更新当前窗口的store状态
  contactStore.syncFromOtherWindows(event.detail)

  // 如果有了选中的联系人，加载消息
  if (contactStore.selectedContact) {
    chatTitle.value = contactStore.selectedContact.name || '聊天记录'
    loadMessages(contactStore.selectedContact.id)
  }
}

onMounted(async () => {
  // 添加IPC监听器
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.on('set-contact-data', handleContactData)
  }

  // 添加事件监听器
  window.addEventListener('contactStoreUpdated', handleStoreUpdate as EventListener)

  if (contactStore.selectedContact) {
    chatTitle.value = contactStore.selectedContact.name || '聊天记录'
    await loadMessages(contactStore.selectedContact.id)
  } else {
    // 尝试从localStorage恢复状态
    const savedState = localStorage.getItem('contactStoreUpdated')
    if (savedState) {
      try {
        const state = JSON.parse(savedState)
        contactStore.syncFromOtherWindows(state)
        if (contactStore.selectedContact) {
          chatTitle.value = contactStore.selectedContact.name || '聊天记录'
          await loadMessages(contactStore.selectedContact.id)
        }
      } catch (e) {
        console.error('解析保存的状态时出错:', e)
      }
    }
  }
})

onUnmounted(() => {
  // 移除IPC监听器
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.removeListener('set-contact-data', handleContactData)
  }

  // 移除事件监听器
  window.removeEventListener('contactStoreUpdated', handleStoreUpdate as EventListener)
})

// 获取真实聊天记录数据
const loadMessages = async (sessionId) => {
  try {
    loading.value = true
    const response = await getMessages({ sessionId, page: 1, limit: 50 })

    if (response.data.success) {
      // 更新消息数量
      messageCount.value = response.data.data.pagination.totalMessages

      // 将获取到的消息转换为组件所需格式
      messages.value = response.data.data.messages.map((msg) => {
        const baseMessage = {
          id: msg.id,
          content: msg.content,
          time: formatTime(msg.updatedAt),
          type: msg.messageType,
          senderName: msg.sender?.username || '未知用户',
          senderAvatar:
            msg.sender?.avatar ||
            'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
          imageUrl: msg.mediaUrl,
          fileName: msg.fileName,
          fileExtension: msg.file?.fileExtension || msg.fileExtension,
          size: formatFileSize(msg.fileSize),
          mediaUrl: msg.mediaUrl,
          thumbnailUrl: msg.video?.thumbnailUrl || msg.thumbnailUrl
        }

        // 如果是视频类型消息，添加视频相关信息
        if (msg.messageType === 'video') {
          return {
            ...baseMessage,
            videoInfo: msg.video || {
              duration: msg.videoInfo?.duration,
              width: msg.videoWidth || msg.videoInfo?.width,
              height: msg.videoHeight || msg.videoInfo?.height
            }
          }
        }

        return baseMessage
      })
    }

    console.log('messagessss: ', response.data.data.messages)
  } catch (error) {
    console.error('获取消息失败:', error)
  } finally {
    loading.value = false
  }
}

const formatTime = (timestamp) => {
  // 检查时间戳是否有效
  if (!timestamp && timestamp !== 0) {
    console.warn('无效的时间戳:', timestamp)
    return 'Invalid Time'
  }

  let date

  try {
    // 根据不同类型处理时间戳
    if (typeof timestamp === 'string') {
      // 处理 ISO 8601 格式的时间字符串
      if (timestamp.includes('T') && timestamp.endsWith('Z')) {
        date = new Date(timestamp)
      } else if (timestamp.includes('-') && timestamp.includes(':')) {
        // 处理 "YYYY-MM-DD HH:MM" 格式的时间字符串
        date = new Date(timestamp.replace(' ', 'T'))
      } else {
        // 尝试作为时间戳解析
        const numericTimestamp = parseInt(timestamp, 10)
        if (!isNaN(numericTimestamp)) {
          date = new Date(numericTimestamp)
        } else {
          throw new Error('无法解析时间字符串')
        }
      }
    } else if (typeof timestamp === 'number') {
      // 数字格式的时间戳
      date = new Date(timestamp)

      // 如果得到的年份不合理（比如小于1970），可能是秒级时间戳
      if (date.getFullYear() < 1970 && date.getFullYear() > 0) {
        date = new Date(timestamp * 1000)
      }
    } else {
      // 其他类型
      date = new Date(timestamp)
    }

    // 检查日期对象是否有效
    if (isNaN(date.getTime())) {
      console.warn('无法解析的时间戳:', timestamp)
      return 'Invalid Time'
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (error) {
    console.error('时间格式化错误:', error, '时间戳:', timestamp)
    return 'Invalid Time'
  }
}

// 模拟聊天记录数据
const messages = ref<Message[]>([])

// 过滤后的消息列表
const filteredMessages = computed(() => {
  let result = [...messages.value]

  // 搜索关键词过滤
  if (searchText.value) {
    const query = searchText.value.toLowerCase()
    result = result.filter((msg) => msg.content.toLowerCase().includes(query))
  }

  // 类型过滤（除了 date 外）
  if (activeTab.value !== 'all' && activeTab.value !== 'date') {
    let messageType = ''
    switch (activeTab.value) {
      case 'file':
        messageType = 'file'
        break
      case 'image':
        messageType = 'image'
        break
      case 'link':
        messageType = 'link'
        break
      case 'audio':
        messageType = 'audio'
        break
      case 'member':
        messageType = 'member'
        break
    }
    result = result.filter((msg) => msg.type === messageType)
  }

  // 日期过滤
  if (activeTab.value === 'date' && selectedDate.value) {
    const targetDate = new Date(selectedDate.value).toISOString().split('T')[0]
    result = result.filter((msg) => {
      const msgDate = new Date(msg.time).toISOString().split('T')[0]
      return msgDate === targetDate
    })
  }

  return result
})

// 按时间排序的消息列表（最新的在上面）
const sortedMessages = computed(() => {
  // 先过滤消息，再按时间排序
  return [...filteredMessages.value].sort((a, b) => {
    // 将时间字符串转换为时间戳进行比较
    const timeA = new Date(a.time).getTime()
    const timeB = new Date(b.time).getTime()
    // 降序排列（最新的在前面）
    return timeB - timeA
  })
})

// 日期选择器绑定值
const selectedDate = ref<string | null>(null)

// 过滤消息：按日期筛选
const filterByDate = () => {
  if (!selectedDate.value) {
    activeTab.value = 'all'
  } else {
    activeTab.value = 'date'
  }
}

// 处理日期变化
const handleDateChange = (value: string | null) => {
  selectedDate.value = value
  filterByDate()
  // 选择日期后隐藏选择器
  datePickerVisible.value = false
}

// 获取当前激活标签的名称
const getActiveTabName = () => {
  const tab = tabs.value.find((t) => t.id === activeTab.value)
  return tab ? tab.name : '全部'
}

// 切换标签
const switchTab = (tabId: string) => {
  activeTab.value = tabId
  // 当切换到日期标签时，清除之前选择的日期，让用户重新选择
  if (tabId === 'date') {
    selectedDate.value = null
    // 显示日期选择器
    nextTick(() => {
      datePickerVisible.value = true
    })
  } else {
    // 隐藏日期选择器
    datePickerVisible.value = false
  }
}

// 处理日期标签点击
const handleDateTabClick = () => {
  if (activeTab.value === 'date') {
    // 如果已经处于日期标签状态，切换显示/隐藏日期选择器
    datePickerVisible.value = !datePickerVisible.value
  } else {
    switchTab('date')
  }
}

// 清除标签
const clearTag = () => {
  activeTab.value = 'all'
}

// 处理搜索
const handleSearch = () => {
  // 可以在这里添加搜索逻辑
  console.log('搜索:', searchText.value)
}

// 最小化窗口
const minimizeWindow = () => {
  window.api.minimizeChatMessageWindow()
}

// 关闭窗口
const closeWindow = () => {
  window.api.closeChatMessageWindow()
}

// 格式化时间戳
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()

  // 获取日期差（毫秒）
  const diffInMs = now.getTime() - date.getTime()
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
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date
      .getDate()
      .toString()
      .padStart(2, '0')}`
  }
  // 其他情况显示 月/日
  else {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date
      .getDate()
      .toString()
      .padStart(2, '0')}`
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取文件图标路径
const getFileIconPath = (fileExtension) => {
  // 如果没有文件扩展名，使用默认的文件图标
  if (!fileExtension) {
    // 直接返回相对于 public 目录的路径
    return '/src/assets/filetypeicon/unknown.png'
  }

  // 确保扩展名以点号开头并且是小写
  const normalizedExtension = fileExtension.startsWith('.')
    ? fileExtension.toLowerCase()
    : `.${fileExtension.toLowerCase()}`

  const newNormalizedExtension = normalizedExtension.split('.').join('')

  // 返回图标的路径
  return `/src/assets/filetypeicon/${newNormalizedExtension}.png`
}

// 处理文件下载
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

    try {
      // 通过IPC发送下载文件请求到主进程
      if (window.api && typeof window.api.downloadFile === 'function') {
        const result = await window.api.downloadFile(fileUrl, fileName, storageLocation)

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
        // 如果没有downloadFile方法，则使用浏览器默认下载
        ElMessage.info('正在使用浏览器下载...')
        attemptBrowserDownload(fileUrl, fileName)
      }
    } catch (ipcError) {
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

// 播放视频
const playVideo = (videoUrl) => {
  // 在新窗口中播放视频或者使用模态框播放
  window.open(videoUrl, '_blank')
}

// 格式化视频时长
const formatDuration = (seconds) => {
  if (!seconds) return ''

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 图片预览相关
const previewImage = (imageUrl) => {
  // 在新窗口中打开图片或者使用模态框预览
  window.open(imageUrl, '_blank')
}
</script>

<style scoped lang="scss">
.chat-messages-container {
  width: 100%;
  height: 100vh;
  padding: 10px;
  background-color: #f5f5f5;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.page-title {
  margin-bottom: 20px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  position: relative;
  flex-shrink: 0;
}

.title-text {
  display: inline-block;
  max-width: calc(100% - 80px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.window-controls {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  gap: 8px;
}

.control-button {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  color: #666;
}

.control-button:hover {
  background-color: #e0e0e0;
}

.close-button:hover {
  background-color: #ff5f56;
  color: white;
}

.minimize-button:hover {
  background-color: #ffbd2e;
  color: white;
}

.search-box {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
  background-color: white;
  border: 1px solid rgb(228, 228, 228);
  border-radius: 10px;
  transition: border-color 0.2s ease;
  flex-shrink: 0;
}

.search-box.focused {
  border-color: rgb(7, 193, 96);
}

.search-icon {
  color: #999;
  font-size: 16px;
  margin-left: 20px;
}

.search-input {
  flex: 1;
  border-radius: 10px;
  border: none;
  outline: none;
  font-size: 14px;
  padding: 8px 12px;
  background-color: white;
}

.tag-container {
  display: flex;
  align-items: center;
  margin-right: 10px;
  background-color: #e0e0e0;
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 12px;
  color: #333;
  white-space: nowrap;
  margin-left: 8px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag-text {
  font-weight: 500;
}

.tag-close {
  cursor: pointer;
  font-size: 12px;
  color: #991;
  transition: color 0.2s ease;
}

.tag-close:hover {
  color: #333;
}

.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  scrollbar-width: thin;
  scrollbar-color: #ccc #f5f5f5;
  position: relative;
  flex-shrink: 0;
}

.category-tab {
  border: 0px;
  border-radius: 6px;
  background-color: rgb(237, 237, 237);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: #666;
}

.category-tab:hover {
  background-color: #f0f0f0;
}

.category-tab.active {
  background-color: #007aff;
  color: white;
  border-color: #007aff;
}

.messages-list-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 8px;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #999;
  flex: 1;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #999;
  text-align: center;
  flex: 1;
}

.message-item {
  margin-bottom: 12px;
}

.message-item-container {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.message-avatar {
  margin-right: 10px;
}

.message-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.message-sender {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.message-time-wrapper {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 60px;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-right: 8px;
}

.message-content {
  display: flex;
  flex-direction: column;
}

.message-text {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
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
  text-align: center;
}

/* 图片消息样式 */
.image-container {
  display: flex;
  margin-top: 8px;
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
  cursor: pointer;
  margin-top: 8px;
}

/* 文件容器 */
.file-container {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  width: 100%;
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
  flex-shrink: 0;
}

/* 文件信息 */
.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 380px;
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
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
}

.file-extension-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

/* 视频消息样式 */
.video-message-bubble {
  background: transparent;
  padding: 0;
  box-shadow: none;
  border: none;
  max-width: 250px;
  margin-top: 8px;
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
</style>
