<template>
  <ImageView
    :image-url="imageUrl"
    :session-id="sessionId"
    :clicked-image-index="clickedImageIndex"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ImageView from '@/components/imageView.vue'

const route = useRoute()
const imageUrl = ref('')
const sessionId = ref('')
const clickedImageIndex = ref(-1)

onMounted(() => {
  // 从路由参数获取数据
  sessionId.value = route.params.sessionId
  clickedImageIndex.value = parseInt(route.params.clickedImageIndex) || -1

  // 监听来自主进程的图像URL数据
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.on('set-image-data', (event, data) => {
      imageUrl.value = data.imageUrl
      if (data.sessionId) sessionId.value = data.sessionId
      if (data.clickedImageIndex !== undefined) clickedImageIndex.value = data.clickedImageIndex
    })
  }
})
</script>
