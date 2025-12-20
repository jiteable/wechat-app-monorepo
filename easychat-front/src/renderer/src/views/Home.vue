<template>
  <div class="common-layout drag">
    <el-container class="full-height">
      <el-aside width="64px" class="aside-full-height">
        <div class="home-left">
          <el-avatar
            style="margin-left: 12px; margin-top: 10px"
            shape="square"
            :size="40"
            :src="squareUrl"
            @error="handleAvatarError"
          />
          <el-button class="box no-drag first-box" @click="goToChat">
            <i class="iconfont icon-chat2" :class="{ active: activeButton === 'chat' }"></i>
          </el-button>
          <el-button class="box no-drag" @click="goToContact">
            <i class="iconfont icon-user" :class="{ active: activeButton === 'contact' }"></i>
          </el-button>
          <div class="drawer-toggle-wrapper">
            <el-popover
              ref="popoverRef"
              placement="right-end"
              :width="200"
              trigger="click"
              popper-class="grid-popover"
            >
              <div class="popover-menu no-drag">
                <el-button class="menu-button" @click="handleChatFiles">聊天文件</el-button>
                <el-button class="menu-button" @click="handleChatHistory"
                  >加载历史聊天记录</el-button
                >
                <el-button class="menu-button" @click="handleSettings">设置</el-button>
                <!-- 添加退出登录按钮 -->
                <el-button class="menu-button" @click="handleLogout">退出登录</el-button>
              </div>

              <template #reference>
                <el-button class="box no-drag">
                  <el-icon :size="25">
                    <Grid />
                  </el-icon>
                </el-button>
              </template>
            </el-popover>
          </div>
        </div>
      </el-aside>
      <el-container>
        <el-splitter :key="splitterKey" class="no-drag">
          <el-splitter-panel class="drag" size="20%" :min="150">
            <router-view name="left"></router-view>
          </el-splitter-panel>
          <el-splitter-panel :min="350">
            <slot>
              <router-view name="right"></router-view>
            </slot>
          </el-splitter-panel>
        </el-splitter>
      </el-container>
    </el-container>

    <!-- 加载历史聊天记录对话框 -->
    <el-dialog v-model="chatHistoryDialogVisible" title="加载聊天记录" width="300px" center>
      <span>是否加载历史聊天记录？</span>
      <div style="margin-top: 10px; font-size: 12px; color: #999">注意：只能加载7天内的记录</div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="chatHistoryDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmLoadChatHistory">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/userStore'
import { userContactStore } from '@/store/userContactStore'
import { useUserSetStore } from '@/store/userSetStore'
import { getSessions } from '@/api/chatSession'
import { getMessages, getAllMessages } from '@/api/chat' // 更新导入
import { getUserInfo, getUserSettingInfo } from '@/api/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const userSetStore = useUserSetStore()
const contactStore = userContactStore()
const squareUrl = ref('')
const defaultAvatar = ref('')
const splitterKey = ref(0)
const router = useRouter()
const route = useRoute()
const popoverRef = ref(null)

// 控制加载聊天记录对话框显示状态
const chatHistoryDialogVisible = ref(false)

// 监听来自其他窗口的store更新事件
const handleStoreUpdate = (event) => {
  console.log('userSetStore 状态已更新:', event.detail)
  // 更新当前窗口的store状态
  userSetStore.syncFromOtherWindows(event.detail)
}

// 监听localStorage变化（备用方案）
const handleStorageChange = (event) => {
  if (event.key === 'userSetStoreUpdated') {
    try {
      const state = JSON.parse(event.newValue)
      console.log('userSetStore 状态已更新:', state)
      userSetStore.syncFromOtherWindows(state)
    } catch (e) {
      console.error('解析store状态失败:', e)
    }
  }
}

// 计算当前激活的按钮
const activeButton = computed(() => {
  if (route.path === '/' || route.path.startsWith('/chat')) {
    return 'chat'
  } else if (route.path.startsWith('/contact')) {
    return 'contact'
  }
  return ''
})

// 导航到聊天页面
const goToChat = () => {
  router.push('/chat')
}

// 导航到联系人页面
const goToContact = () => {
  router.push('/contact')
}

// 处理聊天文件按钮点击
const handleChatFiles = () => {
  console.log('聊天文件按钮被点击')
  // 关闭popover
  popoverRef.value?.hide()
  // 这里可以添加实际的功能逻辑
}

// 处理聊天记录管理按钮点击
const handleChatHistory = () => {
  console.log('聊天记录管理按钮被点击')
  // 关闭popover
  popoverRef.value?.hide()
  // 显示加载聊天记录对话框
  chatHistoryDialogVisible.value = true
}

// 确认加载聊天记录
const confirmLoadChatHistory = async () => {
  console.log('用户确认加载聊天记录')

  try {
    // 从服务器获取会话数据
    const response = await getSessions()

    if (response.success) {
      // 同步会话到本地数据库
      const syncResult = await window.api.syncChatSessions(response.data)

      if (syncResult.success) {
        console.log('聊天会话同步成功')

        // 获取用户所有消息
        let allMessagesLoaded = true

        try {
          // 一次性获取所有消息
          const messagesResponse = await getAllMessages()

          // 修复判断条件：检查响应结构中的success字段而不是整个响应对象
          if (messagesResponse && messagesResponse.data && messagesResponse.data.success) {
            console.log('获取到消息数量:', messagesResponse.data.data.length)

            // 逐个保存消息到本地数据库
            for (const message of messagesResponse.data.data) {
              try {
                // 处理文件相关信息
                let fileName = message.fileName
                let fileSize = message.fileSize
                let mimeType = message.mimeType
                let fileExtension = message.fileExtension
                let mediaUrl = message.mediaUrl
                let thumbnailUrl = message.thumbnailUrl

                // 如果消息包含文件对象，则从中提取信息
                if (message.file) {
                  fileName = message.file.name || fileName
                  fileSize = message.file.size || fileSize
                  mimeType = message.file.mimeType || mimeType
                  fileExtension = message.file.fileExtension || fileExtension
                  mediaUrl = message.file.url || mediaUrl
                  thumbnailUrl = message.file.thumbnailUrl || thumbnailUrl
                }

                // 构造消息数据对象
                const messageData = {
                  id: message.id,
                  sessionId: message.sessionId,
                  senderId: message.senderId,
                  receiverId: message.receiverId,
                  groupId: message.groupId,
                  content: message.content,
                  messageType: message.messageType,
                  mediaUrl: mediaUrl,
                  fileName: fileName,
                  fileSize: fileSize,
                  mimeType: mimeType,
                  fileExtension: fileExtension,
                  thumbnailUrl: thumbnailUrl,
                  videoInfo: message.videoInfo,
                  isRecalled: message.isRecalled || false,
                  isDeleted: message.isDeleted || false,
                  status: 'RECEIVED', // 默认设为已接收
                  readStatus: true, // 默认设为已读
                  createdAt: message.createdAt,
                  updatedAt: message.updatedAt
                }

                console.log('准备保存消息:', messageData)

                // 保存消息到本地数据库
                const result = await window.api.addUnifiedMessage(messageData)
                console.log('消息保存结果:', result)
              } catch (saveError) {
                console.error('保存单条消息失败:', saveError)
                allMessagesLoaded = false
              }
            }
          } else {
            console.error('获取所有消息失败:', messagesResponse)
            allMessagesLoaded = false
          }
        } catch (error) {
          console.error('获取所有消息时出错:', error)
          allMessagesLoaded = false
        }

        if (allMessagesLoaded) {
          ElMessage.success('聊天记录同步成功')
        } else {
          ElMessage.warning('聊天会话同步成功，但部分消息同步失败')
        }

        // 更新最后同步时间
        await window.api.setLastSyncTime(new Date())
      } else {
        console.error('同步聊天会话失败:', syncResult.error)
        ElMessage.error('聊天记录同步失败: ' + syncResult.error)
      }
    } else {
      ElMessage.error('获取聊天记录失败')
    }
  } catch (error) {
    console.error('加载聊天记录时出错:', error)
    ElMessage.error('加载聊天记录时出错: ' + (error.message || '未知错误'))
  }

  // 关闭对话框
  chatHistoryDialogVisible.value = false
}

// 处理设置按钮点击
const handleSettings = () => {
  console.log('设置按钮被点击')
  // 关闭popover
  popoverRef.value?.hide()

  // 发送消息到主进程打开设置窗口
  window.electron.ipcRenderer.send('open-set-window')
}

// 添加退出登录处理函数
const handleLogout = () => {
  console.log('退出登录按钮被点击')
  // 关闭popover
  popoverRef.value?.hide()

  // 清除本地存储的token
  localStorage.removeItem('TOKEN')

  // 清空用户store状态
  userStore.$reset()
  userSetStore.$reset()
  contactStore.$reset()

  // 关闭可能打开的其他窗口
  if (window.api) {
    // 关闭通讯录窗口
    if (typeof window.api.closeContactWindow === 'function') {
      window.api.closeContactWindow()
    }

    // 关闭添加好友窗口
    if (typeof window.api.closeAddFriendWindow === 'function') {
      window.api.closeAddFriendWindow()
    }

    // 关闭设置窗口
    if (typeof window.api.closeSetWindow === 'function') {
      window.api.closeSetWindow()
    }

    // 关闭创建群组窗口
    if (typeof window.api.closeCreateGroupWindow === 'function') {
      window.api.closeCreateGroupWindow()
    }
  }

  // 通知主进程切换到登录窗口
  window.electron.ipcRenderer.send('navigate-to-login')
}

// 初始化WebSocket连接
const initWebSocket = () => {
  console.log('wadwa')
  // 通过IPC向主进程发送初始化WebSocket的消息
  if (window.api && typeof window.api.initWebSocket === 'function') {
    console.log('wadwaaaaaaaaa')
    window.api.initWebSocket(userStore.$state.userId)
  }

  // 监听新消息
  if (window.api && typeof window.api.onNewMessage === 'function') {
    window.api.onNewMessage((data) => {
      console.log('收到新消息:', data)
      // 在这里处理新消息，比如更新聊天界面
    })
  }
}

onMounted(async () => {
  // 获取用户信息并存储到userStore中
  const userInfo = await getUserInfo()
  const userSettings = await getUserSettingInfo()
  window.addEventListener('userSetStoreUpdated', handleStoreUpdate)
  window.addEventListener('storage', handleStorageChange)

  console.log('userSetting: ', userSettings)
  if (userInfo) {
    squareUrl.value = userInfo.avatar
    console.log('1213')
    userStore.initialUserInfo(userInfo.userId, userInfo.username, userInfo.avatar, userInfo.chatId)
    console.log('userStore: ', userStore)
    // 初始化WebSocket连接
    initWebSocket()
    // 强制重新渲染 splitter 组件以避免初始化问题
    splitterKey.value += 1
  }
  // 将用户设置信息存储到userSetStore中
  if (userSettings) {
    userSetStore.updateSettings(userSettings)
  }
  onUnmounted(() => {
    window.removeEventListener('userSetStoreUpdated', handleStoreUpdate)
    window.removeEventListener('storage', handleStorageChange)

    // 移除新消息监听器
    if (window.api && typeof window.api.removeNewMessageListener === 'function') {
      window.api.removeNewMessageListener()
    }
  })
})

const handleAvatarError = () => {
  // 当头像加载失败时，使用默认头像
  squareUrl.value = defaultAvatar.value
  return true
}
</script>

<style scoped lang="scss">
.full-height {
  height: 100vh;
}

.aside-full-height {
  height: 100vh;
}

.home-left {
  background-color: rgb(247, 247, 247);
  border: 1px solid rgb(219, 219, 219);
  height: 100%;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
}

.box {
  border: 1px solid;
  width: 40px;
  height: 40px;
  margin: 10px 10px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background-color: transparent;
  border: none;
  cursor: pointer;
}

.box:hover {
  background-color: #e0e0e0;
  transform: scale(1.05);
}

.box:active {
  transform: scale(0.95);
}

.first-box {
  margin-top: 20px;
}

.drawer-toggle-wrapper {
  margin-top: auto;
  margin-left: 2px;
}

.icon-chat2 {
  font-size: 24px;
}

.icon-chat2.active {
  color: rgb(7, 193, 96);
}

.icon-user {
  font-size: 24px;
  color: #333;
}

.icon-user.active {
  color: rgb(7, 193, 96);
}

.popover-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-button {
  margin-left: 0px;
  border: none;
  width: 100%;
  justify-content: flex-start;
  padding: 10px 15px;
  text-align: left;
  transition: all 0.2s ease;
}

.menu-button:hover {
  background-color: rgb(7, 193, 96);
  color: white;
}

.menu-button:active {
  background-color: rgb(6, 174, 86);
  color: white;
  transform: scale(0.98);
}
</style>
