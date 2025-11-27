<template>
  <div class="common-layout drag">
    <el-container class="full-height">
      <el-aside width="64px" class="aside-full-height">
        <div class="home-left">
          <el-avatar style="margin-left: 12px; margin-top: 10px" shape="square" :size="40" :src="squareUrl"
            @error="handleAvatarError" />
          <el-button class="box no-drag first-box" :style="{ backgroundColor: activeButton === 'chat' ? 'green' : '' }"
            @click="goToChat">
            <i class="iconfont icon-chat2"></i>
          </el-button>
          <el-button class="box no-drag" :style="{ backgroundColor: activeButton === 'contact' ? 'green' : '' }"
            @click="goToContact">
            <i class="iconfont icon-user"></i>
          </el-button>
          <div class="drawer-toggle-wrapper">
            <el-button class="box no-drag" @click="toggleDrawer">
              <el-icon :size="25">
                <Grid />
              </el-icon>
            </el-button>
          </div>
        </div>
      </el-aside>
      <el-container>
        <el-splitter :key="splitterKey" class="no-drag">
          <el-splitter-panel class="drag" size="20%" :min="150">
            <router-view name="left"></router-view>
          </el-splitter-panel>
          <el-splitter-panel class="drag" :min="350">
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
import { getUserInfo } from '@/api/user'

const userStore = useUserStore()
const squareUrl = ref('')
const defaultAvatar = ref('')
const splitterKey = ref(0)
const router = useRouter()
const route = useRoute()

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

// 抽屉切换功能
const toggleDrawer = () => {
  // 这里可以添加实际的抽屉切换逻辑
  console.log('Toggle drawer button clicked')
}

onMounted(async () => {
  // 获取用户信息并存储到userStore中
  const userInfo = await getUserInfo()
  console.log('userInfo: ', userInfo)
  if (userInfo) {
    squareUrl.value = userInfo.avatar
    userStore.initialUserInfo(userInfo.username, userInfo.avatar, userInfo.chatId)
    // 强制重新渲染 splitter 组件以避免初始化问题
    splitterKey.value += 1
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
</style>
