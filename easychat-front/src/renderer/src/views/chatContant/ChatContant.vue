<template>
  <div class="chat-contant-container">
    <div class="chat-contant-title">
      <div class="window-botton">
        <el-button link class="button">1</el-button>
        <el-button link class="button">2</el-button>
        <el-button link class="button">3</el-button>
        <el-button link class="button">4</el-button>
      </div>
    </div>
    <div class="chat-contant">123</div>
  </div>
</template>

<script setup></script>

<style scoped>
.chat-contant-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgb(236, 237, 237);
}

.chat-contant-title {
  border-bottom: 1px solid rgb(213, 213, 213);
  height: 80px;
  flex-shrink: 0;
}

.window-button {
  float: right;
}

.chat-contant {
  flex: 1;
  overflow: auto;
}
</style>
