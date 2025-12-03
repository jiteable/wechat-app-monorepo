<template>
  <div class="contact-apply-container">
    <!-- 窗口控制按钮 -->
    <WindowControls />

    <!-- 页面主要内容 -->
    <div class="contact-apply-content">
      <!-- 这里可以添加新朋友页面的具体内容 -->
      <div class="placeholder-text">新朋友页面</div>
    </div>
  </div>
</template>

<script setup>
import WindowControls from '@/components/WindowControls.vue'
</script>

<style scoped>
.contact-apply-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgb(236, 237, 237);
}

.contact-apply-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.placeholder-text {
  font-size: 16px;
  color: #999;
}
</style>
