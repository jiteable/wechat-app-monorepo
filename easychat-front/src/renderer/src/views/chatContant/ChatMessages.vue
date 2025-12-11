<template>
  <div class="chat-messages-container drag">
    <!-- 页面标题 -->
    <div class="page-title">
      <span class="title-text">“{{ chatTitle }}”的聊天记录({{ messageCount }})</span>
    </div>

    <!-- 搜索框 -->
    <div class="search-box no-drag" :class="{ focused: isSearchFocused }">
      <!-- 搜索图标 -->
      <el-icon class="search-icon">
        <Search />
      </el-icon>

      <!-- 普通输入框 -->
      <input class="no-drag search-input" v-model="searchText" placeholder="搜索" @input="handleSearch"
        @focus="isSearchFocused = true" @blur="isSearchFocused = false" />

      <!-- 标签显示区域（在输入框内部） -->
      <div v-if="activeTab !== 'all'" class="tag-container" slot="suffix">
        <div class="tag-item">
          <span class="tag-text">{{ getActiveTabName() }}</span>
          <span class="tag-close" @click="clearTag">×</span>
        </div>
      </div>
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
import { ref, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'

// 页面标题和消息数量
const chatTitle = ref('妈妈、刘里平五金水电批发')
const messageCount = ref(3)

// 搜索相关
const searchText = ref('')
const loading = ref(false)
const isSearchFocused = ref(false)

// 分类标签
const tabs = ref([
  { id: 'all', name: '全部' },
  { id: 'file', name: '文件' },
  { id: 'image', name: '图片与视频' },
  { id: 'link', name: '链接' },
  { id: 'audio', name: '音乐与音频' },
  { id: 'date', name: '日期' },
  { id: 'member', name: '群成员' }
])

const activeTab = ref('all')

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
  if (!searchText.value) {
    return messages.value.filter((msg) => {
      if (activeTab.value === 'all') return true;
      return msg.type === getActiveTabType();
    });
  }

  const query = searchText.value.toLowerCase();
  return messages.value.filter(
    (msg) => {
      const matchesSearch = msg.text.toLowerCase().includes(query);
      if (activeTab.value === 'all') return matchesSearch;
      return matchesSearch && msg.type === getActiveTabType();
    }
  );
})

// 按时间排序的消息列表（最新的在上面）
const sortedMessages = computed(() => {
  // 先过滤消息，再按时间排序
  return [...filteredMessages.value].sort((a, b) => {
    // 将时间字符串转换为时间戳进行比较
    const timeA = new Date(a.time).getTime();
    const timeB = new Date(b.time).getTime();
    // 降序排列（最新的在前面）
    return timeB - timeA;
  });
});

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
  const tab = tabs.value.find(t => t.id === activeTab.value)
  return tab ? tab.name : '全部'
}

// 切换标签
const switchTab = (tabId: string) => {
  activeTab.value = tabId
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
</script>

<style scoped lang="scss">
.chat-messages-container {
  width: 100%;
  height: 100%;
  padding: 10px;
  background-color: #f5f5f5;
  box-sizing: border-box;
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

.page-title {
  margin-bottom: 20px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
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
