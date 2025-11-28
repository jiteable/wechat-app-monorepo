<template>
  <div class="add-friend-container">
    <div class="add-friend-header drag">
      <div class="header-title">添加好友</div>
      <div class="window-controls no-drag">
        <el-button link class="control-button" @click="closeWindow">
          <i class="iconfont icon-close"></i>
        </el-button>
      </div>
    </div>

    <div class="add-friend-content">
      <div class="search-section">
        <el-input v-model="searchText" placeholder="请输入ChatID/邮箱/用户名" class="search-input" @keyup.enter="handleSearch">
          <template #suffix>
            <el-icon class="search-icon" @click="handleSearch">
              <Search />
            </el-icon>
          </template>
        </el-input>
      </div>

      <div v-if="loading" class="loading">
        <el-skeleton :rows="3" animated />
      </div>

      <div class="search-results" v-else-if="searchResults.length > 0">
        <div class="result-item" v-for="user in searchResults" :key="user.id" @click="selectUser(user)">
          <el-avatar :size="40" :src="user.avatar || ''" shape="square" />
          <div class="user-info">
            <div class="user-name">{{ user.username }}</div>
            <div class="user-id">ChatID: {{ user.chatId }}</div>
          </div>
          <div class="action-button">
            <el-button size="small" :type="user.isFriend ? 'success' : 'primary'" :disabled="user.isFriend" round
              @click.stop="addFriend(user)">
              {{ user.isFriend ? '已添加' : '添加' }}
            </el-button>
          </div>
        </div>
      </div>

      <div class="no-results" v-else-if="searched && searchResults.length === 0 && !loading">
        未找到相关用户
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { searchUser } from '@/api/search'

const searchText = ref('')
const searchResults = ref([])
const searched = ref(false)
const loading = ref(false)

const handleSearch = async () => {
  if (searchText.value.trim()) {
    console.log('搜索用户:', searchText.value)
    loading.value = true
    try {
      const response = await searchUser({ query: searchText.value.trim() })
      searchResults.value = response.users
      searched.value = true
    } catch (error) {
      console.error('搜索用户失败:', error)
      searchResults.value = []
      searched.value = true
    } finally {
      loading.value = false
    }
  }
}

const selectUser = (user) => {
  console.log('选中用户:', user)
  // 这里可以添加选中用户的逻辑
}

const addFriend = (user) => {
  if (!user.isFriend) {
    console.log('添加好友:', user)
    // 这里可以添加添加好友的逻辑
    user.isFriend = true
  }
}

const closeWindow = () => {
  window.electron.ipcRenderer.send('close-add-friend-window')
}
</script>

<style scoped>
.add-friend-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.add-friend-header {
  height: 60px;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #333333;
}

.window-controls {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 5px;
}

.control-button {
  font-size: 14px;
  color: rgb(153, 153, 153);
  width: 24px;
  height: 24px;
}

.control-button:hover {
  color: #333333;
  background-color: rgb(240, 240, 240);
  border-radius: 4px;
}

.add-friend-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.search-section {
  margin-bottom: 20px;
}

.search-input {
  border-radius: 20px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 20px;
  box-shadow: 0 0 0 1px rgb(224, 224, 224) inset;
}

.search-icon {
  cursor: pointer;
  color: #999999;
  font-size: 18px;
}

.loading {
  background-color: rgb(255, 255, 255);
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-results {
  background-color: rgb(255, 255, 255);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.result-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid hsl(0, 0%, 94%);
  cursor: pointer;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background-color: rgb(249, 249, 249);
}

.user-info {
  flex: 1;
  margin: 0 15px;
  overflow: hidden;
}

.user-name {
  font-size: 15px;
  color: #333333;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-id {
  font-size: 12px;
  color: rgb(153, 153, 153);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-button {
  flex-shrink: 0;
}

.no-results {
  text-align: center;
  padding: 30px;
  color: #999999;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
</style>