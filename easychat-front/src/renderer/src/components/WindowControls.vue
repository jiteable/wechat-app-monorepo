<template>
  <div class="window-controls drag" @dblclick="handleDoubleClick">
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
    <slot></slot>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import {
  windowState,
  toggleAlwaysOnTop,
  toggleMaximize,
  minimizeWindow,
  closeWindow
} from '@/utils/windowState'

const isAlwaysOnTop = windowState.isAlwaysOnTop
const isMaximized = windowState.isMaximized

// 处理双击事件
const handleDoubleClick = () => {
  toggleMaximize()
}

// 监听窗口状态变化事件
const handleMaximize = () => {
  windowState.isMaximized.value = true
}

const handleUnmaximize = () => {
  windowState.isMaximized.value = false
}

onMounted(() => {
  // 通过 IPC 监听窗口最大化状态变化
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.on('window-maximized', handleMaximize)
    window.electron.ipcRenderer.on('window-unmaximized', handleUnmaximize)
  }
})

onUnmounted(() => {
  // 清理事件监听器
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.removeListener('window-maximized', handleMaximize)
    window.electron.ipcRenderer.removeListener('window-unmaximized', handleUnmaximize)
  }
})
</script>

<style scoped>
.window-controls {
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
</style>
