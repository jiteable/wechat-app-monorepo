<template>
  <ImageView :image-url="imageUrl" :session-id="sessionId" :clicked-image-index="clickedImageIndex"
    :image-messages="imageMessages" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ImageView from '@/components/imageView.vue'

const route = useRoute()
const imageUrl = ref('')
const sessionId = ref('')
const clickedImageIndex = ref(-1)
const imageMessages = ref([])

onMounted(async () => {
  // 从路由参数获取数据
  sessionId.value = route.params.sessionId
  clickedImageIndex.value = parseInt(route.params.clickedImageIndex) || -1

  // 获取该会话的所有图片消息
  if (sessionId.value && window.api) {
    try {
      const response = await window.api.getImageMessagesBySessionId(sessionId.value)
      if (response.success) {
        imageMessages.value = response.data
        console.log('获取到图片消息数量:', response.data.length)
      } else {
        console.error('获取图片消息失败:', response.error)
      }
    } catch (error) {
      console.error('获取图片消息时发生错误:', error)
    }
  }

  // 监听来自主进程的图像URL数据
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.on('set-image-data', (event, data) => {
      if (data.imageUrl) imageUrl.value = data.imageUrl
      if (data.sessionId) sessionId.value = data.sessionId
      if (data.clickedImageIndex !== undefined) clickedImageIndex.value = data.clickedImageIndex
    })
  }
})
</script>
