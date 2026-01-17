<template>
  <ImageView :image-url="imageUrl" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ImageView from '@/components/imageView.vue'

const imageUrl = ref('')

onMounted(() => {
  // 监听来自主进程的图像URL数据
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.on('set-image-url', (event, url) => {
      imageUrl.value = url
    })
  }
})
</script>
