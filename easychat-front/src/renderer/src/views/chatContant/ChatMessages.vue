<template>
  <div class="chat-messages-container drag">
    <!-- 页面标题 -->
    <div class="page-title">
      <span class="title-text">“{{ chatTitle }}”的聊天记录({{ messageCount }})</span>
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
    <div class="messages-list no-drag">
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

      <div v-for="message in sortedMessages" v-else :key="message.id" class="message-item">
        <div class="message-header">
          <el-avatar :size="32" :src="message.avatar" class="message-avatar" />
          <div class="message-info">
            <div class="message-sender">{{ message.sender }}</div>
          </div>
          <div class="message-time-wrapper">
            <div class="message-time">{{ message.time }}</div>
          </div>
        </div>
        <div class="message-content">
          <div class="message-text">{{ message.text }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElDatePicker, ElPopover } from 'element-plus'
import { userContactStore } from '@/store/userContactStore'
import { getMessages } from '@/api/chat'

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
      messages.value = response.data.data.messages.map((msg) => ({
        id: msg.id,
        text: msg.content,
        time: formatTime(msg.updatedAt),
        type: getMessageType(msg.messageType),
        sender: msg.sender?.username || '未知用户',
        avatar:
          msg.sender?.avatar ||
          'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
      }))
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
        // 处理 "YYYY-MM-DD HH:MM" 格式的字符串
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

// 根据消息类型转换为中文描述
const getMessageType = (type) => {
  switch (type) {
    case 'text':
      return '文本消息'
    case 'image':
      return '图片'
    case 'file':
      return '文件'
    case 'emoji':
      return '表情'
    case 'voice':
      return '语音'
    case 'video':
      return '视频'
    default:
      return '系统通知'
  }
}

// 模拟聊天记录数据
const messages = ref([
  {
    id: '1',
    text: '高科五金配送工作号15570265058, 刘里平五金水电批发 加入群聊',
    time: '2023-01-15 14:30',
    type: '系统通知',
    sender: '系统消息',
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
  },
  {
    id: '2',
    text: '今天天气不错，适合出门',
    time: '2023-01-15 14:32',
    type: '文本消息',
    sender: '张三',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
  },
  {
    id: '3',
    text: 'https://example.com',
    time: '2023-01-15 14:35',
    type: '链接',
    sender: '李四',
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
  }
])

// 过滤后的消息列表
const filteredMessages = computed(() => {
  let result = [...messages.value]

  // 搜索关键词过滤
  if (searchText.value) {
    const query = searchText.value.toLowerCase()
    result = result.filter((msg) => msg.text.toLowerCase().includes(query))
  }

  // 类型过滤（除了 date 外）
  if (activeTab.value !== 'all' && activeTab.value !== 'date') {
    result = result.filter((msg) => msg.type === getActiveTabType())
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

// 获取当前激活标签对应的消息类型
const getActiveTabType = () => {
  switch (activeTab.value) {
    case 'file':
      return '文件'
    case 'image':
      return '图片与视频'
    case 'link':
      return '链接'
    case 'audio':
      return '音乐与音频'
    case 'date':
      return '日期'
    case 'member':
      return '群成员'
    default:
      return ''
  }
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
</script>

<style scoped lang="scss">
.chat-messages-container {
  width: 100%;
  height: 100%;
  padding: 10px;
  background-color: #f5f5f5;
  box-sizing: border-box;
}

.page-title {
  margin-bottom: 20px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  position: relative;
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
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #ccc #f5f5f5;
  position: relative;
  /* 添加相对定位 */
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

.messages-list {
  flex: 1;
  overflow-y: auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #999;
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
}

.message-item {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
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

.message-type {
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
}
</style>
