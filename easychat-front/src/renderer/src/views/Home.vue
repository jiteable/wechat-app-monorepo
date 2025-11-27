<template>
  <div class="common-layout drag">
    <el-container class="full-height">
      <el-aside width="64px" class="aside-full-height">
        <div class="home-left">
          <el-avatar style="margin-left: 5px;" shape="square" :size="50" :src="squareUrl" @error="handleAvatarError" />
          <div class="box"></div>
          <div class="box"></div>
        </div>
      </el-aside>
      <el-container>
        <el-splitter :key="splitterKey">
          <el-splitter-panel class="drag" size="30%" :min="200">
            <Chat />
          </el-splitter-panel>
          <el-splitter-panel class="drag" :min="400">
            <slot>
              <ChatContant />
            </slot>
          </el-splitter-panel>
        </el-splitter>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useUserStore } from '@/store/userStore'
import { getUserInfo } from '@/api/user'
import Chat from '@/views/chat/Chat.vue'
import ChatContant from '@/views/chatContant/ChatContant.vue'

const userStore = useUserStore()
const squareUrl = ref('')
const defaultAvatar = ref('')
const splitterKey = ref(0)

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
  background-color: rgb(198, 199, 202);
  border: 1px solid rgb(189, 190, 193);
  height: 100%;
  padding: 10px 0;
}

.box {
  background-color: black;
  width: 42px;
  height: 42px;
  margin: 10px 10px;
  border-radius: 5px;
}
</style>
