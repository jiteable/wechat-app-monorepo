<template>
  <div class="chat-container">
    <div class="chat-title">
      <div class="search-box">
        <el-input class="no-drag search-input" v-model="searchText" placeholder="搜索" clearable prefix-icon="Search" />
      </div>
      <div class="add-button no-drag">
        <el-popover placement="bottom" :width="120" trigger="click" popper-class="chat-popover">
          <template #reference>
            <el-button class="add-btn">
              <el-icon>
                <Plus />
              </el-icon>
            </el-button>
          </template>
          <div class="popover-content">
            <div class="popover-item" @click="handleCreateGroup">
              <el-button link class="no-drag">
                <el-icon>
                  <Avatar />
                </el-icon>
                发起群聊
              </el-button>
            </div>
            <div class="popover-item" @click="handleAddFriend">
              <el-button link class="no-drag">
                <el-icon>
                  <User />
                </el-icon>
                添加好友
              </el-button>
            </div>
          </div>
        </el-popover>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Plus, User, Avatar } from '@element-plus/icons-vue'

const searchText = ref('')

const handleCreateGroup = () => {
  console.log('发起群聊')
  // 打开创建群组窗口
  if (window.api) {
    window.api.openCreateGroupWindow()
  }
}

const handleAddFriend = () => {
  console.log('添加好友')
  // 创建新窗口用于添加好友
  if (window.api) {
    window.api.openAddFriendWindow()
  }
}
</script>

<style scoped>
.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-title {
  border-bottom: 1px solid #e0e0e0;
  height: 80px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 5px;
  background-color: #ffffff;
}

.search-box {
  width: 100%;
}

.search-input {
  border-radius: 10px;
}

.add-button {
  margin-left: 8px;
}

.add-btn {
  width: 40px;
  height: 40px;
  border-radius: 5px;
  background-color: rgb(234, 234, 234);
  border: none;
  color: rgb(165, 165, 165);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.add-btn:hover {
  background-color: rgb(220, 220, 220);
  transform: scale(1.05);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.popover-content {
  padding: 5px 0;
}

.popover-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 15px;
  cursor: pointer;
  font-size: 14px;
  color: var(--el-text-color-regular);
  transition: background-color 0.2s;
  justify-content: flex-start;
}

.popover-item:hover {
  background-color: #f5f7fa;
}

/* 移除 Element Plus link button 的默认 margin */
.popover-item :deep(.el-button--link) {
  margin-left: 0 !important;
}

.popover-item .el-icon {
  margin-right: 8px;
  font-size: 16px;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

:deep(.chat-popover) {
  border-radius: 8px;
  padding: 0;
  border: 1px solid #ebeef5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 120px;
}
</style>
