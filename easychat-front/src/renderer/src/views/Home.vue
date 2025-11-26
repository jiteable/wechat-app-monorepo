<template>
  <div class="common-layout">
    <el-container class="full-height">
      <el-aside width="64px" class="aside-full-height">
        <div class="home-left">
          <div class="box"></div>
          <div class="box"></div>
          <div class="box"></div>
        </div>
      </el-aside>
      <el-container>
        <el-splitter>
          <el-splitter-panel size="30%" :min="200">
            <div>1</div>
          </el-splitter-panel>
          <el-splitter-panel :min="400">
            <div>2</div>
          </el-splitter-panel>
        </el-splitter>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from '@/store/userStore'
import { getUserInfo } from '@/api/user'

const userStore = useUserStore()

onMounted(async () => {
  // 获取用户信息并存储到userStore中
  const userInfo = await getUserInfo()
  console.log('userInfo: ', userInfo)
  if (userInfo) {
    userStore.initialUserInfo(userInfo.username, userInfo.avatar, userInfo.chatId)
  }
})
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
