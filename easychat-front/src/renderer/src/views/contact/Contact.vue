<template>
  <div class="contact-container">
    <div class="contact-left-title">
      <div class="search-box">
        <el-input class="no-drag search-input" v-model="searchText" placeholder="搜索" clearable prefix-icon="Search" />
      </div>
    </div>
    <div class="chat-left-content no-drag">
      <button class="contact-button">
        <i class="iconfont icon-user"></i>
        通讯录管理
      </button>
      <button class="drop-button" @click="toggleButton(0)">
        <el-icon>
          <component :is="buttonStates[0] ? 'ArrowDown' : 'ArrowRight'" />
        </el-icon>
        新的朋友
      </button>
      <button class="drop-button" @click="toggleButton(1)">
        <el-icon>
          <component :is="buttonStates[1] ? 'ArrowDown' : 'ArrowRight'" />
        </el-icon>
        群聊
      </button>
      <button class="drop-button" @click="toggleButton(2)">
        <el-icon>
          <component :is="buttonStates[2] ? 'ArrowDown' : 'ArrowRight'" />
        </el-icon>
        联系人
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const searchText = ref('')

// 按钮状态管理，false表示ArrowRight，true表示ArrowDown
const buttonStates = reactive([false, false, false])

// 切换按钮状态
const toggleButton = (index) => {
  buttonStates[index] = !buttonStates[index]
}
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

.drop-button {
  width: 100%;
  border: none;
  background-color: white;
  text-align: left;
  padding-left: 15px;
  height: 40px;
}

.drop-button:hover {
  background-color: #f5f5f5;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 20px;
}
</style>
