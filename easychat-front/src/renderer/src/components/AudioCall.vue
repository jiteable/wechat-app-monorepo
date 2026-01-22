<template>
  <div class="audio-call-container">
    <div class="call-header">
      <h2>音频通话</h2>
    </div>

    <div class="call-content">
      <div class="avatar-wrapper">
        <img :src="avatar" alt="Avatar" class="avatar" />
      </div>

      <div class="contact-info">
        <p class="contact-name">{{ contactName }}</p>
        <p class="call-status">{{ callStatus }}</p>
      </div>
    </div>

    <!-- 通话控制按钮 -->
    <div class="call-controls" v-if="!callStarted">
      <button class="control-btn accept-btn" @click="acceptCall">
        <el-icon>
          <Phone />
        </el-icon>
      </button>

      <button class="control-btn decline-btn" @click="declineCall">
        <el-icon>
          <Close />
        </el-icon>
      </button>
    </div>

    <!-- 通话开始后的关闭按钮 -->
    <div class="call-controls-centered" v-else>
      <button class="control-btn decline-btn" @click="endCall">
        <el-icon>
          <PhoneFilled />
        </el-icon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Check, Close } from '@element-plus/icons-vue'

const props = defineProps({
  contactName: {
    type: String,
    default: '联系人'
  },
  avatar: {
    type: String,
    default: ''
  }
})

const callStatus = ref('正在等待接听...')
const callStarted = ref(false)

const acceptCall = () => {
  callStatus.value = '通话中...'
  callStarted.value = true
  // 实现接受通话逻辑
}

const declineCall = () => {
  // 实现拒绝通话逻辑
  window.close()
}

const endCall = () => {
  // 结束通话
  window.close()
}

// 监听通话状态变化
onMounted(() => {
  // 初始化音频通话逻辑
})

onUnmounted(() => {
  // 清理资源
})
</script>

<style scoped>
.audio-call-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #f5f5f5;
}

.call-header {
  width: 100%;
  text-align: center;
}

.call-header h2 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.call-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  justify-content: center;
}

.avatar-wrapper {
  margin-bottom: 20px;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 5px solid #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.contact-info {
  text-align: center;
}

.contact-name {
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 10px 0;
  color: #333;
}

.call-status {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.call-controls {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 20px;
}

.call-controls-centered {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.control-btn {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  color: white;
  transition: transform 0.2s;
}

.control-btn:hover {
  transform: scale(1.1);
}

.accept-btn {
  background-color: #67c23a;
}

.decline-btn {
  background-color: #f56c6c;
}
</style>
