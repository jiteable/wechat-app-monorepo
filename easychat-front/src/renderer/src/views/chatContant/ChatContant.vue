<template>
  <div class="chat-contant-container">
    <WindowControls />
    <div class="chat-contant">
      <div v-if="route.params.id" class="chat-id">{{ route.params.id }}</div>
      <div v-else class="empty-chat">
        <el-icon :size="100" color="#c0c4cc">
          <Message />
        </el-icon>
        <p>请选择一个聊天</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import WindowControls from '@/components/WindowControls.vue'
import { useRoute } from 'vue-router'
import { Message } from '@element-plus/icons-vue'

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

.chat-contant {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.empty-chat p {
  margin-top: 20px;
  font-size: 16px;
}
</style>
