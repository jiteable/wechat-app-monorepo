<template>
  <div class="chat-messages-container drag">
    <!-- 页面标题 -->
    <div class="page-title">
      <span class="title-text">“{{ chatTitle }}”的聊天记录({{ messageCount }})</span>
    </div>

    <!-- 搜索框 -->
    <div class="search-box">
      <el-input class="no-drag search-input" v-model="searchText" placeholder="搜索" clearable prefix-icon="Search" />
    </div>

    <!-- 分类标签 -->
    <div class="category-tabs no-drag">
      <button v-for="tab in tabs" :key="tab.id" :class="['category-tab', { active: activeTab === tab.id }]"
        @click="switchTab(tab.id)">
        {{ tab.name }}
      </button>
    </div>

    <!-- 聊天记录列表 -->
    <div class="messages-list">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="filteredMessages.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
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

      <div v-for="message in filteredMessages" v-else :key="message.id" class="message-item">
        <div class="message-content">
          <div class="message-text">{{ message.text }}</div>
          <div class="message-meta">
            <span class="message-time">{{ message.time }}</span>
            <span class="message-type">{{ message.type }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 页面标题和消息数量
const chatTitle = ref('妈妈、刘里平五金水电批发')
const messageCount = ref(3)

// 搜索相关
const searchQuery = ref('')
const loading = ref(false)

// 分类标签
const tabs = ref([
  { id: 'file', name: '文件' },
  { id: 'image', name: '图片与视频' },
  { id: 'link', name: '链接' },
  { id: 'audio', name: '音乐与音频' },
  { id: 'miniProgram', name: '小程序' },
  { id: 'videoAccount', name: '视频号' },
  { id: 'date', name: '日期' },
  { id: 'member', name: '群成员' }
])

const activeTab = ref('file')

// 模拟聊天记录数据
const messages = ref([
  {
    id: '1',
    text: '高科五金配送工作号15570265058, 刘里平五金水电批发 加入群聊',
    time: '2023-01-15 14:30',
    type: '系统通知'
  },
  {
    id: '2',
    text: '今天天气不错，适合出门',
    time: '2023-01-15 14:32',
    type: '文本消息'
  },
  {
    id: '3',
    text: 'https://example.com',
    time: '2023-01-15 14:35',
    type: '链接'
  }
])

// 过滤后的消息列表
const filteredMessages = computed(() => {
  if (!searchQuery.value) {
    return messages.value.filter((msg) => msg.type === getActiveTabType())
  }

  const query = searchQuery.value.toLowerCase()
  return messages.value.filter(
    (msg) => msg.text.toLowerCase().includes(query) && msg.type === getActiveTabType()
  )
})

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
    case 'miniProgram':
      return '小程序'
    case 'videoAccount':
      return '视频号'
    case 'date':
      return '日期'
    case 'member':
      return '群成员'
    default:
      return '文件'
  }
}

// 切换标签
const switchTab = (tabId: string) => {
  activeTab.value = tabId
}

// 处理搜索
const handleSearch = () => {
  // 可以在这里添加搜索逻辑
  console.log('搜索:', searchQuery.value)
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

.search-input {
  border-radius: 10px;
}

.page-title {
  margin-bottom: 20px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.search-bar {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  position: relative;
}

.search-icon {
  margin-right: 10px;
  color: #999;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  padding: 8px;
  background: transparent;
  color: #333;
}

.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #ccc #f5f5f5;
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

.message-content {
  display: flex;
  flex-direction: column;
}

.message-text {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.message-time {
  margin-right: 8px;
}

.message-type {
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
}
</style>
