<template>
  <div class="contacts-management drag">
    <div class="content">
      <el-splitter class="no-drag">
        <el-splitter-panel size="30%" :min="160" class="content-left">
          <div class="panel-content">
            <div class="left-header drag">通讯录管理</div>
            <div class="left-content">
              <el-button class="button" :class="{ active: activeButton === 'all' }" @click="handleButtonClick('all')">
                <span class="button-text1">全部()</span>
              </el-button>
              <div class="filter-section">
                <div class="filter-label">筛选</div>
                <el-button class="button no-active" @click="toggleIcon('friend')">
                  <span class="button-text1">朋友权限</span>
                  <el-icon class="arrow-icon">
                    <component :is="iconStates.friend ? 'ArrowDown' : 'ArrowRight'" />
                  </el-icon>
                </el-button>

                <!-- 添加的朋友权限列表 -->
                <div v-show="iconStates.friend" class="friend-authority-list">
                  <el-button v-for="item in friendAuthorityList" :key="item.id" class="button authority-item-button"
                    @click="selectAuthority(item)">
                    <span class="button-text2">{{ item.name }}</span>
                  </el-button>
                </div>

                <el-button class="button no-active" @click="toggleIcon('tag')">
                  <span class="button-text1">标签</span>
                  <el-icon class="arrow-icon">
                    <component :is="iconStates.tag ? 'ArrowDown' : 'ArrowRight'" />
                  </el-icon>
                </el-button>

                <!-- 添加的标签列表 -->
                <div v-show="iconStates.tag" class="label-list">
                  <el-button v-for="item in labelList" :key="item.id" class="button label-item-button"
                    @click="selectLabel(item)">
                    <span class="button-text2">{{ item.name }}</span>
                  </el-button>
                </div>

                <el-button class="button no-active" @click="toggleIcon('group')">
                  <span class="button-text1">最近群聊</span>
                  <el-icon class="arrow-icon">
                    <component :is="iconStates.group ? 'ArrowDown' : 'ArrowRight'" />
                  </el-icon>
                </el-button>

                <!-- 添加的群聊列表 -->
                <div v-show="iconStates.group" class="chat-group-list">
                  <el-button v-for="item in chatGroupList" :key="item.id" class="button group-item-button"
                    @click="selectGroup(item)">
                    <img :src="item.avatar" :alt="item.name" class="group-avatar button-text2" />
                    <span class="button-text1 group-name">{{ item.name }}</span>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-splitter-panel>
        <el-splitter-panel :min="380" class="content-right">
          <div class="panel-content">
            <div class="right-header drag">
              <div class="header-text">详细信息</div>
              <div class="window-controls">
                <button class="control-button minimize no-drag" @click="minimizeWindow">
                  <el-icon>
                    <Minus />
                  </el-icon>
                </button>
                <button class="control-button close no-drag" @click="closeWindow">
                  <el-icon>
                    <Close />
                  </el-icon>
                </button>
              </div>
            </div>
            <div class="right-content">右侧内容区域</div>
          </div>
        </el-splitter-panel>
      </el-splitter>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Minus, Close } from '@element-plus/icons-vue'

const activeButton = ref('all')

const iconStates = reactive({
  friend: false,
  tag: false,
  group: false
})

// 朋友权限列表数据
const friendAuthorityList = ref([
  { id: 1, name: '仅聊天' },
  { id: 2, name: '不让他(她)看' },
  { id: 3, name: '不看他(她)' }
])

// 标签列表数据
const labelList = ref([
  { id: 1, name: '无标签' },
  { id: 2, name: '未命名' }
])

// 群聊列表数据
const chatGroupList = ref([
  {
    id: 1,
    name: '技术交流群',
    avatar:
      'https://file-dev.document-ai.top/avatar/chatImage/%E9%BB%98%E8%AE%A4%E5%A4%B4%E5%83%8F.jpg'
  },
  {
    id: 2,
    name: '家庭群',
    avatar:
      'https://file-dev.document-ai.top/avatar/chatImage/%E9%BB%98%E8%AE%A4%E5%A4%B4%E5%83%8F.jpg'
  },
  {
    id: 3,
    name: '同学群',
    avatar:
      'https://file-dev.document-ai.top/avatar/chatImage/%E9%BB%98%E8%AE%A4%E5%A4%B4%E5%83%8F.jpg'
  }
])

const minimizeWindow = () => {
  window.electron.ipcRenderer.send('minimize-contact-window')
}

const closeWindow = () => {
  window.electron.ipcRenderer.send('close-contact-window')
}

const handleButtonClick = (buttonType) => {
  activeButton.value = buttonType
}

const toggleIcon = (buttonType) => {
  iconStates[buttonType] = !iconStates[buttonType]
}

// 选择权限处理函数
const selectAuthority = (item) => {
  console.log('选择了权限:', item.name)
  // 这里可以添加实际的业务逻辑
}

// 选择标签处理函数
const selectLabel = (item) => {
  console.log('选择了标签:', item.name)
  // 这里可以添加实际的业务逻辑
}

// 选择群聊处理函数
const selectGroup = (item) => {
  console.log('选择了群聊:', item.name)
  // 这里可以添加实际的业务逻辑
}
</script>

<style scoped lang="scss">
.contacts-management {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.window-header {
  height: 40px;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  padding: 0 10px;
  border-bottom: 1px solid #e0e0e0;
}

.header-title {
  font-weight: bold;
  color: #333;
}

.content {
  flex: 1;
  overflow: hidden;
}

.content-left {
  border-right: 1px solid rgb(237, 237, 237);
}

.panel-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: rgb(237, 237, 237);
}

.left-header {
  height: 40px;
  background-color: rgb(237, 237, 237);
  display: flex;
  align-items: center;
  padding: 0 10px;
}

.right-header {
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  justify-content: space-between;
  background-color: white;
}

.header-text {
  font-weight: bold;
  color: #333;
}

.left-content {
  flex: 1;
  margin-top: 20px;
  overflow-y: auto;
}

.right-content {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  background-color: white;
}

.window-controls {
  display: flex;
  gap: 5px;
}

.control-button {
  width: 30px;
  height: 25px;
  border: none;
  background-color: transparent;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-button:hover {
  background-color: #f0f0f0;
}

.button {
  width: 100%;
  height: 38px;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgb(237, 237, 237);
  border: none;
  padding: 0 16px;
  position: relative;
  font-size: 14px;
  cursor: pointer;
  margin-left: 0 !important;
}

.arrow-icon {
  font-size: 16px;
  color: #999;
  margin-left: 30px;
  position: absolute;
  right: 10px;
}

.button+.button {
  margin-left: 0 !important;
}

.button.active {
  background-color: rgb(225, 225, 225);
}

.button.active:hover {
  background-color: rgb(214, 214, 214);
}

.button:hover:not(.active) {
  background-color: rgb(225, 225, 225);
}

.no-active:hover {
  background-color: rgb(237, 237, 237) !important;
}

.no-active.active {
  background-color: rgb(237, 237, 237) !important;
}

.friend-authority-list {
  overflow: hidden;
}

.label-list {
  overflow: hidden;
}

.chat-group-list {
  overflow: hidden;
}

.authority-item-button {
  height: 48px;
  border-radius: 0;
  border: none;
  justify-content: flex-start;
}

.label-item-button {
  height: 48px;
  border-radius: 0;
  border: none;
  justify-content: flex-start;
}

.group-item-button {
  height: 48px;
  border-radius: 0;
  border: none;
  justify-content: flex-start;
}

.group-avatar {
  width: 36px;
  height: 36px;
  margin-right: 12px;
}

.group-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-label {
  font-size: 12px;
  margin-top: 8px;
  padding-left: 15px;
  color: rgb(175, 175, 175);
}

.button-text2 {
  margin-left: 15px;
}
</style>
