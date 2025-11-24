<template>
  <div></div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // 检查是否存在TOKEN
  const token = localStorage.getItem('TOKEN')
  // 通过IPC将结果发送回主进程
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('token-check-result', !!token)
  }
})
</script>
