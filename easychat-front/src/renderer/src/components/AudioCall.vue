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

    <div class="call-controls">
      <button class="control-btn accept-btn" @click="acceptCall">
        <i class="icon-accept"></i>
      </button>

      <button class="control-btn decline-btn" @click="declineCall">
        <i class="icon-decline"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

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
const callActive = ref(false)

const acceptCall = () => {
  callStatus.value = '通话中...'
  callActive.value = true
  // 实现接受通话逻辑
}

const declineCall = () => {
  // 实现拒绝通话逻辑
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

.icon-accept::before {
  content: '✓';
}

.icon-decline::before {
  content: '✕';
}
</style>
