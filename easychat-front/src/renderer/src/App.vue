<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'
import '@/assets/cust-elementplus.scss'
import '@/assets/icon/iconfont.css'
import '@/assets/base.scss'

// 控制语言的响应式变量
const locale = ref(zhCn)

// const config = reactive({
//   max: 1
// })

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
