<template>
  <div class="contact-container">
    <div class="contact-left-title">
      <div class="search-box">
        <el-input class="no-drag search-input" v-model="searchText" placeholder="搜索" clearable prefix-icon="Search" />
      </div>
    </div>
    <div class="chat-left-content">
      <button class="contact-button">通讯录管理</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const searchText = ref('')

</script>

<style scoped>
.contact-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.contact-left-title {
  border-bottom: 1px solid #e0e0e0;
  height: 80px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 5px;
  background-color: #ffffff;
}

.search-box {
  width: 100%;
}

.search-input {
  border-radius: 10px;
}

.contact-button {
  width: calc(100% - 11px);
  margin: 5px;
  height: 42px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 20px;
}
</style>
