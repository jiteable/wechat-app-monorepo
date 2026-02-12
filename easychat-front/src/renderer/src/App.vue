<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'
import '@/assets/cust-elementplus.scss'
import '@/assets/icon/iconfont.css'
import '@/assets/base.scss'
import '@/assets/iconfont/iconfont.css'
import { useUserSetStore } from '@/store/userSetStore'

// 控制语言的响应式变量
const locale = ref(zhCn)

// 初始化时从localStorage读取语言设置
const savedLocale = localStorage.getItem('locale')
if (savedLocale === 'en') {
  locale.value = en
} else {
  locale.value = zhCn
}

// 获取用户设置store实例
const userSetStore = useUserSetStore()

// 监听用户设置store中的语言变化
watch(
  () => userSetStore.language,
  (newLanguage) => {
    if (newLanguage === 'en') {
      locale.value = en
    } else {
      locale.value = zhCn
    }
    console.log('改语言', locale.value)
    localStorage.setItem('locale', newLanguage)
  }
)

// 监听locale变化并保存到localStorage
watch(locale, (newLocale) => {
  console.log('改语言', newLocale)
  localStorage.setItem('locale', newLocale === en ? 'en' : 'zhCn')
})
</script>

<template>
  <el-config-provider :locale="locale">
    <router-view></router-view>
  </el-config-provider>
</template>

<style lang="less"></style>
