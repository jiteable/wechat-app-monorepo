<template>
  <div class="chat-contant-container">
    <div class="chat-contant-title">
      <div class="window-button no-drag">
        <el-button link class="button" @click="toggleAlwaysOnTop">
          <i class="iconfont icon-top" :style="{ color: isAlwaysOnTop ? '#87CEEB' : '' }"></i>
        </el-button>
        <el-button link class="button" @click="minimizeWindow">
          <i class="iconfont icon-min"></i>
        </el-button>
        <el-button link class="button" @click="toggleMaximize">
          <i class="iconfont" :class="isMaximized ? 'icon-maximize-copy' : 'icon-max'"
            :style="{ color: isMaximized ? '#87CEEB' : '' }"></i>
        </el-button>
        <el-button link class="button" @click="closeWindow">
          <i class="iconfont icon-close"></i>
        </el-button>
      </div>
    </div>
    <div class="chat-contant">123</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isAlwaysOnTop = ref(false)
const isMaximized = ref(false)

const toggleAlwaysOnTop = () => {
  // 切换状态
  isAlwaysOnTop.value = !isAlwaysOnTop.value

  // 通过 IPC 向主进程发送切换窗口置顶状态的消息
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('toggle-always-on-top', isAlwaysOnTop.value)
  }
}

const closeWindow = () => {
  // 通过 IPC 向主进程发送关闭窗口的消息
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('close-main-window')
  }
}

const minimizeWindow = () => {
  // 通过 IPC 向主进程发送最小化窗口的消息
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('minimize-main-window')
  }
}

const toggleMaximize = () => {
  // 切换最大化状态
  isMaximized.value = !isMaximized.value

  // 通过 IPC 向主进程发送切换最大化状态的消息
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('toggle-maximize-window', isMaximized.value)
  }
}
</script>

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
  position: relative;
}

.window-button {
  position: absolute;
  top: 0;
  right: 0;
  height: 40px;
  display: flex;
  align-items: center;
  padding-right: 10px;
}

.chat-contant {
  flex: 1;
  overflow: auto;
}
</style>
