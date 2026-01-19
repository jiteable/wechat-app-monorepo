<template>
  <div class="image-view-container">
    <div class="window-controls drag">
      <!-- 新增：左侧操作图标 -->
      <div class="image-controls left no-drag">
        <button class="button" type="button" :disabled="currentIndex === 0" @click="prevImage">
          <i
            class="iconfont icon-left"
            :class="{ 'disabled-icon': currentIndex === 0 }"
            :style="{ color: currentIndex === 0 ? 'rgb(165, 165, 165)' : '' }"
          ></i>
        </button>
        <button
          class="button"
          type="button"
          :disabled="currentIndex === props.imageMessages.length - 1"
          @click="nextImage"
        >
          <i
            class="iconfont icon-right"
            :class="{ 'disabled-icon': currentIndex === props.imageMessages.length - 1 }"
            :style="{
              color: currentIndex === props.imageMessages.length - 1 ? 'rgb(165, 165, 165)' : ''
            }"
          ></i>
        </button>
        <button class="button" type="button" @click="downloadImage">
          <i class="iconfont icon-download"></i>
        </button>
        <button class="button" type="button" @click="zoomIn">
          <i class="iconfont icon-enlarge"></i>
        </button>
        <button class="button" type="button" @click="zoomOut">
          <i class="iconfont icon-narrow"></i>
        </button>
      </div>

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
      <img :src="currentImageUrl" class="preview-image" @click="zoomImage" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'

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
  },
  imageMessages: {
    type: Array,
    default: () => []
  }
})

const isMaximized = ref(false)
const isPinned = ref(false)

// 使用计算属性来获取当前显示的图片索引
const currentIndex = ref(props.clickedImageIndex >= 0 ? props.clickedImageIndex : 0)

// 计算当前图片URL
const currentImageUrl = computed(() => {
  if (
    props.imageMessages &&
    props.imageMessages.length > 0 &&
    currentIndex.value >= 0 &&
    currentIndex.value < props.imageMessages.length
  ) {
    return (
      props.imageMessages[currentIndex.value].mediaUrl ||
      props.imageMessages[currentIndex.value].imageUrl
    )
  }
  return props.imageUrl
})

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

// 导航到上一张图片
const prevImage = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    console.log('Switched to newer image:', currentIndex.value)
  }
}

const nextImage = () => {
  if (currentIndex.value < props.imageMessages.length - 1) {
    currentIndex.value++
    console.log('Switched to older image:', currentIndex.value)
  }
}

// 修改下载图片功能，支持用户选择下载路径
const downloadImage = async () => {
  try {
    // 获取当前图片URL
    const imageUrl = currentImageUrl.value

    // 从URL中提取文件名
    let fileName = 'image.jpg'
    try {
      const urlObj = new URL(imageUrl)
      const pathname = urlObj.pathname
      const extractedFileName = pathname.split('/').pop() || ''

      // 检查提取的文件名是否有有效扩展名
      if (extractedFileName && extractedFileName.includes('.')) {
        const extension = extractedFileName.split('.').pop()?.toLowerCase()
        if (extension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
          fileName = extractedFileName
        } else {
          fileName = extractedFileName + '.jpg'
        }
      } else {
        fileName = extractedFileName + '.jpg' || 'image.jpg'
      }
    } catch (urlError) {
      console.error('Invalid image URL:', urlError)
    }

    // 使用 IPC 调用主进程来打开文件选择对话框
    const result = await window.api.showSaveDialog({
      title: '保存图片',
      defaultPath: fileName,
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (result.canceled) {
      // 用户取消了选择
      console.log('用户取消了下载')
      return
    }

    const selectedPath = result.filePath
    if (!selectedPath) {
      console.error('未选择有效的保存路径')
      ElMessage.error('未选择有效的保存路径')
      return
    }

    // 显示正在下载提示
    const loading = ElLoading.service({
      text: '正在下载图片...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    // 通过IPC发送下载图片请求到主进程，指定下载路径
    if (window.api && typeof window.api.downloadFileToPath === 'function') {
      const downloadResult = await window.api.downloadFileToPath(imageUrl, fileName, selectedPath)

      loading.close()

      if (downloadResult.success) {
        ElMessage.success(`图片已保存到: ${selectedPath}`)
      } else {
        ElMessage.error(`图片下载失败: ${downloadResult.error}`)

        // 如果通过IPC下载失败，尝试浏览器下载方式
        console.log('尝试使用浏览器下载方式...')
        attemptBrowserDownload(imageUrl, fileName)
      }
    } else {
      loading.close()
      // 如果没有downloadFileToPath方法，则使用浏览器下载方式
      ElMessage.info('正在使用浏览器下载...')
      attemptBrowserDownload(imageUrl, fileName)
    }
  } catch (error) {
    console.error('下载过程中出错:', error)
    ElMessage.error('下载过程中出错: ' + (error.message || '未知错误'))
  }
}

// 尝试使用浏览器默认下载
const attemptBrowserDownload = (url, filename) => {
  try {
    // 创建一个隐藏的链接元素来触发下载
    const link = document.createElement('a')
    link.style.display = 'none'
    link.href = url
    link.download = filename // 设置下载文件名
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('已启动浏览器下载')
  } catch (error) {
    console.error('浏览器下载失败:', error)
    try {
      // 备选方案：在新窗口中打开
      window.open(url, '_blank')
      ElMessage.info('已在新窗口中打开图片链接')
    } catch (openError) {
      console.error('打开新窗口也失败:', openError)
      ElMessage.error('无法下载图片，请检查网络连接或稍后再试')
    }
  }
}

const zoomIn = () => {
  // 实现放大逻辑，例如通过 CSS 或图片缩放
  console.log('Zoom in')
}

const zoomOut = () => {
  // 实现缩小逻辑
  console.log('Zoom out')
}

// 监听键盘事件，ESC键关闭窗口，左右箭头导航图片
const handleKeyDown = (event) => {
  switch (event.key) {
    case 'Escape':
      closeWindow()
      break
    case 'ArrowLeft':
      prevImage()
      break
    case 'ArrowRight':
      nextImage()
      break
  }
}

// 监听键盘事件
document.addEventListener('keydown', handleKeyDown)

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

// 监听props变化
watch(
  () => props.imageMessages,
  (newVal) => {
    // 当图片数组改变时，确保currentIndex在有效范围内
    if (currentIndex.value >= newVal.length) {
      currentIndex.value = newVal.length > 0 ? newVal.length - 1 : 0
    }
  }
)

watch(
  () => props.imageUrl,
  (newVal) => {
    // 如果当前没有有效的图片消息列表，使用传入的imageUrl
    if (!props.imageMessages || props.imageMessages.length === 0) {
      // 不需要做任何事，因为computed会自动更新
    }
  }
)

onMounted(() => {
  // 窗口被打开时打印imageUrl和其他参数
  console.log('ImageView opened with imageUrl:', props.imageUrl)
  console.log('Session ID:', props.sessionId)
  console.log('Clicked Image Index:', props.clickedImageIndex)
  console.log('Total images in session:', props.imageMessages.length)

  // 确保currentIndex的初始值正确反映禁用状态
  if (props.imageMessages.length > 0) {
    if (currentIndex.value < 0) {
      currentIndex.value = 0
    } else if (currentIndex.value >= props.imageMessages.length) {
      currentIndex.value = props.imageMessages.length - 1
    }
  } else {
    currentIndex.value = 0
  }
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
  height: 50px;
  flex-shrink: 0;
  position: relative;
  background-color: rgb(237, 237, 237);
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

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button i {
  font-size: 13px;
}

.button i.disabled-icon {
  color: rgb(165, 165, 165);
}

.image-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: auto;
  /* 为顶部控件留出空间 */
  position: relative;
}

.preview-image {
  max-width: 90vw;
  max-height: 75vh;
  /* 留出空间给导航控件 */
  object-fit: contain;
  cursor: zoom-in;
  border-radius: 4px;
  margin-bottom: 20px;
}

.image-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 90%;
  margin-top: 10px;
}

.nav-button {
  padding: 8px 16px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.image-counter {
  font-size: 16px;
  color: #333;
  background-color: rgba(0, 0, 0, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
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

.image-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 10px;
}

.image-controls.left {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
}
</style>
