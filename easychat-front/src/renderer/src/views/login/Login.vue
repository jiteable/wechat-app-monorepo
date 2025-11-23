<!-- eslint-disable prettier/prettier -->

<template>
  <div class="login-container">
    <div class="login-form">
      <h2>用户登录</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">用户名:</label>
          <input id="username" v-model="loginForm.username" type="text" required placeholder="请输入用户名" />
        </div>
        <div class="form-group">
          <label for="password">密码:</label>
          <input id="password" v-model="loginForm.password" type="password" required placeholder="请输入密码" />
        </div>
        <div class="form-actions">
          <button type="submit" class="login-button">登录</button>
          <button type="button" class="register-button" @click="handleRegister">注册</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const loginForm = reactive({
  username: '',
  password: ''
})

const handleLogin = () => {
  // 简单验证
  if (loginForm.username && loginForm.password) {
    // 这里应该调用登录API
    console.log('登录信息:', loginForm)
    // 登录成功后跳转到主页
    router.push('/home')
  } else {
    alert('请填写完整信息')
  }
}

const handleRegister = () => {
  // 注册功能可以在这里实现
  console.log('跳转到注册页面')
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.login-form {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.login-form h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: space-between;
  margin-top: 20px;
}

.login-button,
.register-button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.login-button {
  background-color: #409eff;
  color: white;
}

.register-button {
  background-color: #67c23a;
  color: white;
}
</style>
