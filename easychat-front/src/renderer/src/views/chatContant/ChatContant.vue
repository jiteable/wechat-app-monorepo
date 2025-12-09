<template>
  <div class="chat-contant-container">
    <WindowControls />
    <div class="chat-contant">
      <div v-if="route.params.id" class="chat-id">
        <el-splitter layout="vertical">
          <el-splitter-panel size="60%">
            <div class="demo-panel">1</div>
          </el-splitter-panel>
          <el-splitter-panel :min="185" :max="380">
            <div class="demo-panel">
              <div class="chat-input-area">
                <div class="input-icons">
                  <el-button type="text" @click="showEmojiPicker">
                    <span class="icon iconfont icon-xiaolian"></span>
                  </el-button>
                  <el-button type="text" @click="uploadFile">
                    <span class="icon iconfont icon-wenjian"></span>
                  </el-button>
                </div>

                <div class="input-content">
                  <el-input v-model="message" type="textarea" placeholder="输入消息..." maxlength="2000" resize="none"
                    @keydown.enter.native="handleEnterKey" />
                </div>

                <div class="input-actions">
                  <el-button type="primary" :disabled="!message" @click="sendMessage">
                    发送(S)
                  </el-button>
                </div>
              </div>
            </div>
          </el-splitter-panel>
        </el-splitter>
      </div>
      <div v-else class="empty-chat">
        <el-icon :size="100" color="#c0c4cc">
          <Message />
        </el-icon>
        <p>请选择一个聊天</p>
      </div>
    </div>

    <!-- 添加聊天输入区域 -->
  </div>
</template>

<script setup>
import WindowControls from '@/components/WindowControls.vue'
import { useRoute } from 'vue-router'
import { Message, More } from '@element-plus/icons-vue'
import { ref, nextTick } from 'vue'

const route = useRoute()
console.log(route.params.id) // 当前用户ID

// 输入框数据
const message = ref('')

// 发送消息
const sendMessage = () => {
  if (message.value.trim()) {
    console.log('发送消息:', message.value)
    message.value = ''
  }
}

const handleEnterKey = (event) => {
  // 如果按下的是 Ctrl+Enter 或 Shift+Enter，则换行
  if (event.ctrlKey || event.shiftKey) {
    const startPos = event.target.selectionStart
    const endPos = event.target.selectionEnd
    message.value = message.value.substring(0, startPos) + '\n' + message.value.substring(endPos)
    // 等待 DOM 更新后再设置光标位置
    nextTick(() => {
      event.target.selectionStart = startPos + 1
      event.target.selectionEnd = startPos + 1
    })
  } else {
    // 单独按 Enter 键发送消息
    event.preventDefault()
    sendMessage()
  }
}

// 显示表情选择器
const showEmojiPicker = () => {
  console.log('显示表情选择器')
}

// 上传文件
const uploadFile = () => {
  console.log('上传文件')
}

// 插入代码
const insertCode = () => {
  console.log('插入代码')
}

// 开始通话
const startCall = () => {
  console.log('开始通话')
}

// 开始视频通话
const startVideoCall = () => {
  console.log('开始视频通话')
}
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

.chat-id {
  width: 100%;
  height: 100%;
  background: skyblue;
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

.demo-panel {
  height: 100%;
  background-color: rgb(237, 237, 237);
}

/* 聊天输入区域样式 */
.chat-input-area {
  height: 100%;
  padding: 10px;
  background-color: rgb(237, 237, 237);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-icons {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-left: 5px;
}

.input-icons .el-button {
  padding: 0;
  min-width: auto;
  border: none;
  background: transparent;
}

.input-icons .el-icon {
  font-size: 24px;
  color: #606266;
}

.input-icons .iconfont {
  font-size: 24px;
  color: #606266;
}

.input-content {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
}

.input-content .el-textarea {
  flex: 1;
  height: 100%;
}

.input-content :deep(.el-textarea__inner) {
  height: 100%;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  resize: none;
  box-shadow: 0 0 0 0 transparent;
  box-sizing: border-box;
  background-color: rgb(237, 237, 237);
}

.input-content :deep(.el-textarea__inner:focus) {
  outline: none;
  border: none;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  align-items: center;
}

.input-actions .el-button {
  padding: 0;
  min-width: auto;
  border: none;
  background: transparent;
}

.input-actions .el-button--primary {
  background-color: #409eff;
  color: white;
  border-radius: 4px;
  padding: 6px 12px;
}

.input-actions .el-icon {
  font-size: 18px;
  color: #606266;
}
</style>
