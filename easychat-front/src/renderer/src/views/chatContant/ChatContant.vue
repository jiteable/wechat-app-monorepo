<template>
  <div class="chat-contant-container">
    <WindowControls />
    <div class="chat-contant">{{ route.params.id ? route.params.id : 1 }}</div>
  </div>
</template>

<script setup>
import WindowControls from '@/components/WindowControls.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
console.log(route.params.id) // 当前用户ID
</script>

<style scoped>
.chat-contant-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgb(236, 237, 237);
}
</style>
