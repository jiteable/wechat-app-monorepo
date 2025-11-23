<script setup lang="ts">
import { ref, watch, reactive, getCurrentInstance, nextTick } from 'vue'
import { ElConfigProvider } from 'element-plus'
import { en, zhCn } from 'element-plus/es/locale/index.mjs'

const { proxy } = getCurrentInstance()

// 控制语言的响应式变量
const locale = ref(zhCn)

const config = reactive({
  max: 1
})

// 可以通过监听存储或其他方式来保持语言设置
// 示例：从localStorage读取语言设置
const savedLocale = localStorage.getItem('locale')
if (savedLocale === 'en') {
  locale.value = en
} else {
  locale.value = zhCn
}

// 监听语言变化并保存到localStorage
watch(locale, (newLocale) => {
  localStorage.setItem('locale', newLocale === en ? 'en' : 'zhCn')
})
</script>

<template>
  <el-config-provider :locale="locale">
    <router-view></router-view>
  </el-config-provider>
</template>

<style lang="less"></style>
