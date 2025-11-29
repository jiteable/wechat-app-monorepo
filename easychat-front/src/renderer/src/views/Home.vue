<template>
  <div class="common-layout drag">
    <el-container class="full-height">
      <el-aside width="64px" class="aside-full-height">
        <div class="home-left">
          <el-avatar style="margin-left: 12px; margin-top: 10px" shape="square" :size="40" :src="squareUrl"
            @error="handleAvatarError" />
          <el-button class="box no-drag first-box" :class="{ 'active': activeButton === 'chat' }" @click="goToChat">
            <i class="iconfont icon-chat2"></i>
          </el-button>
          <el-button class="box no-drag" :class="{ 'active': activeButton === 'contact' }" @click="goToContact">
            <i class="iconfont icon-user"></i>
          </el-button>
          <div class="drawer-toggle-wrapper">
            <el-popover ref="popoverRef" placement="right-end" :width="200" trigger="click" popper-class="grid-popover">
              <div class="popover-menu no-drag">
                <el-button class="menu-button" @click="handleChatFiles">聊天文件</el-button>
                <el-button class="menu-button" @click="handleChatHistory">聊天记录管理</el-button>
                <el-button class="menu-button" @click="handleSettings">设置</el-button>
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
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Grid } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/userStore'
import { useUserSetStore } from '@/store/userSetStore'
import { getUserInfo } from '@/api/user'
import { getUserSettingInfo } from '@/api/user'

const userStore = useUserStore()
const squareUrl = ref('')
const defaultAvatar = ref('')
const splitterKey = ref(0)
const router = useRouter()
const route = useRoute()
const popoverRef = ref(null)

// 计算当前激活的按钮
const activeButton = computed(() => {
  if (route.path === '/' || route.path === '/chat') {
    return 'chat'
  } else if (route.path === '/contact') {
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
  // 这里可以添加实际的功能逻辑
}

// 处理设置按钮点击
const handleSettings = () => {
  console.log('设置按钮被点击')
  // 关闭popover
  popoverRef.value?.hide()

  // 发送消息到主进程打开设置窗口
  window.electron.ipcRenderer.send('open-set-window')
}

onMounted(async () => {
  // 获取用户信息并存储到userStore中
  const userInfo = await getUserInfo()
  const userSettings = await getUserSettingInfo()
  console.log('userSetting: ', userSettings)
  if (userInfo) {
    squareUrl.value = userInfo.avatar
    userStore.initialUserInfo(userInfo.username, userInfo.avatar, userInfo.chatId)
    // 强制重新渲染 splitter 组件以避免初始化问题
    splitterKey.value += 1
  }
  // 将用户设置信息存储到userSetStore中
  if (userSettings) {
    const userSetStore = useUserSetStore()
    userSetStore.updateSettings(userSettings)
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
  background-color: rgb(247, 247, 247);
  border: 1px solid rgb(219,
      219,
      219);
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
  cursor: pointer;
}

.box:hover {
  background-color: #e0e0e0;
  transform: scale(1.05);
}

.box:active {
  transform: scale(0.95);
}

.box.active {
  background-color: #409eff;
  color: white;
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

.icon-user {
  font-size: 24px;
  color: #333;
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
