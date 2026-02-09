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
          <el-button
            class="box no-drag first-box"
            :class="{ active: currentView === 'chat' }"
            @click="goToChat"
          >
            <i class="iconfont icon-chat2" :class="{ active: currentView === 'chat' }"></i>
          </el-button>
          <el-button
            class="box no-drag"
            :class="{ active: currentView === 'contact' }"
            @click="goToContact"
          >
            <i class="iconfont icon-user" :class="{ active: currentView === 'contact' }"></i>
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
                <el-button class="menu-button" @click="handleChatHistory">聊天记录管理</el-button>
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
            <KeepAlive>
              <component :is="currentLeftComponent" />
            </KeepAlive>
          </el-splitter-panel>
          <el-splitter-panel :min="350">
            <slot>
              <component :is="currentRightComponent" v-if="currentRightComponent" />
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
import { ref, computed, onMounted, onUnmounted, shallowRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/userStore'
import { userContactStore } from '@/store/userContactStore'
import { useUserSetStore } from '@/store/userSetStore'
import { getSessions } from '@/api/chatSession'
import { getAllMessages } from '@/api/chat' // 更新导入
import { getUserInfo, getUserSettingInfo } from '@/api/user'
import { ElMessage } from 'element-plus'
import Chat from '@/views/chat/Chat.vue'
import Contact from '@/views/contact/Contact.vue'
import ChatContant from '@/views/chatContant/ChatContant.vue'
import ContactContent from '@/views/contactContent/ContactContent.vue'
import ContactApply from '@/views/contactContent/ContactApply.vue'

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

// 动态组件
const currentLeftComponent = shallowRef()
const currentRightComponent = shallowRef()

// 监听路由变化并动态设置组件
const updateComponentForRoute = () => {
  const path = route.path
  if (path.startsWith('/contact')) {
    if (path === '/contact/apply') {
      currentLeftComponent.value = Contact
      currentRightComponent.value = ContactApply
    } else {
      currentLeftComponent.value = Contact
      currentRightComponent.value = ContactContent
    }
  } else if (path.startsWith('/chat')) {
    currentLeftComponent.value = Chat
    currentRightComponent.value = ChatContant
  } else {
    // 默认显示chat
    currentLeftComponent.value = Chat
    currentRightComponent.value = ChatContant
  }
}

// 监听来自其他窗口的store更新事件
const handleStoreUpdate = (event) => {
  console.log('userSetStore 状态已更新:', event.detail)
  // 更新当前窗口的store状态
  userSetStore.syncFromOtherWindows(event.detail)
}

const handleSettingsUpdated = () => {
  console.log('设置已更新，当前设置为：', userSetStore.$state)
  // 打印每个设置项的具体值
  console.log('新消息通知是否有声音:', userSetStore.newMessageSound)
  console.log('加我为朋友时是否需要验证:', userSetStore.needVerificationToAddFriend)
  console.log('是否能够通过chatId搜索到我:', userSetStore.canBeSearchedByChatId)
  console.log('是否能够通过邮箱搜索到我:', userSetStore.canBeSearchedByEmail)
  console.log('是否能通过群聊添加我:', userSetStore.canAddFromGroup)
  console.log('语言设置:', userSetStore.language)
  console.log('字体大小设置:', userSetStore.fontSize)
  console.log('是否以只读方式打开聊天中的文件:', userSetStore.openFileInReadonlyMode)
  console.log('是否显示网络搜索历史:', userSetStore.showWebSearchHistory)
  console.log('是否将聊天语音自动转成文字:', userSetStore.autoConvertVoiceToText)
  console.log('文件下载路径:', userSetStore.StorageLocation)
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

const currentView = computed(() => {
  if (route.path === '/' || route.path.startsWith('/chat')) {
    return 'chat'
  } else if (route.path.startsWith('/contact')) {
    return 'contact'
  }
  return 'chat' // 默认为chat
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
        let allChatSessionUsersLoaded = true

        try {
          // 一次性获取所有消息
          const messagesResponse = await getAllMessages()

          // 同步所有消息到本地数据库
          if (messagesResponse && messagesResponse.data && messagesResponse.data.success) {
            console.log('获取到消息:', messagesResponse.data.data)

            // 使用syncUnifiedMessages一次性同步所有消息
            const syncMessagesResult = await window.api.syncUnifiedMessages(
              messagesResponse.data.data
            )
            if (!syncMessagesResult.success) {
              allMessagesLoaded = false
              console.error('同步消息数据失败:', syncMessagesResult.error)
            }
          } else {
            console.error('获取所有消息失败:', messagesResponse)
            allMessagesLoaded = false
          }
        } catch (error) {
          console.error('获取所有消息时出错:', error)
          allMessagesLoaded = false
        }

        // 同步ChatSessionUser数据
        try {
          const { getSessionUsers } = await import('@/api/chatSession')
          const chatSessionUsersResponse = await getSessionUsers()

          if (chatSessionUsersResponse && chatSessionUsersResponse.success) {
            console.log('chatSessionUsersResponse.data:', chatSessionUsersResponse.data)
            const syncChatSessionUsersResult = await window.api.syncChatSessionUsers(
              chatSessionUsersResponse.data
            )
            if (!syncChatSessionUsersResult.success) {
              allChatSessionUsersLoaded = false
              console.error('同步ChatSessionUser数据失败:', syncChatSessionUsersResult.error)
            }
          } else {
            allChatSessionUsersLoaded = false
            console.error('获取ChatSessionUser数据失败:', chatSessionUsersResponse)
          }
        } catch (error) {
          console.error('同步ChatSessionUser数据时出错:', error)
          allChatSessionUsersLoaded = false
        }

        let message = ''
        if (allMessagesLoaded && allChatSessionUsersLoaded) {
          message = '聊天记录同步成功'
        } else if (allMessagesLoaded && !allChatSessionUsersLoaded) {
          message = '消息同步成功，但会话用户信息同步失败'
        } else if (!allMessagesLoaded && allChatSessionUsersLoaded) {
          message = '会话用户信息同步成功，但部分消息同步失败'
        } else {
          message = '聊天记录同步完成，但部分数据同步失败'
        }

        ElMessage.success(message)

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

  // 刷新整个页面
  window.location.reload()
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

    // 关闭音频通话窗口
    if (typeof window.api.closeAudioCallWindow === 'function') {
      window.api.closeAudioCallWindow()
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
  // 监听路由变化
  updateComponentForRoute() // 初始化
  router.afterEach(() => {
    updateComponentForRoute() // 路由变化后更新组件
  })

  // 获取用户信息并存储到userStore中
  const userInfo = await getUserInfo()
  const userSettings = await getUserSettingInfo()
  window.addEventListener('userSetStoreUpdated', handleStoreUpdate)
  window.addEventListener('storage', handleStorageChange)

  // 添加监听设置更新事件
  if (window.api && typeof window.api.onSettingsUpdated === 'function') {
    window.api.onSettingsUpdated(handleSettingsUpdated)
  }

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
})

onUnmounted(() => {
  window.removeEventListener('userSetStoreUpdated', handleStoreUpdate)
  window.removeEventListener('storage', handleStorageChange)

  // 移除新消息监听器
  if (window.api && typeof window.api.removeNewMessageListener === 'function') {
    window.api.removeNewMessageListener()
  }

  // 移除设置更新监听器
  if (window.api && typeof window.api.removeSettingsUpdatedListener === 'function') {
    window.api.removeSettingsUpdatedListener()
  }
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
  background-color: rgb(232, 231, 231);
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
