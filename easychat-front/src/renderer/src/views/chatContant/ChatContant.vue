<template>
  <div class="chat-contant-container">
    <WindowControls />
    <div class="chat-contant">123</div>
  </div>
</template>

<script setup>
import WindowControls from '@/components/WindowControls.vue'
</script>

<style scoped>
.chat-contant-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgb(236, 237, 237);
}
</style>
