<template>
  <div class="image-view-container">
    <div class="window-controls drag">
      <div class="window-button no-drag">
        <button class="button" type="button" @click="togglePin">
          <i class="iconfont icon-top" :style="{ color: isPinned ? '#87CEEB' : '' }"></i>
        </button>
        <button class="button" type="button" @click="minimizeWindow">
          <i class="iconfont icon-min"></i>
        </button>
        <button class="button" type="button" @click="toggleMaximize">
          <i
            class="iconfont"
            :class="isMaximized ? 'icon-maximize-copy' : 'icon-max'"
            :style="{ color: isMaximized ? '#87CEEB' : '' }"
          ></i>
        </button>
        <button class="button" type="button" @click="closeWindow">
          <i class="iconfont icon-close"></i>
        </button>
      </div>
    </div>

    <div class="image-container">
      <img :src="imageUrl" class="preview-image" @click="zoomImage" />
      <div v-if="sessionId && clickedImageIndex >= 0" class="image-info">
        会话ID: {{ sessionId }}, 图片索引: {{ clickedImageIndex }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  imageUrl: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    default: ''
  },
  clickedImageIndex: {
    type: Number,
    default: -1
  }
})

const isMaximized = ref(false)
const isPinned = ref(false)

const minimizeWindow = () => {
  if (window.api && typeof window.api.minimizeImageViewWindow === 'function') {
    window.api.minimizeImageViewWindow()
  }
}

const toggleMaximize = () => {
  isMaximized.value = !isMaximized.value
  if (window.api && typeof window.api.toggleMaximizeImageViewWindow === 'function') {
    window.api.toggleMaximizeImageViewWindow(isMaximized.value)
  }
}

const togglePin = () => {
  isPinned.value = !isPinned.value
  if (window.api && typeof window.api.toggleAlwaysOnTopImageViewWindow === 'function') {
    window.api.toggleAlwaysOnTopImageViewWindow(isPinned.value)
  }
}

const closeWindow = () => {
  if (window.api && typeof window.api.closeImageViewWindow === 'function') {
    window.api.closeImageViewWindow()
  }
}

const zoomImage = () => {
  // 图片点击放大功能
  console.log('Zoom image clicked')
}

// 监听键盘事件，ESC键关闭窗口
const handleEscKey = (event) => {
  if (event.key === 'Escape') {
    closeWindow()
  }
}

onMounted(() => {
  // 窗口被打开时打印imageUrl和其他参数
  console.log('ImageView opened with imageUrl:', props.imageUrl)
  console.log('Session ID:', props.sessionId)
  console.log('Clicked Image Index:', props.clickedImageIndex)
  document.addEventListener('keydown', handleEscKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
})
</script>

<style scoped>
.image-view-container {
  width: 100%;
  height: 100vh;
  background-color: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.window-controls {
  height: 80px;
  flex-shrink: 0;
  position: relative;
}

.window-button {
  position: absolute;
  top: 0;
  right: 0;
  height: 40px;
  display: flex;
  align-items: center;
  padding-right: 10px;
}

.button {
  width: 36px;
  height: 30px;
  margin-left: 2px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button:hover {
  background-color: rgb(225, 225, 225);
}

.button i {
  font-size: 13px;
}

.image-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
  padding: 40px 0;
  /* 为顶部控件留出空间 */
  position: relative;
}

.preview-image {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  cursor: zoom-in;
  border-radius: 4px;
}

.image-info {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
